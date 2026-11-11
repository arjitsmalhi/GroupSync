import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Board, Member, Milestone, Task, TaskStatus, createId, MEMBER_PALETTE } from '../../lib/schema';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { FilterState } from './BoardFilters';
import { Plus, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { useToast } from '../../ui/Toast';

export interface KanbanBoardProps {
  board: Board;
  currentActorId: string | null;
  filters: FilterState;
  onUpdateBoard: (updatedBoard: Board) => void;
}

const COLUMNS: { id: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'todo',
    label: 'To Do',
    icon: <ListTodo className="w-4 h-4 text-slate-500" />,
    color: 'border-t-slate-400',
  },
  {
    id: 'doing',
    label: 'In Progress',
    icon: <Clock className="w-4 h-4 text-indigo-500" />,
    color: 'border-t-indigo-500',
  },
  {
    id: 'done',
    label: 'Completed',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    color: 'border-t-emerald-500',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  board,
  currentActorId,
  filters,
  onUpdateBoard,
}) => {
  const { showToast } = useToast();

  // Mobile column switcher state
  const [activeMobileColumn, setActiveMobileColumn] = useState<TaskStatus>('todo');

  // Quick add input states per column
  const [quickTitles, setQuickTitles] = useState<Record<TaskStatus, string>>({
    todo: '',
    doing: '',
    done: '',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('todo');

  // Filter tasks: exclude soft-deleted, then apply filter criteria
  const activeTasks = board.tasks.filter((t) => !t.deletedAt);

  const filteredTasks = activeTasks.filter((task) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchNotes = task.notes.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }

    // Member
    if (filters.memberId === 'unassigned') {
      if (task.assigneeId !== null) return false;
    } else if (filters.memberId) {
      if (task.assigneeId !== filters.memberId) return false;
    }

    // Priority
    if (filters.priority !== 'all') {
      if (task.priority !== filters.priority) return false;
    }

    // Milestone
    if (filters.milestoneId === 'unscheduled') {
      if (task.milestoneId !== null) return false;
    } else if (filters.milestoneId) {
      if (task.milestoneId !== filters.milestoneId) return false;
    }

    return true;
  });

  // Tasks grouped by column status and sorted by order
  const tasksByColumn: Record<TaskStatus, Task[]> = {
    todo: filteredTasks.filter((t) => t.status === 'todo').sort((a, b) => a.order - b.order),
    doing: filteredTasks.filter((t) => t.status === 'doing').sort((a, b) => a.order - b.order),
    done: filteredTasks.filter((t) => t.status === 'done').sort((a, b) => a.order - b.order),
  };

  // Drag and Drop handler
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    const sourceColTasks = [...tasksByColumn[sourceStatus]];
    const destColTasks = sourceStatus === destStatus ? sourceColTasks : [...tasksByColumn[destStatus]];

    const [movedTask] = sourceColTasks.splice(source.index, 1);
    if (!movedTask) return;

    const isMovingStatus = sourceStatus !== destStatus;
    const nowIso = new Date().toISOString();

    const updatedMovedTask: Task = {
      ...movedTask,
      status: destStatus,
      updatedAt: nowIso,
      completedAt: destStatus === 'done' ? movedTask.completedAt || nowIso : null,
    };

    destColTasks.splice(destination.index, 0, updatedMovedTask);

    // Reindex order in destination column
    destColTasks.forEach((t, i) => {
      t.order = i;
    });

    if (isMovingStatus) {
      sourceColTasks.forEach((t, i) => {
        t.order = i;
      });
    }

    // Build next all-tasks array
    const modifiedMap = new Map<string, Task>();
    destColTasks.forEach((t) => modifiedMap.set(t.id, t));
    sourceColTasks.forEach((t) => modifiedMap.set(t.id, t));

    const nextTasks = board.tasks.map((t) => (modifiedMap.has(t.id) ? modifiedMap.get(t.id)! : t));

    // Auto-log move
    const statusLabels: Record<TaskStatus, string> = {
      todo: 'To Do',
      doing: 'In Progress',
      done: 'Completed',
    };

    const logSummary = isMovingStatus
      ? `Moved "${movedTask.title}" from ${statusLabels[sourceStatus]} to ${statusLabels[destStatus]}`
      : `Reordered "${movedTask.title}" in ${statusLabels[sourceStatus]}`;

    const nextLog = [
      ...board.log,
      {
        id: createId('log'),
        ts: nowIso,
        actorId: currentActorId,
        type: 'task_moved' as const,
        taskId: movedTask.id,
        summary: logSummary,
      },
    ];

    onUpdateBoard({
      ...board,
      tasks: nextTasks,
      log: nextLog,
      updatedAt: nowIso,
    });
  };

  // Quick Add handler
  const handleQuickAdd = (status: TaskStatus) => {
    const raw = quickTitles[status]?.trim();
    if (!raw) return;

    const nowIso = new Date().toISOString();
    const newTask: Task = {
      id: createId('task'),
      title: raw,
      notes: '',
      status,
      priority: 'med',
      effort: 2,
      assigneeId: null,
      milestoneId: null,
      startDate: null,
      dueDate: null,
      order: tasksByColumn[status].length,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: status === 'done' ? nowIso : null,
      deletedAt: null,
    };

    const nextLog = [
      ...board.log,
      {
        id: createId('log'),
        ts: nowIso,
        actorId: currentActorId,
        type: 'task_created' as const,
        taskId: newTask.id,
        summary: `Created task "${newTask.title}" via quick add`,
      },
    ];

    onUpdateBoard({
      ...board,
      tasks: [...board.tasks, newTask],
      log: nextLog,
      updatedAt: nowIso,
    });

    setQuickTitles((prev) => ({ ...prev, [status]: '' }));
    showToast({
      type: 'success',
      message: `Added task "${newTask.title}"`,
      action: {
        label: 'Edit details',
        onClick: () => {
          setModalTask(newTask);
          setIsModalOpen(true);
        },
      },
    });
  };

  // Save Task from Modal (Create or Edit)
  const handleSaveModalTask = (task: Task) => {
    const nowIso = new Date().toISOString();
    const isNew = !board.tasks.some((t) => t.id === task.id);

    let nextTasks: Task[];
    let logSummary: string;
    let logType: 'task_created' | 'task_edited';

    if (isNew) {
      nextTasks = [...board.tasks, task];
      logSummary = `Created task "${task.title}"`;
      logType = 'task_created';
    } else {
      nextTasks = board.tasks.map((t) => (t.id === task.id ? task : t));
      logSummary = `Updated task "${task.title}"`;
      logType = 'task_edited';
    }

    const nextLog = [
      ...board.log,
      {
        id: createId('log'),
        ts: nowIso,
        actorId: currentActorId,
        type: logType,
        taskId: task.id,
        summary: logSummary,
      },
    ];

    onUpdateBoard({
      ...board,
      tasks: nextTasks,
      log: nextLog,
      updatedAt: nowIso,
    });

    showToast({
      type: 'success',
      message: isNew ? 'Task created' : 'Task updated',
    });
  };

  // Add custom member on the fly
  const handleAddMember = (name: string): Member => {
    const nextColor = MEMBER_PALETTE[board.members.length % MEMBER_PALETTE.length].bg;
    const newMember: Member = {
      id: createId('mem'),
      name: name.trim(),
      color: nextColor,
    };
    const nowIso = new Date().toISOString();
    const updatedBoard: Board = {
      ...board,
      members: [...board.members, newMember],
      log: [
        ...board.log,
        {
          id: createId('log'),
          ts: nowIso,
          actorId: currentActorId,
          type: 'member_added',
          taskId: null,
          summary: `Added team member "${newMember.name}"`,
        },
      ],
      updatedAt: nowIso,
    };
    onUpdateBoard(updatedBoard);
    return newMember;
  };

  // Add custom target milestone on the fly
  const handleAddMilestone = (name: string, percent: number): Milestone => {
    const newMilestone: Milestone = {
      id: createId('ms'),
      name: name.trim(),
      percent,
    };
    const nowIso = new Date().toISOString();
    const updatedBoard: Board = {
      ...board,
      milestones: [...board.milestones, newMilestone].sort((a, b) => a.percent - b.percent),
      log: [
        ...board.log,
        {
          id: createId('log'),
          ts: nowIso,
          actorId: currentActorId,
          type: 'milestone_changed',
          taskId: null,
          summary: `Created target milestone "${newMilestone.name}" (${percent}%)`,
        },
      ],
      updatedAt: nowIso,
    };
    onUpdateBoard(updatedBoard);
    return newMilestone;
  };

  // Soft delete with Undo
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = board.tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    const nowIso = new Date().toISOString();
    const nextTasks = board.tasks.map((t) =>
      t.id === taskId ? { ...t, deletedAt: nowIso, updatedAt: nowIso } : t
    );

    const nextLog = [
      ...board.log,
      {
        id: createId('log'),
        ts: nowIso,
        actorId: currentActorId,
        type: 'task_deleted' as const,
        taskId,
        summary: `Deleted task "${taskToDelete.title}"`,
      },
    ];

    onUpdateBoard({
      ...board,
      tasks: nextTasks,
      log: nextLog,
      updatedAt: nowIso,
    });

    // Offer undo toast
    showToast({
      type: 'info',
      message: `Deleted "${taskToDelete.title}"`,
      duration: 6000,
      action: {
        label: 'Undo',
        onClick: () => {
          const restoredTasks = board.tasks.map((t) =>
            t.id === taskId ? { ...t, deletedAt: null, updatedAt: new Date().toISOString() } : t
          );
          onUpdateBoard({
            ...board,
            tasks: restoredTasks,
            updatedAt: new Date().toISOString(),
          });
          showToast({ type: 'success', message: `Restored "${taskToDelete.title}"` });
        },
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Mobile Column Switcher (Visible only on small viewports) */}
      <div className="sm:hidden flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
        {COLUMNS.map((col) => {
          const count = tasksByColumn[col.id].length;
          const isActive = activeMobileColumn === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileColumn(col.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {col.icon}
              <span>{col.label}</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Drag & Drop Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const isColumnVisibleOnMobile = activeMobileColumn === col.id;
            const tasksInCol = tasksByColumn[col.id];

            return (
              <div
                key={col.id}
                className={`flex flex-col bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:flex ${
                  isColumnVisibleOnMobile ? 'flex' : 'hidden'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 dark:border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {col.label}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                      {tasksInCol.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setModalTask(null);
                      setModalDefaultStatus(col.id);
                      setIsModalOpen(true);
                    }}
                    title={`Add task to ${col.label}`}
                    aria-label={`Add task to ${col.label}`}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Add Input */}
                <div className="mb-3 px-0.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={quickTitles[col.id]}
                      onChange={(e) =>
                        setQuickTitles((prev) => ({ ...prev, [col.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAdd(col.id);
                        }
                      }}
                      placeholder="+ Quick add task (Enter)"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    {quickTitles[col.id] && (
                      <button
                        onClick={() => handleQuickAdd(col.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>

                {/* Droppable Task List */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[160px] space-y-2.5 rounded-xl p-1 transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-400/30'
                          : ''
                      }`}
                    >
                      {tasksInCol.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                members={board.members}
                                milestones={board.milestones}
                                isDragging={dragSnapshot.isDragging}
                                onEdit={(t) => {
                                  setModalTask(t);
                                  setIsModalOpen(true);
                                }}
                                onDelete={handleDeleteTask}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {tasksInCol.length === 0 && (
                        <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/80 dark:border-slate-800/80 rounded-xl text-center p-3 text-slate-400 dark:text-slate-500">
                          <span className="text-xs">No tasks</span>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalTask(null);
        }}
        taskToEdit={modalTask}
        defaultStatus={modalDefaultStatus}
        members={board.members}
        milestones={board.milestones}
        onSave={handleSaveModalTask}
        onAddMember={handleAddMember}
        onAddMilestone={handleAddMilestone}
      />
    </div>
  );
};

