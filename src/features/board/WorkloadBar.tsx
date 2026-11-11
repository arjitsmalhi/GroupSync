import React from 'react';
import { AlertTriangle, Info, UserX } from 'lucide-react';
import { WorkloadSummary } from '../../lib/workload';

export interface WorkloadBarProps {
  workload: WorkloadSummary;
  onFilterMember?: (memberId: string | null) => void;
  selectedMemberId?: string | null;
}

export const WorkloadBar: React.FC<WorkloadBarProps> = ({
  workload,
  onFilterMember,
  selectedMemberId,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Effort Workload Balance
          </span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium px-2 py-0.5 rounded-full">
            {workload.totalEffort} total pts ({workload.assignedEffort} assigned)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Fair share: ~{workload.fairSharePercent}%</span>
          <span>•</span>
          <span>Overload limit: {workload.overloadThresholdPercent}%</span>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div
        className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner"
        role="progressbar"
        aria-label="Workload distribution bar"
      >
        {workload.memberWorkloads.map((mw) => {
          if (mw.sharePercent <= 0) return null;
          return (
            <div
              key={mw.member.id}
              style={{
                width: `${mw.sharePercent}%`,
                backgroundColor: mw.member.color,
              }}
              className="h-full transition-all duration-300 relative group cursor-pointer"
              title={`${mw.member.name}: ${mw.totalEffort} pts (${mw.sharePercent}%)`}
              onClick={() => onFilterMember?.(mw.member.id)}
            />
          );
        })}
      </div>

      {/* Member Chips & Warnings */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {workload.memberWorkloads.map((mw) => {
          const isSelected = selectedMemberId === mw.member.id;
          return (
            <button
              key={mw.member.id}
              onClick={() => onFilterMember?.(isSelected ? null : mw.member.id)}
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:border-indigo-400'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              } ${mw.isOverloaded ? 'ring-1 ring-amber-500/80' : ''}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: mw.member.color }}
              />
              <span className="text-slate-800 dark:text-slate-200">{mw.member.name}</span>
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                {mw.totalEffort}pts ({mw.sharePercent}%)
              </span>

              {mw.isOverloaded && (
                <span
                  title={mw.warningMessage || 'Overloaded'}
                  className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>High load</span>
                </span>
              )}
            </button>
          );
        })}

        {/* Unassigned chip if any */}
        {workload.unassignedTaskCount > 0 && (
          <button
            onClick={() => onFilterMember?.(selectedMemberId === 'unassigned' ? null : 'unassigned')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
              selectedMemberId === 'unassigned'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60'
                : 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Unassigned ({workload.unassignedTaskCount} tasks, {workload.unassignedEffort} pts)</span>
          </button>
        )}
      </div>

      {/* Explicit Sentences for Overloaded Members */}
      {workload.overloadedMembers.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {workload.overloadedMembers.map((om) => (
            <div
              key={om.member.id}
              className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-medium"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{om.warningMessage}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

