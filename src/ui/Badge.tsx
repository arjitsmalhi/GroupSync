import React from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Zap } from 'lucide-react';
import { TaskEffort, TaskPriority, TaskStatus } from '../lib/schema';

export const PriorityBadge: React.FC<{ priority: TaskPriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  const configs = {
    low: {
      label: 'Low',
      icon: <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
      classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    med: {
      label: 'Med',
      icon: <ArrowRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
      classes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    high: {
      label: 'High',
      icon: <ArrowUp className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
      classes: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    },
  };

  const conf = configs[priority] || configs.med;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border ${conf.classes} ${
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
      }`}
    >
      {conf.icon}
      <span>{conf.label}</span>
    </span>
  );
};

export const EffortBadge: React.FC<{ effort: TaskEffort; size?: 'sm' | 'md' }> = ({
  effort,
  size = 'sm',
}) => {
  const labels: Record<TaskEffort, { text: string; full: string }> = {
    1: { text: 'S (1pt)', full: 'Small (1pt)' },
    2: { text: 'M (2pts)', full: 'Medium (2pts)' },
    3: { text: 'L (3pts)', full: 'Large (3pts)' },
  };

  const item = labels[effort] || labels[2];

  return (
    <span
      title={item.full}
      className={`inline-flex items-center gap-1 font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ${
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
      }`}
    >
      <Zap className="w-3 h-3 text-indigo-500" />
      <span>{item.text}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const configs: Record<TaskStatus, { label: string; classes: string }> = {
    todo: {
      label: 'To Do',
      classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    doing: {
      label: 'In Progress',
      classes: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    },
    done: {
      label: 'Completed',
      classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    },
  };

  const conf = configs[status] || configs.todo;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${conf.classes}`}>
      {conf.label}
    </span>
  );
};

