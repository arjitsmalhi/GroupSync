import { Board, Member } from './schema';

export const WORKLOAD_CONFIG = {
  MIN_THRESHOLD_PERCENT: 40,
  BUFFER_PERCENT: 15,
} as const;

export interface MemberWorkload {
  member: Member;
  totalEffort: number;
  activeEffort: number;
  completedEffort: number;
  taskCount: number;
  sharePercent: number; // percentage of total assigned effort (0-100)
  isOverloaded: boolean;
  thresholdPercent: number;
  warningMessage: string | null;
}

export interface WorkloadSummary {
  totalEffort: number;
  assignedEffort: number;
  unassignedEffort: number;
  unassignedTaskCount: number;
  fairSharePercent: number;
  overloadThresholdPercent: number;
  memberWorkloads: MemberWorkload[];
  overloadedMembers: MemberWorkload[];
  hasWarnings: boolean;
  unassignedWarning: string | null;
}

export function calculateOverloadThreshold(memberCount: number): number {
  if (memberCount <= 0) return 100;
  const fairShare = 100 / memberCount;
  return Math.max(WORKLOAD_CONFIG.MIN_THRESHOLD_PERCENT, fairShare + WORKLOAD_CONFIG.BUFFER_PERCENT);
}

export function calculateWorkload(board: Board): WorkloadSummary {
  const activeTasks = board.tasks.filter((t) => !t.deletedAt);
  const memberCount = board.members.length;
  const fairSharePercent = memberCount > 0 ? 100 / memberCount : 0;
  const thresholdPercent = calculateOverloadThreshold(memberCount);

  let totalEffort = 0;
  let unassignedEffort = 0;
  let unassignedTaskCount = 0;

  const memberEffortMap = new Map<
    string,
    { totalEffort: number; activeEffort: number; completedEffort: number; taskCount: number }
  >();

  for (const m of board.members) {
    memberEffortMap.set(m.id, { totalEffort: 0, activeEffort: 0, completedEffort: 0, taskCount: 0 });
  }

  for (const task of activeTasks) {
    const effort = task.effort || 2;
    totalEffort += effort;

    if (!task.assigneeId || !memberEffortMap.has(task.assigneeId)) {
      unassignedEffort += effort;
      unassignedTaskCount += 1;
    } else {
      const entry = memberEffortMap.get(task.assigneeId)!;
      entry.totalEffort += effort;
      entry.taskCount += 1;
      if (task.status === 'done') {
        entry.completedEffort += effort;
      } else {
        entry.activeEffort += effort;
      }
    }
  }

  const assignedEffort = totalEffort - unassignedEffort;

  const memberWorkloads: MemberWorkload[] = board.members.map((member) => {
    const stats = memberEffortMap.get(member.id) ?? {
      totalEffort: 0,
      activeEffort: 0,
      completedEffort: 0,
      taskCount: 0,
    };

    // Share is relative to total assigned project effort (if 0 assigned, share is 0)
    const sharePercent = assignedEffort > 0 ? (stats.totalEffort / assignedEffort) * 100 : 0;
    const roundedShare = Math.round(sharePercent);
    const isOverloaded = memberCount > 1 && roundedShare > thresholdPercent && stats.totalEffort > 0;

    let warningMessage: string | null = null;
    if (isOverloaded) {
      warningMessage = `${member.name} has ${roundedShare}% of the work. Consider moving something.`;
    }

    return {
      member,
      totalEffort: stats.totalEffort,
      activeEffort: stats.activeEffort,
      completedEffort: stats.completedEffort,
      taskCount: stats.taskCount,
      sharePercent: roundedShare,
      isOverloaded,
      thresholdPercent: Math.round(thresholdPercent),
      warningMessage,
    };
  });

  const overloadedMembers = memberWorkloads.filter((m) => m.isOverloaded);

  let unassignedWarning: string | null = null;
  if (unassignedTaskCount > 0) {
    unassignedWarning = `${unassignedTaskCount} task${unassignedTaskCount > 1 ? 's' : ''} (${unassignedEffort} effort pt${unassignedEffort > 1 ? 's' : ''}) unassigned.`;
  }

  return {
    totalEffort,
    assignedEffort,
    unassignedEffort,
    unassignedTaskCount,
    fairSharePercent: Math.round(fairSharePercent * 10) / 10,
    overloadThresholdPercent: Math.round(thresholdPercent * 10) / 10,
    memberWorkloads,
    overloadedMembers,
    hasWarnings: overloadedMembers.length > 0 || unassignedTaskCount > 0,
    unassignedWarning,
  };
}

