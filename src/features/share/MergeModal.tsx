import React, { useMemo } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Board, createId } from '../../lib/schema';
import { mergeBoards } from '../../lib/merge';
import { GitMerge, Copy, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  localBoard: Board;
  incomingBoard: Board;
  currentActorId: string | null;
  onResolve: (resolvedBoard: Board) => void;
}

export const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  onClose,
  localBoard,
  incomingBoard,
  currentActorId,
  onResolve,
}) => {
  // Pre-calculate merge preview
  const mergePreview = useMemo(() => {
    if (!isOpen) return null;
    return mergeBoards(localBoard, incomingBoard, currentActorId);
  }, [isOpen, localBoard, incomingBoard, currentActorId]);

  if (!mergePreview) return null;

  const { mergedBoard, summary } = mergePreview;

  const handleMerge = () => {
    onResolve(mergedBoard);
    onClose();
  };

  const handleReplace = () => {
    // Completely overwrite local with incoming
    onResolve({
      ...incomingBoard,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const handleKeepBoth = () => {
    // Clone incoming with a distinct new ID and modified name
    const clonedBoard: Board = {
      ...incomingBoard,
      id: createId('board_copy'),
      name: `${incomingBoard.name} (Imported Copy)`,
      updatedAt: new Date().toISOString(),
    };
    onResolve(clonedBoard);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Version Conflict Detected"
      description={`A local project with the ID "${localBoard.name}" already exists on this device.`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Comparison Overview */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <div className="font-bold text-slate-700 dark:text-slate-300">Local Version</div>
            <div className="text-slate-500 dark:text-slate-400">
              Updated: {new Date(localBoard.updatedAt).toLocaleString()}
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              {localBoard.tasks.filter((t) => !t.deletedAt).length} active tasks • {localBoard.members.length} members
            </div>
          </div>
          <div>
            <div className="font-bold text-indigo-600 dark:text-indigo-400">Incoming Version</div>
            <div className="text-slate-500 dark:text-slate-400">
              Updated: {new Date(incomingBoard.updatedAt).toLocaleString()}
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              {incomingBoard.tasks.filter((t) => !t.deletedAt).length} active tasks • {incomingBoard.members.length} members
            </div>
          </div>
        </div>

        {/* Change Summary Preview */}
        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
            <GitMerge className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Intelligent 3-Way Merge Preview</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Tasks Added</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">+{summary.tasksAdded}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Tasks Updated</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{summary.tasksUpdated}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Tasks Deleted</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{summary.tasksDeleted}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">New Members</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">+{summary.membersAdded}</span>
            </div>
          </div>

          {summary.details.length > 0 && (
            <div className="text-[11px] text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto space-y-0.5 pt-1">
              {summary.details.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Merge Option (Recommended) */}
          <button
            onClick={handleMerge}
            className="flex flex-col text-left p-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">
              <GitMerge className="w-4 h-4" />
              <span>Merge (Recommended)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Combines both versions. Newest task edits win; logs and members are unified.
            </p>
          </button>

          {/* Replace Option */}
          <button
            onClick={handleReplace}
            className="flex flex-col text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-sm mb-1">
              <RefreshCw className="w-4 h-4 text-amber-500" />
              <span>Replace Local</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Discard your current local copy and overwrite with incoming version.
            </p>
          </button>

          {/* Keep Both Option */}
          <button
            onClick={handleKeepBoth}
            className="flex flex-col text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-sm mb-1">
              <Copy className="w-4 h-4 text-emerald-500" />
              <span>Keep Both</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Save incoming version as a separate cloned project in your project list.
            </p>
          </button>
        </div>
      </div>
    </Modal>
  );
};

