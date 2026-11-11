import React from 'react';
import { Member, Milestone, TaskPriority } from '../../lib/schema';
import { Filter, Search, X } from 'lucide-react';

export interface FilterState {
  memberId: string | null; // null | 'unassigned' | memberId
  priority: TaskPriority | 'all';
  milestoneId: string | null; // null | 'unscheduled' | milestoneId
  search: string;
}

export interface BoardFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  members: Member[];
  milestones: Milestone[];
}

export const BoardFilters: React.FC<BoardFiltersProps> = ({
  filters,
  onFilterChange,
  members,
  milestones,
}) => {
  const hasActiveFilters =
    filters.memberId !== null ||
    filters.priority !== 'all' ||
    filters.milestoneId !== null ||
    Boolean(filters.search.trim());

  const resetFilters = () => {
    onFilterChange({
      memberId: null,
      priority: 'all',
      milestoneId: null,
      search: '',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="Filter tasks..."
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ ...filters, search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Member Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={filters.memberId ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onFilterChange({ ...filters, memberId: val === '' ? null : val });
          }}
          className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Members</option>
          <option value="unassigned">⚠️ Unassigned Only</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange({ ...filters, priority: e.target.value as TaskPriority | 'all' })}
          className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="med">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Milestone Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={filters.milestoneId ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onFilterChange({ ...filters, milestoneId: val === '' ? null : val });
          }}
          className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Milestones</option>
          <option value="unscheduled">Unscheduled</option>
          {milestones.map((ms) => (
            <option key={ms.id} value={ms.id}>
              {ms.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reset button */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};

