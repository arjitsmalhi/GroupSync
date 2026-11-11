import { Board, Member } from './schema';
import { parseDateSafe, getDerivedMilestones, DerivedMilestone } from './milestones';
import { generateBoardFingerprint, IntegrityFingerprint } from './integrity';

export interface MemberReportStats {
  member: Member;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRatePercent: number; // completed / assigned
  completedEffortPoints: number;
  effortWeightedSharePercent: number; // member's completed effort / total completed effort
  onTimeCompletedCount: number;
  onTimeRatePercent: number | null; // null if 0 completed tasks
  loggedActivitiesCount: number;
  note: string;
}

export interface ReportData {
  projectName: string;
  course?: string;
  startDate: string;
  dueDate: string;
  generatedAt: string;
  totalTasks: number;
  completedTasks: number;
  totalEffortPoints: number;
  completedEffortPoints: number;
  members: MemberReportStats[];
  milestones: DerivedMilestone[];
  logs: {
    id: string;
    ts: string;
    actorName: string;
    type: string;
    summary: string;
  }[];
  integrity: IntegrityFingerprint;
  disclaimer: string;
}

export const REPORT_DISCLAIMER =
  'This report is generated from a self-reported activity log and is meant as supporting evidence, not proof.';

export async function buildReportData(board: Board): Promise<ReportData> {
  const generatedAt = new Date().toISOString();
  const integrity = await generateBoardFingerprint(board, generatedAt);
  const derivedMilestones = getDerivedMilestones(board, new Date());

  const nonDeletedTasks = board.tasks.filter((t) => !t.deletedAt);
  const completedTasksList = nonDeletedTasks.filter((t) => t.status === 'done');

  let totalEffortPoints = 0;
  for (const t of nonDeletedTasks) {
    totalEffortPoints += t.effort || 2;
  }

  let totalCompletedEffort = 0;
  for (const t of completedTasksList) {
    totalCompletedEffort += t.effort || 2;
  }

  // Member map for quick name resolution
  const memberMap = new Map<string, Member>();
  for (const m of board.members) {
    memberMap.set(m.id, m);
  }

  // Count logs per actor
  const logCountByActor = new Map<string, number>();
  for (const entry of board.log) {
    if (entry.actorId) {
      logCountByActor.set(entry.actorId, (logCountByActor.get(entry.actorId) || 0) + 1);
    }
  }

  // Member stats
  const memberStats: MemberReportStats[] = board.members.map((member) => {
    const assignedTasks = nonDeletedTasks.filter((t) => t.assigneeId === member.id);
    const completedTasks = assignedTasks.filter((t) => t.status === 'done');

    let completedEffort = 0;
    let onTimeCount = 0;

    for (const t of completedTasks) {
      completedEffort += t.effort || 2;

      // On-time check
      if (t.dueDate && t.completedAt) {
        // Due date end of day
        const dueEndMs = parseDateSafe(t.dueDate).getTime() + 24 * 3600 * 1000 - 1;
        const completedMs = new Date(t.completedAt).getTime();
        if (completedMs <= dueEndMs) {
          onTimeCount++;
        }
      } else {
        // No due date, count as on time
        onTimeCount++;
      }
    }

    const completionRatePercent =
      assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : 0;

    const effortWeightedSharePercent =
      totalCompletedEffort > 0 ? Math.round((completedEffort / totalCompletedEffort) * 100) : 0;

    const onTimeRatePercent =
      completedTasks.length > 0 ? Math.round((onTimeCount / completedTasks.length) * 100) : null;

    const loggedActivitiesCount = logCountByActor.get(member.id) || 0;
    const note = board.memberNotes?.[member.id]?.trim() || '';

    return {
      member,
      tasksAssigned: assignedTasks.length,
      tasksCompleted: completedTasks.length,
      completionRatePercent,
      completedEffortPoints: completedEffort,
      effortWeightedSharePercent,
      onTimeCompletedCount: onTimeCount,
      onTimeRatePercent,
      loggedActivitiesCount,
      note,
    };
  });

  const formattedLogs = board.log
    .slice()
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .map((l) => ({
      id: l.id,
      ts: l.ts,
      actorName: l.actorId ? memberMap.get(l.actorId)?.name || 'Unknown' : 'System',
      type: l.type,
      summary: l.summary,
    }));

  return {
    projectName: board.name,
    course: board.course,
    startDate: board.startDate,
    dueDate: board.dueDate,
    generatedAt,
    totalTasks: nonDeletedTasks.length,
    completedTasks: completedTasksList.length,
    totalEffortPoints,
    completedEffortPoints: totalCompletedEffort,
    members: memberStats,
    milestones: derivedMilestones,
    logs: formattedLogs,
    integrity,
    disclaimer: REPORT_DISCLAIMER,
  };
}

export function generateReportMarkdown(report: ReportData): string {
  const lines: string[] = [];

  lines.push(`# Project Contribution Report: ${report.projectName}`);
  if (report.course) {
    lines.push(`**Course:** ${report.course}`);
  }
  lines.push(`**Project Timeline:** ${report.startDate} to ${report.dueDate}`);
  lines.push(`**Report Generated:** ${new Date(report.generatedAt).toLocaleString()} (UTC: ${report.generatedAt})`);
  lines.push('');
  lines.push(`> [!NOTE]`);
  lines.push(`> ${report.disclaimer}`);
  lines.push('');

  lines.push(`## Executive Summary`);
  lines.push(`- **Total Active Tasks:** ${report.totalTasks}`);
  lines.push(`- **Completed Tasks:** ${report.completedTasks} (${report.totalTasks > 0 ? Math.round((report.completedTasks / report.totalTasks) * 100) : 0}%)`);
  lines.push(`- **Effort Points Delivered:** ${report.completedEffortPoints} / ${report.totalEffortPoints} pts`);
  lines.push('');

  lines.push(`## Team Member Contributions`);
  lines.push(`| Member | Assigned | Completed | Effort Delivered | Effort Share | On-Time Rate | Activity Logs |`);
  lines.push(`| :--- | :---: | :---: | :---: | :---: | :---: | :---: |`);

  for (const m of report.members) {
    const onTimeStr = m.onTimeRatePercent !== null ? `${m.onTimeRatePercent}%` : 'N/A';
    lines.push(
      `| **${m.member.name}** | ${m.tasksAssigned} | ${m.tasksCompleted} (${m.completionRatePercent}%) | ${m.completedEffortPoints} pts | **${m.effortWeightedSharePercent}%** | ${onTimeStr} | ${m.loggedActivitiesCount} |`
    );
  }
  lines.push('');

  // Individual notes if present
  const membersWithNotes = report.members.filter((m) => m.note);
  if (membersWithNotes.length > 0) {
    lines.push(`### Member Statements & Notes`);
    for (const m of membersWithNotes) {
      lines.push(`- **${m.member.name}:** ${m.note}`);
    }
    lines.push('');
  }

  lines.push(`## Milestone Breakdown`);
  lines.push(`| Milestone | Target % | Derived Due Date | Progress | Status |`);
  lines.push(`| :--- | :---: | :---: | :---: | :--- |`);
  for (const ms of report.milestones) {
    lines.push(`| **${ms.name}** | ${ms.percent}% | ${ms.derivedDate} | ${ms.completedEffort}/${ms.totalEffort} pts (${ms.completionPercent}%) | ${ms.statusLabel} |`);
  }
  lines.push('');

  lines.push(`## Complete Activity Log`);
  lines.push(`| Timestamp | Contributor | Action | Description |`);
  lines.push(`| :--- | :--- | :--- | :--- |`);
  for (const l of report.logs) {
    const formattedTs = new Date(l.ts).toLocaleString();
    lines.push(`| ${formattedTs} | ${l.actorName} | \`${l.type}\` | ${l.summary.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');

  lines.push(`## Integrity & Verification`);
  lines.push(`- **SHA-256 Fingerprint:** \`${report.integrity.hashHex}\``);
  lines.push(`- **Export Verification Stamp:** \`${report.integrity.generatedAt}\``);
  lines.push(`*This cryptographic hash fingerprints the underlying project state at export time to detect post-export tampering.*`);

  return lines.join('\n');
}

