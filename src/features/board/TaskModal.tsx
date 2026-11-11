import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Member, Milestone, Task, TaskEffort, TaskPriority, TaskStatus, createId } from '../../lib/schema';
import { Plus, UserPlus, Target, Calendar } from 'lucide-react';
import { formatDateUtc } from '../../lib/milestones';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
  members: Member[];
  milestones: Milestone[];
  onSave: (task: Task) => void;
  onAddMember?: (name: string) => Member;
  onAddMilestone?: (name: string, percent: number) => Milestone;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = 'todo',
  members,
  milestones,
  onSave,
  onAddMember,
  onAddMilestone,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('med');
  const [effort, setEffort] = useState<TaskEffort>(2);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  // Inline quick-add toggles
  const [isAddingCustomMember, setIsAddingCustomMember] = useState(false);
  const [customMemberName, setCustomMemberName] = useState('');

  const [isAddingCustomMilestone, setIsAddingCustomMilestone] = useState(false);
  const [customMilestoneName, setCustomMilestoneName] = useState('');
  const [customMilestonePercent, setCustomMilestonePercent] = useState(50);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setNotes(taskToEdit.notes || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setEffort(taskToEdit.effort);
      setAssigneeId(taskToEdit.assigneeId);
      setMilestoneId(taskToEdit.milestoneId);
      setStartDate(taskToEdit.startDate || '');
      setDueDate(taskToEdit.dueDate || '');
    } else {
      setTitle('');
      setNotes('');
      setStatus(defaultStatus);
      setPriority('med');
      setEffort(2);
      setAssigneeId(null);
      setMilestoneId(null);
      setStartDate('');
      setDueDate('');
    }
    setIsAddingCustomMember(false);
    setIsAddingCustomMilestone(false);
    setCustomMemberName('');
    setCustomMilestoneName('');
    setError('');
  }, [taskToEdit, defaultStatus, isOpen]);

  // Quick Date Setters
  const setQuickDueDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const formatted = formatDateUtc(d);
    setDueDate(formatted);
    if (!startDate) {
      setStartDate(formatDateUtc(new Date()));
    }
  };

  const handleCreateCustomMember = () => {
    const clean = customMemberName.trim();
    if (!clean) return;
    if (onAddMember) {
      const newMember = onAddMember(clean);
      setAssigneeId(newMember.id);
    }
    setCustomMemberName('');
    setIsAddingCustomMember(false);
  };

  const handleCreateCustomMilestone = () => {
    const clean = customMilestoneName.trim();
    if (!clean) return;
    if (onAddMilestone) {
      const newMilestone = onAddMilestone(clean, customMilestonePercent);
      setMilestoneId(newMilestone.id);
    }
    setCustomMilestoneName('');
    setIsAddingCustomMilestone(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Task title is required.');
      return;
    }
    if (cleanTitle.length > 300) {
      setError('Task title cannot exceed 300 characters.');
      return;
    }

    const nowIso = new Date().toISOString();
    const isDone = status === 'done';
    const completedAt = isDone
      ? taskToEdit?.completedAt || nowIso
      : null;

    const task: Task = {
      id: taskToEdit ? taskToEdit.id : createId('task'),
      title: cleanTitle,
      notes: notes.trim(),
      status,
      priority,
      effort,
      assigneeId: assigneeId || null,
      milestoneId: milestoneId || null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      order: taskToEdit ? taskToEdit.order : 0,
      createdAt: taskToEdit ? taskToEdit.createdAt : nowIso,
      updatedAt: nowIso,
      completedAt,
      deletedAt: null,
    };

    onSave(task);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Create New Task'}
      description="Assign team members, set target milestones, and manage task deadlines."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement OAuth token refresh flow"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Notes & Implementation Details
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key technical considerations, PR links, acceptance criteria..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status, Priority, Effort Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todo">To Do</option>
              <option value="doing">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Effort */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Effort Points
            </label>
            <select
              value={effort}
              onChange={(e) => setEffort(Number(e.target.value) as TaskEffort)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>S — Small (1 pt)</option>
              <option value={2}>M — Medium (2 pts)</option>
              <option value={3}>L — Large (3 pts)</option>
            </select>
          </div>
        </div>

        {/* Assignee & Milestone with Custom Name & Target Inline Adders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Assignee */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Assignee
              </label>
              {onAddMember && !isAddingCustomMember && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomMember(true)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Custom Name</span>
                </button>
              )}
            </div>

            {isAddingCustomMember ? (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="New member name..."
                  value={customMemberName}
                  onChange={(e) => setCustomMemberName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCustomMember();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleCreateCustomMember}
                  className="px-2 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomMember(false)}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">(Unassigned)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Target Milestone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Target Milestone
              </label>
              {onAddMilestone && !isAddingCustomMilestone && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomMilestone(true)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <Target className="w-3 h-3" />
                  <span>+ Custom Target</span>
                </button>
              )}
            </div>

            {isAddingCustomMilestone ? (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Target title..."
                  value={customMilestoneName}
                  onChange={(e) => setCustomMilestoneName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  min={1}
                  max={99}
                  title="Target project progress %"
                  value={customMilestonePercent}
                  onChange={(e) => setCustomMilestonePercent(Number(e.target.value))}
                  className="w-14 px-1.5 py-1.5 rounded-lg text-xs border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-center font-bold"
                />
                <button
                  type="button"
                  onClick={handleCreateCustomMilestone}
                  className="px-2 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomMilestone(false)}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={milestoneId || ''}
                onChange={(e) => setMilestoneId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">(Unscheduled / General)</option>
                {milestones.map((ms) => (
                  <option key={ms.id} value={ms.id}>
                    {ms.name} ({ms.percent}%)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Start Date & Due Date with Quick Presets */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Schedule & Interim Deadlines
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Quick Due:</span>
              <button
                type="button"
                onClick={() => setQuickDueDate(0)}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDueDate(3)}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
              >
                +3 Days
              </button>
              <button
                type="button"
                onClick={() => setQuickDueDate(7)}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
              >
                +1 Week
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
