import React from 'react';
import { Board, Member, Milestone, Task } from '../../lib/schema';
import { getDerivedMilestones, parseDateSafe, formatDateUtc } from '../../lib/milestones';
import { Calendar, CheckCircle2, Clock, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import { PriorityBadge, EffortBadge } from '../../ui/Badge';

export interface TimelineViewProps {
  board: Board;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ board }) => {
  const today = new Date();
  const todayStr = formatDateUtc(today);
  const derivedMilestones = getDerivedMilestones(board, today);

  const startMs = parseDateSafe(board.startDate).getTime();
  let dueMs = parseDateSafe(board.dueDate).getTime();
  if (dueMs < startMs) dueMs = startMs;

  const totalDurationMs = Math.max(1000 * 3600 * 24, dueMs - startMs);

  const getPercentPosition = (dateStr: string): number => {
    const ms = parseDateSafe(dateStr).getTime();
    const ratio = (ms - startMs) / totalDurationMs;
    return Math.max(0, Math.min(100, Math.round(ratio * 1000) / 10));
  };

  const todayPercent = getPercentPosition(todayStr);
  const isProjectEnded = parseDateSafe(todayStr).getTime() > dueMs;
  const isProjectNotStarted = parseDateSafe(todayStr).getTime() < startMs;

  const nonDeletedTasks = board.tasks.filter((t) => !t.deletedAt);
  const memberMap = new Map<string, Member>();
  for (const m of board.members) {
    memberMap.set(m.id, m);
  }

  // Milestone groups
  const groups: {
    milestone: typeof derivedMilestones[0] | null;
    name: string;
    tasks: Task[];
  }[] = derivedMilestones.map((ms) => ({
    milestone: ms,
    name: ms.name,
    tasks: nonDeletedTasks.filter((t) => t.milestoneId === ms.id),
  }));

  // Unscheduled tasks
  const unscheduledTasks = nonDeletedTasks.filter((t) => !t.milestoneId);
  if (unscheduledTasks.length > 0) {
    groups.push({
      milestone: null,
      name: 'Unscheduled Tasks',
      tasks: unscheduledTasks,
    });
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Timespan</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {board.startDate} → {board.dueDate}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Milestones</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {derivedMilestones.filter((m) => m.status === 'completed').length} / {derivedMilestones.length} Completed
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Project Status</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isProjectEnded ? 'Project deadline elapsed' : isProjectNotStarted ? 'Starts in future' : 'Active execution'}
            </div>
          </div>
        </div>
      </div>

      {/* Gantt & Milestone Chart Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm overflow-x-auto">
        {/* Timeline Header Track */}
        <div className="min-w-[700px] mb-6">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Start: {board.startDate}</span>
            <span>Due: {board.dueDate}</span>
          </div>

          {/* Timeline Bar with Markers */}
          <div className="relative h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-visible border border-slate-200 dark:border-slate-700">
            {/* Milestone Markers */}
            {derivedMilestones.map((ms) => {
              const pos = getPercentPosition(ms.derivedDate);
              return (
                <div
                  key={ms.id}
                  style={{ left: `${pos}%` }}
                  className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center z-10 group"
                >
                  <div className="w-1 h-full bg-indigo-500 rounded-full" />
                  <div className="absolute top-7 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                    {ms.name} ({ms.derivedDate})
                  </div>
                </div>
              );
            })}

            {/* Today Line */}
            {!isProjectEnded && !isProjectNotStarted && (
              <div
                style={{ left: `${todayPercent}%` }}
                className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center z-20"
              >
                <div className="w-0.5 h-full bg-rose-500" />
                <div className="absolute -top-6 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                  Today
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Milestone Groups and Rows */}
        <div className="min-w-[700px] space-y-6 pt-4">
          {groups.map((group, groupIdx) => {
            const ms = group.milestone;
            return (
              <div
                key={ms ? ms.id : 'unscheduled'}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50"
              >
                {/* Milestone Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {group.name}
                    </span>
                    {ms && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        {ms.percent}% Target • Due {ms.derivedDate}
                      </span>
                    )}
                  </div>

                  {ms && (
                    <div className="flex items-center gap-1.5">
                      {ms.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {ms.statusLabel}
                        </span>
                      ) : ms.status === 'behind' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> {ms.statusLabel}
                        </span>
                      ) : ms.status === 'on_track' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <Clock className="w-3.5 h-3.5" /> {ms.statusLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {ms.statusLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Task Rows */}
                {group.tasks.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">
                    No tasks assigned under this milestone.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.tasks.map((task) => {
                      const assignee = task.assigneeId ? memberMap.get(task.assigneeId) : null;
                      const hasDates = Boolean(task.startDate && task.dueDate);
                      const hasDueOnly = !task.startDate && Boolean(task.dueDate);

                      let leftPos = 0;
                      let width = 0;

                      if (hasDates) {
                        const sPos = getPercentPosition(task.startDate!);
                        const ePos = getPercentPosition(task.dueDate!);
                        leftPos = Math.min(sPos, ePos);
                        width = Math.max(2, Math.abs(ePos - sPos));
                      } else if (hasDueOnly) {
                        leftPos = getPercentPosition(task.dueDate!);
                        width = 3;
                      }

                      const isOverdue =
                        task.status !== 'done' && task.dueDate && task.dueDate < todayStr;

                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 py-1.5 hover:bg-white dark:hover:bg-slate-800/80 px-2 rounded-lg transition-colors"
                        >
                          {/* Task Name & Assignee */}
                          <div className="w-[240px] shrink-0 flex items-center justify-between pr-2">
                            <span
                              className={`text-xs font-medium truncate ${
                                task.status === 'done'
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                              title={task.title}
                            >
                              {task.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <span className="text-[10px] font-bold text-slate-500">
                                {task.effort}pt
                              </span>
                              {assignee && (
                                <span
                                  className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                                  style={{ backgroundColor: assignee.color }}
                                  title={assignee.name}
                                >
                                  {assignee.name.charAt(0)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Gantt Bar Lane */}
                          <div className="flex-1 relative h-6 bg-slate-100/80 dark:bg-slate-800/60 rounded-md overflow-hidden">
                            {hasDates || hasDueOnly ? (
                              <div
                                style={{ left: `${leftPos}%`, width: `${width}%` }}
                                className={`absolute top-1 bottom-1 rounded transition-all flex items-center justify-center text-[10px] text-white font-semibold shadow-sm ${
                                  task.status === 'done'
                                    ? 'bg-emerald-500'
                                    : isOverdue
                                    ? 'bg-rose-500'
                                    : 'bg-indigo-600'
                                }`}
                                title={`${task.title} (${task.startDate || ''} to ${task.dueDate || ''})`}
                              >
                                {isOverdue && <AlertCircle className="w-3 h-3 mx-1 text-white shrink-0" />}
                              </div>
                            ) : (
                              <div className="flex items-center h-full px-2 text-[10px] text-slate-400 italic">
                                No dates assigned
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

