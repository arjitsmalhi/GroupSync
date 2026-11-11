import { Board } from './schema';

export interface IntegrityFingerprint {
  hashHex: string;
  generatedAt: string;
  shortHash: string;
}

export async function generateBoardFingerprint(board: Board, timestamp = new Date().toISOString()): Promise<IntegrityFingerprint> {
  // Canonical serialization without formatting differences
  const payload = JSON.stringify({
    id: board.id,
    schemaVersion: board.schemaVersion,
    name: board.name,
    course: board.course,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    startDate: board.startDate,
    dueDate: board.dueDate,
    members: board.members,
    milestones: board.milestones,
    tasks: board.tasks,
    log: board.log,
    memberNotes: board.memberNotes,
    exportedAt: timestamp,
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return {
      hashHex,
      shortHash: hashHex.slice(0, 16),
      generatedAt: timestamp,
    };
  }

  // Fallback for non-crypto environments (e.g. older tests or non-secure contexts)
  let fallbackHash = 0;
  for (let i = 0; i < payload.length; i++) {
    fallbackHash = (fallbackHash << 5) - fallbackHash + payload.charCodeAt(i);
    fallbackHash |= 0;
  }
  const hex = Math.abs(fallbackHash).toString(16).padStart(16, '0');
  return {
    hashHex: hex.repeat(4),
    shortHash: hex.slice(0, 16),
    generatedAt: timestamp,
  };
}

