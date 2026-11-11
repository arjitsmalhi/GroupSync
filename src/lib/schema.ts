export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'med' | 'high';
export type TaskEffort = 1 | 2 | 3; // 1: S, 2: M, 3: L

export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface Milestone {
  id: string;
  name: string;
  percent: number; // 0 to 100
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  effort: TaskEffort;
  assigneeId: string | null;
  milestoneId: string | null;
  startDate: string | null; // ISO YYYY-MM-DD or null
  dueDate: string | null;   // ISO YYYY-MM-DD or null
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt: string | null;
}

export type LogActionType =
  | 'task_created'
  | 'task_moved'
  | 'task_edited'
  | 'task_assigned'
  | 'task_deleted'
  | 'milestone_changed'
  | 'member_added'
  | 'imported'
  | 'merged';

export interface LogEntry {
  id: string;
  ts: string;
  actorId: string | null;
  type: LogActionType;
  taskId: string | null;
  summary: string;
}

export interface Board {
  schemaVersion: number;
  id: string;
  name: string;
  course?: string;
  createdAt: string;
  updatedAt: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  members: Member[];
  milestones: Milestone[];
  tasks: Task[];
  log: LogEntry[];
  memberNotes?: Record<string, string>;
}

export const CURRENT_SCHEMA_VERSION = 1;

export const MEMBER_PALETTE = [
  { bg: '#4f46e5', label: 'Indigo' },
  { bg: '#059669', label: 'Emerald' },
  { bg: '#d97706', label: 'Amber' },
  { bg: '#e11d48', label: 'Rose' },
  { bg: '#0284c7', label: 'Sky' },
  { bg: '#7c3aed', label: 'Violet' },
  { bg: '#ea580c', label: 'Orange' },
  { bg: '#0d9488', label: 'Teal' },
  { bg: '#db2777', label: 'Pink' },
  { bg: '#475569', label: 'Slate' },
];

export const DEFAULT_MILESTONES: Milestone[] = [
  { id: 'ms-research', name: 'Research', percent: 25 },
  { id: 'ms-draft', name: 'First Draft / Prototype', percent: 60 },
  { id: 'ms-review', name: 'Final Review', percent: 90 },
];

export function createId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function createDefaultBoard(params: {
  name: string;
  course?: string;
  startDate: string;
  dueDate: string;
  memberNames: string[];
}): Board {
  const now = new Date().toISOString();
  const boardId = createId('board');

  const members: Member[] = params.memberNames.map((name, index) => ({
    id: createId('mem'),
    name: name.trim(),
    color: MEMBER_PALETTE[index % MEMBER_PALETTE.length].bg,
  }));

  const initialLog: LogEntry = {
    id: createId('log'),
    ts: now,
    actorId: members[0]?.id ?? null,
    type: 'imported',
    taskId: null,
    summary: `Project "${params.name}" initialized with ${members.length} members.`,
  };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: boardId,
    name: params.name.trim(),
    course: params.course?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    startDate: params.startDate,
    dueDate: params.dueDate,
    members,
    milestones: DEFAULT_MILESTONES.map((m) => ({ ...m, id: createId('ms') })),
    tasks: [],
    log: [initialLog],
    memberNotes: {},
  };
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: Board;
}

const MAX_JSON_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5MB

export function validateBoard(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Data must be a non-null object' };
  }

  const raw = input as Record<string, unknown>;

  // Check schema version
  if (typeof raw.schemaVersion !== 'number') {
    return { success: false, error: 'Missing or invalid schemaVersion (must be a number)' };
  }

  if (raw.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      success: false,
      error: `Project format version ${raw.schemaVersion} is newer than supported version ${CURRENT_SCHEMA_VERSION}. Please update the application.`,
    };
  }

  // Id
  if (typeof raw.id !== 'string' || !raw.id.trim() || raw.id.length > 100) {
    return { success: false, error: 'Invalid or missing project id' };
  }

  // Name
  if (typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 200) {
    return { success: false, error: 'Project name must be a non-empty string under 200 characters' };
  }

  // Course (optional)
  if (raw.course !== undefined && (typeof raw.course !== 'string' || raw.course.length > 100)) {
    return { success: false, error: 'Course name must be a string under 100 characters' };
  }

  // Dates
  if (typeof raw.startDate !== 'string' || !raw.startDate.trim()) {
    return { success: false, error: 'Invalid or missing startDate' };
  }
  if (typeof raw.dueDate !== 'string' || !raw.dueDate.trim()) {
    return { success: false, error: 'Invalid or missing dueDate' };
  }

  // Members array
  if (!Array.isArray(raw.members)) {
    return { success: false, error: 'members must be an array' };
  }
  for (const m of raw.members) {
    if (!m || typeof m !== 'object') return { success: false, error: 'Invalid member entry' };
    if (typeof m.id !== 'string' || !m.id) return { success: false, error: 'Member missing id' };
    if (typeof m.name !== 'string' || !m.name.trim() || m.name.length > 100) {
      return { success: false, error: 'Member name must be between 1 and 100 characters' };
    }
    if (typeof m.color !== 'string' || !m.color) return { success: false, error: 'Member missing color' };
  }

  // Milestones array
  if (!Array.isArray(raw.milestones)) {
    return { success: false, error: 'milestones must be an array' };
  }
  for (const ms of raw.milestones) {
    if (!ms || typeof ms !== 'object') return { success: false, error: 'Invalid milestone entry' };
    if (typeof ms.id !== 'string' || !ms.id) return { success: false, error: 'Milestone missing id' };
    if (typeof ms.name !== 'string' || !ms.name.trim()) return { success: false, error: 'Milestone missing name' };
    if (typeof ms.percent !== 'number' || ms.percent < 0 || ms.percent > 100) {
      return { success: false, error: 'Milestone percent must be a number between 0 and 100' };
    }
  }

  // Tasks array
  if (!Array.isArray(raw.tasks)) {
    return { success: false, error: 'tasks must be an array' };
  }
  const validStatuses = new Set(['todo', 'doing', 'done']);
  const validPriorities = new Set(['low', 'med', 'high']);
  const validEfforts = new Set([1, 2, 3]);

  for (const t of raw.tasks) {
    if (!t || typeof t !== 'object') return { success: false, error: 'Invalid task entry' };
    if (typeof t.id !== 'string' || !t.id) return { success: false, error: 'Task missing id' };
    if (typeof t.title !== 'string' || !t.title.trim() || t.title.length > 300) {
      return { success: false, error: 'Task title must be 1 to 300 characters' };
    }
    if (typeof t.notes !== 'string' && t.notes !== undefined && t.notes !== null) {
      return { success: false, error: 'Task notes must be a string' };
    }
    if (!validStatuses.has(t.status)) return { success: false, error: `Invalid task status: ${t.status}` };
    if (!validPriorities.has(t.priority)) return { success: false, error: `Invalid task priority: ${t.priority}` };
    if (!validEfforts.has(t.effort)) return { success: false, error: `Invalid task effort: ${t.effort}` };
  }

  // Log array
  if (!Array.isArray(raw.log)) {
    return { success: false, error: 'log must be an array' };
  }
  for (const entry of raw.log) {
    if (!entry || typeof entry !== 'object') return { success: false, error: 'Invalid log entry' };
    if (typeof entry.id !== 'string' || !entry.id) return { success: false, error: 'Log entry missing id' };
    if (typeof entry.ts !== 'string' || !entry.ts) return { success: false, error: 'Log entry missing timestamp' };
    if (typeof entry.type !== 'string') return { success: false, error: 'Log entry missing type' };
    if (typeof entry.summary !== 'string') return { success: false, error: 'Log entry missing summary' };
  }

  // Run migration if needed
  const migrated = migrate(raw);

  return { success: true, data: migrated };
}

export function migrate(data: any): Board {
  let version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;
  let board = { ...data };

  // Future migrations can be chained:
  // if (version === 1) { ... version = 2; }

  // Default missing fields for resilience
  if (!board.schemaVersion) board.schemaVersion = CURRENT_SCHEMA_VERSION;
  if (!board.members) board.members = [];
  if (!board.milestones) board.milestones = DEFAULT_MILESTONES.map((m) => ({ ...m, id: createId('ms') }));
  if (!board.tasks) board.tasks = [];
  if (!board.log) board.log = [];
  if (!board.memberNotes) board.memberNotes = {};
  if (!board.createdAt) board.createdAt = new Date().toISOString();
  if (!board.updatedAt) board.updatedAt = board.createdAt;

  // Sanitize task defaults
  board.tasks = board.tasks.map((t: any, index: number) => ({
    id: t.id || createId('task'),
    title: String(t.title || 'Untitled task'),
    notes: String(t.notes || ''),
    status: ['todo', 'doing', 'done'].includes(t.status) ? t.status : 'todo',
    priority: ['low', 'med', 'high'].includes(t.priority) ? t.priority : 'med',
    effort: [1, 2, 3].includes(t.effort) ? t.effort : 2,
    assigneeId: t.assigneeId || null,
    milestoneId: t.milestoneId || null,
    startDate: t.startDate || null,
    dueDate: t.dueDate || null,
    order: typeof t.order === 'number' ? t.order : index,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || new Date().toISOString(),
    completedAt: t.completedAt || null,
    deletedAt: t.deletedAt || null,
  }));

  return board as Board;
}

