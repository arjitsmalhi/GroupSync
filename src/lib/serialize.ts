import LZString from 'lz-string';
import { Board, validateBoard } from './schema';

export const SERIALIZE_CONFIG = {
  URL_WARN_LENGTH: 2000,
  URL_MAX_RECOMMENDED: 3500,
} as const;

export function createSlimBoard(board: Board): Board {
  return {
    ...board,
    // Keep only the most recent log entry or empty to save URL space
    log: board.log.slice(-1),
    memberNotes: {},
  };
}

export function encodeBoardToHash(board: Board, slim = false): string {
  const targetBoard = slim ? createSlimBoard(board) : board;
  const jsonString = JSON.stringify(targetBoard);
  const compressed = LZString.compressToEncodedURIComponent(jsonString);
  return `s=${compressed}`;
}

export function decodeBoardFromHash(hashString: string): { success: boolean; data?: Board; error?: string } {
  try {
    let clean = hashString.trim();
    if (clean.startsWith('#')) {
      clean = clean.slice(1);
    }
    if (clean.startsWith('s=')) {
      clean = clean.slice(2);
    }

    if (!clean) {
      return { success: false, error: 'Empty share payload' };
    }

    const decompressed = LZString.decompressFromEncodedURIComponent(clean);
    if (!decompressed) {
      return { success: false, error: 'Failed to decompress project payload (corrupted or truncated link)' };
    }

    const parsed = JSON.parse(decompressed);
    const validation = validateBoard(parsed);
    if (!validation.success) {
      return { success: false, error: validation.error || 'Invalid board data structure' };
    }

    return { success: true, data: validation.data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse share link' };
  }
}

export function exportBoardToJsonFile(board: Board): void {
  const json = JSON.stringify(board, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitizedName = board.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.download = `${sanitizedName}_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseBoardFromJsonFile(file: File): Promise<{ success: boolean; data?: Board; error?: string }> {
  try {
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 5MB limit' };
    }
    const text = await file.text();
    const parsed = JSON.parse(text);
    return validateBoard(parsed);
  } catch (err: any) {
    return { success: false, error: `Invalid JSON file: ${err.message}` };
  }
}

