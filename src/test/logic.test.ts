import { describe, it, expect } from 'vitest';
import {
  validateBoard,
  migrate,
  createDefaultBoard,
  CURRENT_SCHEMA_VERSION,
  Board,
} from '../lib/schema';
import {
  calculateWorkload,
  calculateOverloadThreshold,
  WORKLOAD_CONFIG,
} from '../lib/workload';
import {
  calculateMilestoneDate,
  getDerivedMilestones,
  parseDateSafe,
} from '../lib/milestones';
import {
  encodeBoardToHash,
  decodeBoardFromHash,
  createSlimBoard,
} from '../lib/serialize';
import { mergeBoards } from '../lib/merge';
import { buildReportData } from '../lib/report';
import { getDemoBoard } from './fixtures';

describe('Schema validation and migration', () => {
  it('validates a correct default board', () => {
    const board = createDefaultBoard({
      name: 'Mobile App Project',
      course: 'CS 101',
      startDate: '2026-09-01',
      dueDate: '2026-12-15',
      memberNames: ['Alice', 'Bob', 'Charlie'],
    });

    const res = validateBoard(board);
    expect(res.success).toBe(true);
    expect(res.data?.members.length).toBe(3);
    expect(res.data?.milestones.length).toBe(3);
  });

  it('rejects invalid or corrupted payload', () => {
    expect(validateBoard(null).success).toBe(false);
    expect(validateBoard('string').success).toBe(false);
    expect(validateBoard({ name: 'Incomplete' }).success).toBe(false);
    expect(validateBoard({ schemaVersion: 999, id: 'x', name: 'Too New' }).success).toBe(false);
  });

  it('migrates missing fields and sanitizes task properties', () => {
    const partial = {
      schemaVersion: 1,
      id: 'legacy-1',
      name: 'Legacy Project',
      startDate: '2026-01-01',
      dueDate: '2026-02-01',
      members: [{ id: 'm1', name: 'Dev', color: '#000' }],
      tasks: [
        { id: 't1', title: 'Task with missing effort and status' },
      ],
    };

    const migrated = migrate(partial);
    expect(migrated.tasks[0].effort).toBe(2);
    expect(migrated.tasks[0].status).toBe('todo');
    expect(migrated.tasks[0].notes).toBe('');
    expect(Array.isArray(migrated.milestones)).toBe(true);
  });
});

describe('Workload calculations and threshold formulas', () => {
  it('calculates correct overload threshold for 2, 3, and 5 members', () => {
    // 2 members: fairShare = 50%, 50 + 15 = 65% > 40% -> 65%
    expect(calculateOverloadThreshold(2)).toBe(65);

    // 3 members: fairShare = 33.333%, 33.333 + 15 = 48.333% -> ~48.33%
    expect(calculateOverloadThreshold(3)).toBeCloseTo(48.33, 1);

    // 4 members: fairShare = 25%, 25 + 15 = 40% -> 40%
    expect(calculateOverloadThreshold(4)).toBe(40);

    // 5 members: fairShare = 20%, 20 + 15 = 35% < 40% -> 40% floor
    expect(calculateOverloadThreshold(5)).toBe(40);
  });

  it('flags overloaded member in a 2-person team only when above 65%', () => {
    const board = createDefaultBoard({
      name: 'Pair Project',
      startDate: '2026-01-01',
      dueDate: '2026-02-01',
      memberNames: ['Alex', 'Sam'],
    });

    const m1 = board.members[0].id;
    const m2 = board.members[1].id;

    // 60% vs 40% (effort 6 vs 4)
    board.tasks = [
      {
        id: 't1',
        title: 'Task 1',
        notes: '',
        status: 'doing',
        priority: 'med',
        effort: 3,
        assigneeId: m1,
        milestoneId: null,
        startDate: null,
        dueDate: null,
        order: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        completedAt: null,
        deletedAt: null,
      },
      {
        id: 't2',
        title: 'Task 2',
        notes: '',
        status: 'doing',
        priority: 'med',
        effort: 3,
        assigneeId: m1,
        milestoneId: null,
        startDate: null,
        dueDate: null,
        order: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        completedAt: null,
        deletedAt: null,
      },
      {
        id: 't3',
        title: 'Task 3',
        notes: '',
        status: 'doing',
        priority: 'med',
        effort: 2,
        assigneeId: m2,
        milestoneId: null,
        startDate: null,
        dueDate: null,
        order: 2,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        completedAt: null,
        deletedAt: null,
      },
      {
        id: 't4',
        title: 'Task 4',
        notes: '',
        status: 'doing',
        priority: 'med',
        effort: 2,
        assigneeId: m2,
        milestoneId: null,
        startDate: null,
        dueDate: null,
        order: 3,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        completedAt: null,
        deletedAt: null,
      },
    ];

    // Total 10 effort: Alex has 6 (60%), Sam has 4 (40%)
    // Since threshold is 65%, Alex is NOT overloaded
    let workload = calculateWorkload(board);
    expect(workload.memberWorkloads[0].sharePercent).toBe(60);
    expect(workload.memberWorkloads[0].isOverloaded).toBe(false);

    // Now give Alex another task with effort 3 -> Alex 9 / 13 = 69% > 65% -> overloaded!
    board.tasks.push({
      id: 't5',
      title: 'Task 5',
      notes: '',
      status: 'doing',
      priority: 'med',
      effort: 3,
      assigneeId: m1,
      milestoneId: null,
      startDate: null,
      dueDate: null,
      order: 4,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      completedAt: null,
      deletedAt: null,
    });

    workload = calculateWorkload(board);
    expect(workload.memberWorkloads[0].sharePercent).toBe(69);
    expect(workload.memberWorkloads[0].isOverloaded).toBe(true);
    expect(workload.memberWorkloads[0].warningMessage).toContain('has 69% of the work');
  });

  it('detects unassigned tasks as separate warning', () => {
    const board = createDefaultBoard({
      name: 'Unassigned Test',
      startDate: '2026-01-01',
      dueDate: '2026-02-01',
      memberNames: ['Alex', 'Sam'],
    });

    board.tasks.push({
      id: 't_unassigned',
      title: 'Unassigned item',
      notes: '',
      status: 'todo',
      priority: 'high',
      effort: 3,
      assigneeId: null,
      milestoneId: null,
      startDate: null,
      dueDate: null,
      order: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      completedAt: null,
      deletedAt: null,
    });

    const workload = calculateWorkload(board);
    expect(workload.unassignedTaskCount).toBe(1);
    expect(workload.unassignedEffort).toBe(3);
    expect(workload.unassignedWarning).toContain('1 task (3 effort pts) unassigned');
  });
});

describe('Milestone derived dates and edge cases', () => {
  it('correctly calculates derived dates from percentage', () => {
    // 100 days from 2026-01-01
    const start = '2026-01-01';
    const due = '2026-04-11'; // ~100 days
    const ms25 = calculateMilestoneDate(start, due, 25);
    const ms50 = calculateMilestoneDate(start, due, 50);
    const ms100 = calculateMilestoneDate(start, due, 100);

    expect(ms100).toBe('2026-04-11');
    expect(ms25).toBe('2026-01-26');
    expect(ms50).toBe('2026-02-20');
  });

  it('handles edge case: due date before start date', () => {
    const date = calculateMilestoneDate('2026-05-10', '2026-05-01', 50);
    expect(date).toBe('2026-05-10');
  });

  it('handles edge case: one-day project', () => {
    const date = calculateMilestoneDate('2026-03-15', '2026-03-15', 50);
    expect(date).toBe('2026-03-15');
  });

  it('computes on-track and behind status for milestones', () => {
    const demo = getDemoBoard();
    const derived = getDerivedMilestones(demo);
    expect(derived.length).toBe(3);
    expect(derived[0].percent).toBe(25);
    expect(derived[0].completedEffort).toBe(6);
    expect(derived[0].status).toBe('completed');
  });
});

describe('Serialization and round-trip', () => {
  it('encodes and decodes board with Unicode characters', () => {
    const board = createDefaultBoard({
      name: '🚀 Proyecto de Computación Cuántica (量子計算) — Øresund',
      course: 'PHY 404 & CS 505 ⚛️',
      startDate: '2026-02-01',
      dueDate: '2026-05-30',
      memberNames: ['Björn Ström', '李华 (Li Hua)', 'Sébastien Müller', 'Chloë O’Connor'],
    });

    const hash = encodeBoardToHash(board);
    expect(hash.startsWith('s=')).toBe(true);

    const decoded = decodeBoardFromHash(hash);
    expect(decoded.success).toBe(true);
    expect(decoded.data?.name).toBe(board.name);
    expect(decoded.data?.members[0].name).toBe('Björn Ström');
    expect(decoded.data?.members[1].name).toBe('李华 (Li Hua)');
  });

  it('creates a slim board with omitted logs to reduce URL size', () => {
    const demo = getDemoBoard();
    const fullHash = encodeBoardToHash(demo, false);
    const slimHash = encodeBoardToHash(demo, true);

    expect(slimHash.length).toBeLessThan(fullHash.length);

    const decodedSlim = decodeBoardFromHash(slimHash);
    expect(decodedSlim.success).toBe(true);
    expect(decodedSlim.data?.tasks.length).toBe(demo.tasks.length);
    expect(decodedSlim.data?.log.length).toBeLessThanOrEqual(1);
  });
});

describe('Merging two boards', () => {
  it('resolves task conflicts by newest updatedAt, handles soft deletes, and unions logs and members', () => {
    const local = getDemoBoard();
    // Clone incoming
    const incoming: Board = JSON.parse(JSON.stringify(local));

    // Incoming adds a new member
    incoming.members.push({ id: 'mem-new', name: 'New Contributor', color: '#10b981' });

    // Incoming modifies an existing task with a newer timestamp
    const task4 = incoming.tasks.find((t) => t.id === 'task-4')!;
    task4.title = 'Updated Title by Remote';
    task4.updatedAt = new Date(Date.now() + 60000).toISOString();

    // Incoming soft-deletes task-5 with a newer timestamp
    const task5 = incoming.tasks.find((t) => t.id === 'task-5')!;
    task5.deletedAt = new Date(Date.now() + 120000).toISOString();
    task5.updatedAt = task5.deletedAt;

    // Incoming adds a new task
    incoming.tasks.push({
      id: 'task-incoming-new',
      title: 'Brand New Incoming Task',
      notes: '',
      status: 'todo',
      priority: 'high',
      effort: 2,
      assigneeId: 'mem-new',
      milestoneId: null,
      startDate: null,
      dueDate: null,
      order: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      deletedAt: null,
    });

    const result = mergeBoards(local, incoming, 'mem-priya');

    expect(result.summary.membersAdded).toBe(1);
    expect(result.summary.tasksAdded).toBe(1);
    expect(result.summary.tasksDeleted).toBe(1);

    const mergedTask4 = result.mergedBoard.tasks.find((t) => t.id === 'task-4');
    expect(mergedTask4?.title).toBe('Updated Title by Remote');

    const mergedTask5 = result.mergedBoard.tasks.find((t) => t.id === 'task-5');
    expect(mergedTask5?.deletedAt).not.toBeNull();

    const mergedNewTask = result.mergedBoard.tasks.find((t) => t.id === 'task-incoming-new');
    expect(mergedNewTask).toBeDefined();

    // Verify merge log entry exists
    const lastLog = result.mergedBoard.log[result.mergedBoard.log.length - 1];
    expect(lastLog.type).toBe('merged');
  });
});

describe('Report generation numbers on fixture board', () => {
  it('computes exact effort-weighted share and stats for demo project', async () => {
    const demo = getDemoBoard();
    const report = await buildReportData(demo);

    expect(report.projectName).toBe(demo.name);
    expect(report.totalTasks).toBe(10);
    expect(report.completedTasks).toBe(3);
    // Completed tasks: task-1 (effort 2) + task-2 (effort 1) + task-3 (effort 3) = 6 pts
    expect(report.completedEffortPoints).toBe(6);

    // Priya completed task-1 (2) + task-3 (3) = 5 pts. Lucas completed task-2 (1 pt).
    const priya = report.members.find((m) => m.member.name === 'Priya Sharma');
    expect(priya).toBeDefined();
    expect(priya?.completedEffortPoints).toBe(5);
    // 5 / 6 = 83.33% -> 83%
    expect(priya?.effortWeightedSharePercent).toBe(83);

    const lucas = report.members.find((m) => m.member.name === 'Lucas Silva');
    expect(lucas).toBeDefined();
    expect(lucas?.completedEffortPoints).toBe(1);
    // 1 / 6 = 16.66% -> 17%
    expect(lucas?.effortWeightedSharePercent).toBe(17);

    // Integrity hash is generated
    expect(report.integrity.hashHex.length).toBe(64);
  });
});

