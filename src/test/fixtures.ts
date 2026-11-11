import { Board, CURRENT_SCHEMA_VERSION } from '../lib/schema';

export function getDemoBoard(): Board {
  const today = new Date();
  
  // Format YYYY-MM-DD
  const format = (d: Date) => d.toISOString().split('T')[0];

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 14);

  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + 14);

  const m1Date = new Date(today);
  m1Date.setDate(today.getDate() - 7);

  const m2Date = new Date(today);
  m2Date.setDate(today.getDate() + 3);

  const m3Date = new Date(today);
  m3Date.setDate(today.getDate() + 11);

  const nowIso = today.toISOString();

  const members = [
    { id: 'mem-priya', name: 'Priya Sharma', color: '#4f46e5' }, // Indigo
    { id: 'mem-lucas', name: 'Lucas Silva', color: '#059669' },  // Emerald
    { id: 'mem-maya', name: 'Maya Lin', color: '#d97706' },      // Amber
    { id: 'mem-devon', name: 'Devon Vance', color: '#e11d48' },   // Rose
  ];

  const milestones = [
    { id: 'ms-arch', name: 'Architecture & Protocol Specs', percent: 25 },
    { id: 'ms-proto', name: 'Telemetry & Routing Engine', percent: 60 },
    { id: 'ms-eval', name: 'Simulation Benchmark & Report', percent: 90 },
  ];

  const tasks = [
    // Done tasks
    {
      id: 'task-1',
      title: 'Define WebSocket protobuf telemetry schemas',
      notes: 'Finalized protobuf contracts for drone coordinate broadcasts and ground station heartbeat.',
      status: 'done' as const,
      priority: 'high' as const,
      effort: 2 as const,
      assigneeId: 'mem-priya',
      milestoneId: 'ms-arch',
      startDate: format(startDate),
      dueDate: format(m1Date),
      order: 0,
      createdAt: new Date(startDate.getTime() + 1000 * 3600 * 2).toISOString(),
      updatedAt: new Date(startDate.getTime() + 1000 * 3600 * 72).toISOString(),
      completedAt: new Date(startDate.getTime() + 1000 * 3600 * 72).toISOString(),
      deletedAt: null,
    },
    {
      id: 'task-2',
      title: 'Literature review of A* pathfinding vs D* Lite',
      notes: 'Compared real-time obstacle replanning overhead in 3D voxel grids.',
      status: 'done' as const,
      priority: 'med' as const,
      effort: 1 as const,
      assigneeId: 'mem-lucas',
      milestoneId: 'ms-arch',
      startDate: format(startDate),
      dueDate: format(m1Date),
      order: 1,
      createdAt: new Date(startDate.getTime() + 1000 * 3600 * 4).toISOString(),
      updatedAt: new Date(startDate.getTime() + 1000 * 3600 * 96).toISOString(),
      completedAt: new Date(startDate.getTime() + 1000 * 3600 * 96).toISOString(),
      deletedAt: null,
    },
    {
      id: 'task-3',
      title: 'Design distributed node failover architecture',
      notes: 'Documented Raft-based leader election diagram for cluster coordinator.',
      status: 'done' as const,
      priority: 'high' as const,
      effort: 3 as const,
      assigneeId: 'mem-priya',
      milestoneId: 'ms-arch',
      startDate: format(startDate),
      dueDate: format(m1Date),
      order: 2,
      createdAt: new Date(startDate.getTime() + 1000 * 3600 * 6).toISOString(),
      updatedAt: new Date(startDate.getTime() + 1000 * 3600 * 120).toISOString(),
      completedAt: new Date(startDate.getTime() + 1000 * 3600 * 120).toISOString(),
      deletedAt: null,
    },
    // Doing tasks
    {
      id: 'task-4',
      title: 'Implement dynamic collision avoidance algorithm',
      notes: 'Integrating velocity obstacle cones with sensor uncertainty margin.',
      status: 'doing' as const,
      priority: 'high' as const,
      effort: 3 as const,
      assigneeId: 'mem-priya',
      milestoneId: 'ms-proto',
      startDate: format(m1Date),
      dueDate: format(m2Date),
      order: 0,
      createdAt: new Date(m1Date.getTime() + 1000 * 3600 * 10).toISOString(),
      updatedAt: nowIso,
      completedAt: null,
      deletedAt: null,
    },
    {
      id: 'task-5',
      title: 'Build WebGL 3D ground control visualizer',
      notes: 'Rendering drone breadcrumbs and geofence polygons in real time.',
      status: 'doing' as const,
      priority: 'med' as const,
      effort: 2 as const,
      assigneeId: 'mem-devon',
      milestoneId: 'ms-proto',
      startDate: format(m1Date),
      dueDate: format(m2Date),
      order: 1,
      createdAt: new Date(m1Date.getTime() + 1000 * 3600 * 14).toISOString(),
      updatedAt: nowIso,
      completedAt: null,
      deletedAt: null,
    },
    {
      id: 'task-6',
      title: 'Simulate packet loss & latency jitter on telemetry feed',
      notes: 'Testing up to 15% UDP drop rate with kalman filter extrapolation.',
      status: 'doing' as const,
      priority: 'med' as const,
      effort: 2 as const,
      assigneeId: 'mem-priya',
      milestoneId: 'ms-proto',
      startDate: format(m1Date),
      dueDate: format(m2Date),
      order: 2,
      createdAt: new Date(m1Date.getTime() + 1000 * 3600 * 18).toISOString(),
      updatedAt: nowIso,
      completedAt: null,
      deletedAt: null,
    },
    // Todo tasks
    {
      id: 'task-7',
      title: 'Stress-test 100 simultaneous simulated drones',
      notes: 'Benchmark server memory and message dispatch latency under high load.',
      status: 'todo' as const,
      priority: 'high' as const,
      effort: 3 as const,
      assigneeId: 'mem-priya',
      milestoneId: 'ms-eval',
      startDate: format(m2Date),
      dueDate: format(m3Date),
      order: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
      deletedAt: null,
    },
    {
      id: 'task-8',
      title: 'Draft latency evaluation chapter for final paper',
      notes: 'Plot P95/P99 latency CDF charts across varying swarm cluster sizes.',
      status: 'todo' as const,
      priority: 'med' as const,
      effort: 2 as const,
      assigneeId: 'mem-lucas',
      milestoneId: 'ms-eval',
      startDate: format(m2Date),
      dueDate: format(dueDate),
      order: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
      deletedAt: null,
    },
    {
      id: 'task-9',
      title: 'Prepare demo slide deck & 3-minute video pitch',
      notes: 'Include screen recording of autonomous obstacle avoidance during communication dropout.',
      status: 'todo' as const,
      priority: 'low' as const,
      effort: 1 as const,
      assigneeId: 'mem-maya',
      milestoneId: 'ms-eval',
      startDate: format(m3Date),
      dueDate: format(dueDate),
      order: 2,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
      deletedAt: null,
    },
    {
      id: 'task-10',
      title: 'Investigate battery drain model heuristics',
      notes: 'Secondary task awaiting verification of drone payload weight data.',
      status: 'todo' as const,
      priority: 'low' as const,
      effort: 2 as const,
      assigneeId: null, // Unassigned to demo unassigned warning!
      milestoneId: null,
      startDate: null,
      dueDate: null,
      order: 3,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
      deletedAt: null,
    },
  ];

  const log = [
    {
      id: 'log-1',
      ts: new Date(startDate.getTime()).toISOString(),
      actorId: 'mem-priya',
      type: 'imported' as const,
      taskId: null,
      summary: 'Project initialized for CS 350 Capstone.',
    },
    {
      id: 'log-2',
      ts: new Date(startDate.getTime() + 1000 * 3600 * 2).toISOString(),
      actorId: 'mem-priya',
      type: 'task_created' as const,
      taskId: 'task-1',
      summary: 'Created task "Define WebSocket protobuf telemetry schemas"',
    },
    {
      id: 'log-3',
      ts: new Date(startDate.getTime() + 1000 * 3600 * 4).toISOString(),
      actorId: 'mem-lucas',
      type: 'task_created' as const,
      taskId: 'task-2',
      summary: 'Created task "Literature review of A* pathfinding vs D* Lite"',
    },
    {
      id: 'log-4',
      ts: new Date(startDate.getTime() + 1000 * 3600 * 72).toISOString(),
      actorId: 'mem-priya',
      type: 'task_moved' as const,
      taskId: 'task-1',
      summary: 'Marked "Define WebSocket protobuf telemetry schemas" as done',
    },
    {
      id: 'log-5',
      ts: new Date(startDate.getTime() + 1000 * 3600 * 96).toISOString(),
      actorId: 'mem-lucas',
      type: 'task_moved' as const,
      taskId: 'task-2',
      summary: 'Marked "Literature review of A* pathfinding vs D* Lite" as done',
    },
    {
      id: 'log-6',
      ts: new Date(startDate.getTime() + 1000 * 3600 * 120).toISOString(),
      actorId: 'mem-priya',
      type: 'task_moved' as const,
      taskId: 'task-3',
      summary: 'Marked "Design distributed node failover architecture" as done',
    },
    {
      id: 'log-7',
      ts: new Date(m1Date.getTime() + 1000 * 3600 * 12).toISOString(),
      actorId: 'mem-priya',
      type: 'task_moved' as const,
      taskId: 'task-4',
      summary: 'Moved "Implement dynamic collision avoidance algorithm" to In Progress',
    },
    {
      id: 'log-8',
      ts: new Date(m1Date.getTime() + 1000 * 3600 * 15).toISOString(),
      actorId: 'mem-devon',
      type: 'task_moved' as const,
      taskId: 'task-5',
      summary: 'Moved "Build WebGL 3D ground control visualizer" to In Progress',
    },
  ];

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: 'demo-drone-capstone',
    name: 'Autonomous Delivery Drone Platform',
    course: 'CS 350 — Distributed & Real-Time Systems',
    createdAt: startDate.toISOString(),
    updatedAt: nowIso,
    startDate: format(startDate),
    dueDate: format(dueDate),
    members,
    milestones,
    tasks,
    log,
    memberNotes: {
      'mem-priya': 'Lead architecture & telemetry protocols. Implemented failover and collision avoidance algorithms.',
      'mem-lucas': 'Focusing on algorithmic evaluation and experimental benchmark write-up.',
      'mem-devon': 'Developed WebGL frontend visualizer and ground control dashboard.',
      'mem-maya': 'Overseeing system test scenarios, user documentation, and final slide presentation.',
    },
  };
}

