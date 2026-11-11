import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Board, Member, Milestone, MEMBER_PALETTE, createId } from '../../lib/schema';
import { calculateMilestoneDate } from '../../lib/milestones';
import { Plus, Trash2, Calendar, Users, Target } from 'lucide-react';
import { useToast } from '../../ui/Toast';

export interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  currentActorId: string | null;
  onSave: (updatedBoard: Board) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  board,
  currentActorId,
  onSave,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState(board.name);
  const [course, setCourse] = useState(board.course || '');
  const [startDate, setStartDate] = useState(board.startDate);
  const [dueDate, setDueDate] = useState(board.dueDate);
  const [milestones, setMilestones] = useState<Milestone[]>(board.milestones);
  const [members, setMembers] = useState<Member[]>(board.members);
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(board.name);
      setCourse(board.course || '');
      setStartDate(board.startDate);
      setDueDate(board.dueDate);
      setMilestones(board.milestones);
      setMembers(board.members);
      setNewMemberName('');
    }
  }, [isOpen, board]);

  const handleAddMember = () => {
    const clean = newMemberName.trim();
    if (!clean) return;
    const nextColor = MEMBER_PALETTE[members.length % MEMBER_PALETTE.length].bg;
    const newMember: Member = {
      id: createId('mem'),
      name: clean,
      color: nextColor,
    };
    setMembers((prev) => [...prev, newMember]);
    setNewMemberName('');
  };

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

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

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const nowIso = new Date().toISOString();
    const sortedMilestones = [...milestones].sort((a, b) => a.percent - b.percent);

    const logEntries = [...board.log];

    if (JSON.stringify(board.milestones) !== JSON.stringify(sortedMilestones)) {
      logEntries.push({
        id: createId('log'),
        ts: nowIso,
        actorId: currentActorId,
        type: 'milestone_changed',
        taskId: null,
        summary: `Updated project milestones and deadline thresholds`,
      });
    }

    if (members.length > board.members.length) {
      const added = members.slice(board.members.length);
      logEntries.push({
        id: createId('log'),
        ts: nowIso,
        actorId: currentActorId,
        type: 'member_added',
        taskId: null,
        summary: `Added member(s): ${added.map((m) => m.name).join(', ')}`,
      });
    }

    const updatedBoard: Board = {
      ...board,
      name: cleanName,
      course: course.trim() || undefined,
      startDate,
      dueDate,
      milestones: sortedMilestones,
      members,
      log: logEntries,
      updatedAt: nowIso,
    };

    onSave(updatedBoard);
    showToast({ type: 'success', message: 'Project configuration updated.' });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project & Milestone Settings"
      description="Update timeline parameters, derived interim milestones, and team members."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Project Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Course
            </label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. CS 350 Capstone"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Milestones Editor */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-500" />
              <span>Interim Milestones (% Pacing)</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddMilestone}
            >
              Add Milestone
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Dates are derived mathematically from start and due dates. They update automatically if dates change.
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {milestones.map((ms) => {
              const derived = calculateMilestoneDate(startDate, dueDate, ms.percent);
              return (
                <div
                  key={ms.id}
                  className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <input
                    type="text"
                    value={ms.name}
                    onChange={(e) => handleUpdateMilestone(ms.id, { name: e.target.value })}
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Milestone name"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={ms.percent}
                      onChange={(e) =>
                        handleUpdateMilestone(ms.id, { percent: Math.max(0, Math.min(100, Number(e.target.value))) })
                      }
                      className="w-16 text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center font-bold"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap px-1">
                    {derived}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(ms.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Members List & Add with Custom Name Editing */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Team Members ({members.length}) — Edit Custom Names</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <span className="w-3 h-3 rounded-full shrink-0 ml-1" style={{ backgroundColor: m.color }} />
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setMembers((prev) =>
                      prev.map((item) => (item.id === m.id ? { ...item, name: newName } : item))
                    );
                  }}
                  className="flex-1 text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="Member name"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Add new teammate name..."
              className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddMember}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Settings
          </Button>
        </div>
      </form>
    </Modal>
  );
};

