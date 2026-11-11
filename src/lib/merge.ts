import { Board, LogEntry, Member, Milestone, Task, createId } from './schema';

export interface MergeSummary {
  tasksAdded: number;
  tasksUpdated: number;
  tasksDeleted: number;
  membersAdded: number;
  logEntriesAdded: number;
  milestonesSource: 'local' | 'incoming';
  details: string[];
}

export interface MergeResult {
  mergedBoard: Board;
  summary: MergeSummary;
}

export function mergeBoards(local: Board, incoming: Board, actorId: string | null = null): MergeResult {
  const details: string[] = [];
  let tasksAdded = 0;
  let tasksUpdated = 0;
  let tasksDeleted = 0;
  let membersAdded = 0;
  let logEntriesAdded = 0;

  const localUpdatedMs = new Date(local.updatedAt).getTime();
  const incomingUpdatedMs = new Date(incoming.updatedAt).getTime();
  const incomingIsNewer = incomingUpdatedMs > localUpdatedMs;

  // 1. Members: union by id
  const memberMap = new Map<string, Member>();
  for (const m of local.members) {
    memberMap.set(m.id, m);
  }
  for (const m of incoming.members) {
    if (!memberMap.has(m.id)) {
      memberMap.set(m.id, m);
      membersAdded++;
      details.push(`Added team member "${m.name}"`);
    }
  }
  const mergedMembers = Array.from(memberMap.values());

  // 2. Milestones: take from newer board
  const milestonesSource: 'local' | 'incoming' = incomingIsNewer ? 'incoming' : 'local';
  const mergedMilestones: Milestone[] = incomingIsNewer ? [...incoming.milestones] : [...local.milestones];
  if (incomingIsNewer && JSON.stringify(incoming.milestones) !== JSON.stringify(local.milestones)) {
    details.push('Updated milestones from incoming project version');
  }

  // 3. Tasks: newest updatedAt wins (deletedAt counts as an update)
  const taskMap = new Map<string, Task>();
  for (const t of local.tasks) {
    taskMap.set(t.id, t);
  }

  for (const inTask of incoming.tasks) {
    const localTask = taskMap.get(inTask.id);
    if (!localTask) {
      taskMap.set(inTask.id, inTask);
      tasksAdded++;
      details.push(`Added task "${inTask.title}"`);
    } else {
      const localTaskUpdated = new Date(localTask.updatedAt).getTime();
      const inTaskUpdated = new Date(inTask.updatedAt).getTime();

      if (inTaskUpdated > localTaskUpdated) {
        taskMap.set(inTask.id, inTask);
        tasksUpdated++;
        if (!localTask.deletedAt && inTask.deletedAt) {
          tasksDeleted++;
          details.push(`Marked task "${inTask.title}" as deleted`);
        } else {
          details.push(`Updated task "${inTask.title}"`);
        }
      }
    }
  }
  const mergedTasks = Array.from(taskMap.values());

  // 4. Log entries: union by id and sort by ts ascending
  const logMap = new Map<string, LogEntry>();
  for (const entry of local.log) {
    logMap.set(entry.id, entry);
  }
  for (const entry of incoming.log) {
    if (!logMap.has(entry.id)) {
      logMap.set(entry.id, entry);
      logEntriesAdded++;
    }
  }

  const nowIso = new Date().toISOString();

  // 5. Notes: merge dictionary
  const mergedMemberNotes: Record<string, string> = {
    ...(local.memberNotes || {}),
    ...(incoming.memberNotes || {}),
  };

  const mergeLogEntry: LogEntry = {
    id: createId('log'),
    ts: nowIso,
    actorId,
    type: 'merged',
    taskId: null,
    summary: `Merged with external snapshot (${tasksAdded} added, ${tasksUpdated} updated, ${logEntriesAdded} logs synced).`,
  };

  const sortedLogs = Array.from(logMap.values())
    .concat([mergeLogEntry])
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const mergedBoard: Board = {
    schemaVersion: Math.max(local.schemaVersion, incoming.schemaVersion),
    id: local.id,
    name: incomingIsNewer && incoming.name ? incoming.name : local.name,
    course: incomingIsNewer ? incoming.course ?? local.course : local.course ?? incoming.course,
    createdAt: local.createdAt,
    updatedAt: nowIso,
    startDate: incomingIsNewer ? incoming.startDate : local.startDate,
    dueDate: incomingIsNewer ? incoming.dueDate : local.dueDate,
    members: mergedMembers,
    milestones: mergedMilestones,
    tasks: mergedTasks,
    log: sortedLogs,
    memberNotes: mergedMemberNotes,
  };

  return {
    mergedBoard,
    summary: {
      tasksAdded,
      tasksUpdated,
      tasksDeleted,
      membersAdded,
      logEntriesAdded,
      milestonesSource,
      details,
    },
  };
}

