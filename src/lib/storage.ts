import { Board, validateBoard } from './schema';

const INDEX_KEY = 'groupsync_project_index';
const ACTIVE_ID_KEY = 'groupsync_active_project_id';
const THEME_KEY = 'groupsync_theme';
const ACTOR_PREFIX = 'groupsync_actor_';
const BOARD_PREFIX = 'groupsync_board_';

export interface ProjectSummary {
  id: string;
  name: string;
  course?: string;
  updatedAt: string;
  memberCount: number;
  taskCount: number;
}

export class StorageQuotaError extends Error {
  constructor(message = 'Browser storage quota exceeded. Please export a JSON backup of your projects to prevent data loss.') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    if (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014
    ) {
      throw new StorageQuotaError();
    }
    throw err;
  }
}

export function getProjectSummaries(): ProjectSummary[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProjectSummaries(summaries: ProjectSummary[]): void {
  safeSetItem(INDEX_KEY, JSON.stringify(summaries));
}

export function updateProjectSummaryInIndex(board: Board): void {
  const summaries = getProjectSummaries();
  const nonDeletedTasks = board.tasks.filter((t) => !t.deletedAt);
  const summary: ProjectSummary = {
    id: board.id,
    name: board.name,
    course: board.course,
    updatedAt: board.updatedAt,
    memberCount: board.members.length,
    taskCount: nonDeletedTasks.length,
  };

  const existingIdx = summaries.findIndex((s) => s.id === board.id);
  if (existingIdx >= 0) {
    summaries[existingIdx] = summary;
  } else {
    summaries.unshift(summary);
  }

  saveProjectSummaries(summaries);
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  } catch {
    // Ignore error
  }
}

export function loadBoard(id: string): Board | null {
  try {
    const raw = localStorage.getItem(`${BOARD_PREFIX}${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = validateBoard(parsed);
    if (result.success && result.data) {
      return result.data;
    }
    console.error('Failed to validate stored board:', result.error);
    return null;
  } catch (err) {
    console.error('Error loading board from localStorage:', err);
    return null;
  }
}

export function saveBoard(board: Board): void {
  safeSetItem(`${BOARD_PREFIX}${board.id}`, JSON.stringify(board));
  updateProjectSummaryInIndex(board);
}

// Debounced save for frequent changes
const pendingDebouncedSaves = new Map<string, ReturnType<typeof setTimeout>>();

export function saveBoardDebounced(board: Board, delay = 400): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = pendingDebouncedSaves.get(board.id);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      try {
        saveBoard(board);
        pendingDebouncedSaves.delete(board.id);
        resolve();
      } catch (err) {
        pendingDebouncedSaves.delete(board.id);
        reject(err);
      }
    }, delay);

    pendingDebouncedSaves.set(board.id, timer);
  });
}

export function deleteBoard(id: string): void {
  try {
    localStorage.removeItem(`${BOARD_PREFIX}${id}`);
    localStorage.removeItem(`${ACTOR_PREFIX}${id}`);
    const summaries = getProjectSummaries().filter((s) => s.id !== id);
    saveProjectSummaries(summaries);
    if (getActiveProjectId() === id) {
      setActiveProjectId(summaries[0]?.id ?? null);
    }
  } catch (err) {
    console.error('Failed to delete board:', err);
  }
}

export function getActorForProject(boardId: string): string | null {
  try {
    return localStorage.getItem(`${ACTOR_PREFIX}${boardId}`);
  } catch {
    return null;
  }
}

export function setActorForProject(boardId: string, memberId: string | null): void {
  try {
    if (memberId) {
      localStorage.setItem(`${ACTOR_PREFIX}${boardId}`, memberId);
    } else {
      localStorage.removeItem(`${ACTOR_PREFIX}${boardId}`);
    }
  } catch {
    // Ignore error
  }
}

export function getStoredTheme(): 'light' | 'dark' | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'dark' || t === 'light' ? t : null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore error
  }
}

