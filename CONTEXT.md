# Context & Domain Model: GroupSync

## Core Domain Vocabulary
- **Board**: The root aggregate root representing a single group project. Contains members, milestones, tasks, logs, and metadata.
- **Effort Points**: Task difficulty weight (S = 1 pt, M = 2 pts, L = 3 pts). Used for workload balance instead of raw task count.
- **Fair Share**: The baseline equitable distribution percentage: `100 / numberOfMembers`.
- **Overload Threshold**: `max(40%, fairShare + 15 percentage points)`. When a member's share of assigned effort exceeds this limit, an alert is raised.
- **Derived Milestone**: Project interim targets (default: 25% Research, 60% Prototype, 90% Review) whose calendar dates are derived mathematically from project `startDate`, `dueDate`, and milestone `percent`. Milestone dates are never stored independently.
- **Self-Declared Identity**: In GroupSync's zero-login model, identity is self-reported by selecting a member name, stored in local browser state (`groupsync_actor_${boardId}`).
- **Snapshot Sharing**: Complete project state serialized and compressed with LZ-String into a URL fragment (`#s=...`), bypassing any server storage.
- **3-Way Merge**: Conflict resolution algorithm where tasks resolve by newest `updatedAt` (including `deletedAt`), activity logs union by ID sorted by timestamp, and members union by ID.
- **Integrity Fingerprint**: Cryptographic SHA-256 hash computed over canonical board state using the Web Cryptography API (`crypto.subtle.digest`) to detect post-export file tampering.

