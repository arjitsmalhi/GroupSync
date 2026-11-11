import { Board, Milestone, Task } from './schema';

export interface DerivedMilestone {
  id: string;
  name: string;
  percent: number;
  derivedDate: string; // YYYY-MM-DD
  isPast: boolean;
  isToday: boolean;
  totalEffort: number;
  completedEffort: number;
  completionPercent: number;
  status: 'completed' | 'on_track' | 'behind' | 'empty';
  statusLabel: string;
}

export function parseDateSafe(dateStr: string): Date {
  if (!dateStr) return new Date();
  // If YYYY-MM-DD, parse as UTC midnight to avoid local timezone off-by-one shifts
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(Date.UTC(year, month, day));
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateMilestoneDate(
  startDateStr: string,
  dueDateStr: string,
  percent: number
): string {
  const start = parseDateSafe(startDateStr);
  const due = parseDateSafe(dueDateStr);

  const startMs = start.getTime();
  let dueMs = due.getTime();

  // Edge case: due date before start date
  if (dueMs < startMs) {
    dueMs = startMs;
  }

  // Edge case: clamped percent 0 to 100
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const durationMs = dueMs - startMs;
  const targetMs = startMs + Math.round((clampedPercent / 100) * durationMs);

  return formatDateUtc(new Date(targetMs));
}

export function getDerivedMilestones(board: Board, referenceDate = new Date()): DerivedMilestone[] {
  const refDateStr = formatDateUtc(referenceDate);
  const refMs = parseDateSafe(refDateStr).getTime();
  const startMs = parseDateSafe(board.startDate).getTime();

  const nonDeletedTasks = board.tasks.filter((t) => !t.deletedAt);

  return board.milestones.map((ms) => {
    const derivedDate = calculateMilestoneDate(board.startDate, board.dueDate, ms.percent);
    const msMs = parseDateSafe(derivedDate).getTime();

    const isPast = msMs < refMs;
    const isToday = derivedDate === refDateStr;

    const msTasks = nonDeletedTasks.filter((t) => t.milestoneId === ms.id);
    let totalEffort = 0;
    let completedEffort = 0;

    for (const t of msTasks) {
      const eff = t.effort || 2;
      totalEffort += eff;
      if (t.status === 'done') {
        completedEffort += eff;
      }
    }

    const completionPercent = totalEffort > 0 ? Math.round((completedEffort / totalEffort) * 100) : 0;

    let status: 'completed' | 'on_track' | 'behind' | 'empty' = 'empty';
    let statusLabel = 'No tasks assigned';

    if (totalEffort === 0) {
      status = 'empty';
      statusLabel = 'No tasks assigned';
    } else if (completedEffort >= totalEffort) {
      status = 'completed';
      statusLabel = `Completed (${completedEffort}/${totalEffort} pts)`;
    } else if (isPast) {
      status = 'behind';
      statusLabel = `Behind deadline (${completionPercent}% completed, overdue)`;
    } else {
      // Future milestone: check pacing
      const milestoneSpan = Math.max(1, msMs - startMs);
      const elapsed = Math.max(0, refMs - startMs);
      const expectedRatio = Math.min(1, elapsed / milestoneSpan);
      const actualRatio = completedEffort / totalEffort;

      // Allow 15% grace pacing margin
      if (actualRatio >= expectedRatio - 0.15) {
        status = 'on_track';
        statusLabel = `On track (${completionPercent}% done)`;
      } else {
        status = 'behind';
        statusLabel = `Behind schedule (${completionPercent}% done, expected ~${Math.round(expectedRatio * 100)}%)`;
      }
    }

    return {
      id: ms.id,
      name: ms.name,
      percent: ms.percent,
      derivedDate,
      isPast,
      isToday,
      totalEffort,
      completedEffort,
      completionPercent,
      status,
      statusLabel,
    };
  });
}

