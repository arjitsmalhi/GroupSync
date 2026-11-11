import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { createDefaultBoard, Board, Milestone, createId, DEFAULT_MILESTONES } from '../../lib/schema';
import { formatDateUtc, calculateMilestoneDate } from '../../lib/milestones';
import { ChevronDown, ChevronUp, Plus, Trash2, Target } from 'lucide-react';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newBoard: Board) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const today = new Date();
  const defaultStart = formatDateUtc(today);
  const monthLater = new Date(today);
  monthLater.setDate(today.getDate() + 30);
  const defaultDue = formatDateUtc(monthLater);

  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [dueDate, setDueDate] = useState(defaultDue);
  const [membersRaw, setMembersRaw] = useState('');
  const [error, setError] = useState('');

  // Custom milestones
  const [showCustomMilestones, setShowCustomMilestones] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>(
    DEFAULT_MILESTONES.map((m) => ({ ...m, id: createId('ms') }))
  );

  const handleAddMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        id: createId('ms'),
        name: 'New Milestone',
        percent: 75,
      },
    ]);
  };

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please provide a project name.');
      return;
    }

    const memberNames = membersRaw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (memberNames.length === 0) {
      setError('Please enter at least one team member name.');
      return;
    }

    const baseBoard = createDefaultBoard({
      name: cleanName,
      course: course.trim() || undefined,
      startDate,
      dueDate,
      memberNames,
    });

    const finalMilestones = milestones.length > 0
      ? [...milestones].sort((a, b) => a.percent - b.percent)
      : baseBoard.milestones;

    const board: Board = {
      ...baseBoard,
      milestones: finalMilestones,
    };

    onCreate(board);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project (< 30 Seconds)"
      description="Zero-login setup. Enter your team details and start collaborating immediately."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Project Name *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Distributed Database Capstone"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Course (Optional)
          </label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. CS 452 / Senior Design"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Start and Due Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Custom Team Members */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Custom Team Member Names * (Comma or newline separated)
          </label>
          <textarea
            rows={2}
            required
            value={membersRaw}
            onChange={(e) => setMembersRaw(e.target.value)}
            placeholder="Priya Sharma, Lucas Silva, Maya Lin, Devon Vance"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Optional Custom Target Milestones Accordion */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCustomMilestones((prev) => !prev)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>Customize Target Milestones ({milestones.length})</span>
            </div>
            {showCustomMilestones ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showCustomMilestones && (
            <div className="p-3 space-y-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  Target milestone dates derive automatically from start & due dates.
                </span>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {milestones.map((ms) => {
                  const derived = calculateMilestoneDate(startDate, dueDate, ms.percent);
                  return (
                    <div
                      key={ms.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                    >
                      <input
                        type="text"
                        value={ms.name}
                        onChange={(e) => handleUpdateMilestone(ms.id, { name: e.target.value })}
                        className="flex-1 text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        placeholder="Milestone name"
                      />
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={ms.percent}
                        onChange={(e) =>
                          handleUpdateMilestone(ms.id, { percent: Number(e.target.value) })
                        }
                        className="w-12 text-xs px-1.5 py-1 text-center font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded"
                      />
                      <span className="text-[10px] font-mono text-slate-400">{derived}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(ms.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Launch Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
