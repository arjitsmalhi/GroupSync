import React from 'react';
import { Member, Milestone, Task } from '../../lib/schema';
import { PriorityBadge, EffortBadge } from '../../ui/Badge';
import { AlertCircle, Calendar, Edit3, Trash2, User } from 'lucide-react';
import { parseDateSafe, formatDateUtc } from '../../lib/milestones';

export interface TaskCardProps {
  task: Task;
  members: Member[];
  milestones: Milestone[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  members,
  milestones,
  onEdit,
  onDelete,
  isDragging = false,
}) => {
  const assignee = members.find((m) => m.id === task.assigneeId);
  const milestone = milestones.find((ms) => ms.id === task.milestoneId);

  // Overdue check: task not done, and dueDate is past today
  let isOverdue = false;
  if (task.dueDate && task.status !== 'done') {
    const todayStr = formatDateUtc(new Date());
    if (task.dueDate < todayStr) {
      isOverdue = true;
    }
  }

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 border rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all select-none ${
        isDragging
          ? 'shadow-xl ring-2 ring-indigo-500 border-indigo-400 opacity-95 scale-[1.02]'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-900/60'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Top badges & actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          <EffortBadge effort={task.effort} />
          {milestone && (
            <span
              className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[110px]"
              title={`Milestone: ${milestone.name}`}
            >
              {milestone.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            aria-label={`Edit task "${task.title}"`}
            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            aria-label={`Delete task "${task.title}"`}
            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4
        onClick={() => onEdit(task)}
        className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2"
      >
        {task.title}
      </h4>

      {/* Notes preview if any */}
      {task.notes && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 font-normal">
          {task.notes}
        </p>
      )}

      {/* Footer: Assignee & Due Date */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
        {/* Assignee Avatar / Unassigned chip */}
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: assignee.color }}
              title={`Assigned to ${assignee.name}`}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
              {assignee.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 italic">
            <User className="w-3.5 h-3.5" />
            <span>Unassigned</span>
          </div>
        )}

        {/* Due Date & Overdue badge */}
        {task.dueDate ? (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
              isOverdue
                ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
            title={isOverdue ? 'Overdue!' : `Due ${task.dueDate}`}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Calendar className="w-3 h-3 shrink-0" />
            )}
            <span>{task.dueDate}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

