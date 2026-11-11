import React, { useState, useEffect, Suspense, useTransition, useMemo } from 'react';
import { Board, Member } from '../lib/schema';
import {
  loadBoard,
  saveBoard,
  saveBoardDebounced,
  deleteBoard,
  getProjectSummaries,
  getActiveProjectId,
  setActiveProjectId,
  getActorForProject,
  setActorForProject,
  getStoredTheme,
  setStoredTheme,
  StorageQuotaError,
  ProjectSummary,
} from '../lib/storage';
import { decodeBoardFromHash } from '../lib/serialize';
import { calculateWorkload } from '../lib/workload';
import { getDemoBoard } from '../test/fixtures';
import { ToastProvider, useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { IdentityModal } from '../ui/IdentityModal';
import { WorkloadBar } from '../features/board/WorkloadBar';
import { BoardFilters, FilterState } from '../features/board/BoardFilters';
import { KanbanBoard } from '../features/board/KanbanBoard';
import { ShareModal } from '../features/share/ShareModal';
import { MergeModal } from '../features/share/MergeModal';
import { CreateProjectModal } from '../features/projects/CreateProjectModal';
import { ProjectListModal } from '../features/projects/ProjectListModal';
import { ProjectSettingsModal } from '../features/projects/ProjectSettingsModal';

import {
  Calendar,
  ChevronDown,
  FileText,
  FolderKanban,
  Kanban,
  Moon,
  Plus,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  User,
  Zap,
} from 'lucide-react';

// Lazy-loaded views
const TimelineView = React.lazy(() =>
  import('../features/timeline/TimelineView').then((m) => ({ default: m.TimelineView }))
);
const ReportModal = React.lazy(() =>
  import('../features/report/ReportModal').then((m) => ({ default: m.ReportModal }))
);

type ActiveTab = 'board' | 'timeline';

export const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('board');

  // Projects & Active Board state
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [currentActorId, setCurrentActorId] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    memberId: null,
    priority: 'all',
    milestoneId: null,
    search: '',
  });

  // Modals state
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProjectListModalOpen, setIsProjectListModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Merge modal state
  const [incomingConflictBoard, setIncomingConflictBoard] = useState<Board | null>(null);

  // Theme initialization
  useEffect(() => {
    const saved = getStoredTheme();
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // Helper to refresh projects list
  const refreshProjects = () => {
    setProjects(getProjectSummaries());
  };

  // Load or switch board
  const switchBoard = (board: Board) => {
    try {
      saveBoard(board);
      setActiveProjectId(board.id);
      setActiveBoard(board);
      const actor = getActorForProject(board.id);
      setCurrentActorId(actor);
      refreshProjects();
    } catch (err: any) {
      if (err instanceof StorageQuotaError) {
        showToast({
          type: 'error',
          message: err.message,
          duration: 8000,
          action: {
            label: 'Backup',
            onClick: () => setIsShareModalOpen(true),
          },
        });
      }
    }
  };

  // Initial load: parse URL hash or load active project / demo
  useEffect(() => {
    refreshProjects();

    const hash = window.location.hash;
    if (hash && (hash.startsWith('#s=') || hash.startsWith('#/s='))) {
      // Decode share link
      const res = decodeBoardFromHash(hash);
      if (res.success && res.data) {
        const incoming = res.data;
        // Clean URL without reload
        history.replaceState(null, '', window.location.pathname);

        const existing = loadBoard(incoming.id);
        if (existing) {
          // Conflict: trigger 3-way merge modal
          setActiveBoard(existing);
          setIncomingConflictBoard(incoming);
          showToast({
            type: 'warning',
            message: `Found existing project "${existing.name}". Choose how to merge.`,
          });
          return;
        } else {
          // New board to browser
          switchBoard(incoming);
          showToast({
            type: 'success',
            message: `Imported project "${incoming.name}" from share link!`,
          });
          setIsIdentityModalOpen(true);
          return;
        }
      } else {
        showToast({
          type: 'error',
          message: res.error || 'Failed to read project from share link.',
        });
      }
    }

    // Normal launch: load active project or demo
    const activeId = getActiveProjectId();
    if (activeId) {
      const loaded = loadBoard(activeId);
      if (loaded) {
        setActiveBoard(loaded);
        setCurrentActorId(getActorForProject(loaded.id));
        return;
      }
    }

    // If no projects exist, seed demo project so judges see immediate functionality
    const summaries = getProjectSummaries();
    if (summaries.length === 0) {
      const demo = getDemoBoard();
      switchBoard(demo);
      // Default to Priya Sharma for demo actor
      setActorForProject(demo.id, 'mem-priya');
      setCurrentActorId('mem-priya');
      showToast({
        type: 'info',
        message: 'Loaded sample project: Autonomous Delivery Drone Platform',
      });
    } else {
      const first = loadBoard(summaries[0].id);
      if (first) {
        setActiveBoard(first);
        setCurrentActorId(getActorForProject(first.id));
      }
    }
  }, []);

  // Update board with debounced persistence and quota check
  const handleUpdateBoard = (updated: Board) => {
    setActiveBoard(updated);
    saveBoardDebounced(updated).catch((err) => {
      if (err instanceof StorageQuotaError) {
        showToast({
          type: 'error',
          message: err.message,
          duration: 9000,
          action: {
            label: 'Export JSON',
            onClick: () => setIsShareModalOpen(true),
          },
        });
      } else {
        console.error('Storage error:', err);
      }
    });
    refreshProjects();
  };

  // Change actor
  const handleSelectActor = (actorId: string) => {
    if (!activeBoard) return;
    setActorForProject(activeBoard.id, actorId);
    setCurrentActorId(actorId);
    const member = activeBoard.members.find((m) => m.id === actorId);
    showToast({
      type: 'success',
      message: `Active identity set to ${member?.name || 'Contributor'}`,
    });
  };

  // Project management handlers
  const handleLoadDemo = () => {
    const demo = getDemoBoard();
    switchBoard(demo);
    setActorForProject(demo.id, 'mem-priya');
    setCurrentActorId('mem-priya');
    showToast({
      type: 'success',
      message: 'Demo project loaded with realistic tasks, workload imbalance, and milestone pacing.',
    });
  };

  const handleCreateProject = (newBoard: Board) => {
    switchBoard(newBoard);
    setIsIdentityModalOpen(true);
    showToast({
      type: 'success',
      message: `Project "${newBoard.name}" created!`,
    });
  };

  const handleDuplicateProject = (id: string) => {
    const target = loadBoard(id);
    if (!target) return;
    const duplicated: Board = {
      ...target,
      id: `proj_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`,
      name: `${target.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    switchBoard(duplicated);
    showToast({ type: 'success', message: `Duplicated "${target.name}"` });
  };

  const handleDeleteProject = (id: string) => {
    deleteBoard(id);
    refreshProjects();
    const remaining = getProjectSummaries();
    if (remaining.length > 0) {
      const next = loadBoard(remaining[0].id);
      if (next) switchBoard(next);
    } else {
      setActiveBoard(null);
    }
    showToast({ type: 'info', message: 'Project deleted' });
  };

  // Handle incoming import from ShareModal or JSON
  const handleImportBoard = (incoming: Board) => {
    if (!activeBoard) {
      switchBoard(incoming);
      setIsIdentityModalOpen(true);
      return;
    }
    if (activeBoard.id === incoming.id) {
      setIncomingConflictBoard(incoming);
    } else {
      switchBoard(incoming);
      setIsIdentityModalOpen(true);
      showToast({ type: 'success', message: `Imported project "${incoming.name}"` });
    }
  };

  // Update member note for professor report
  const handleUpdateMemberNote = (memberId: string, note: string) => {
    if (!activeBoard) return;
    const nextNotes = { ...(activeBoard.memberNotes || {}), [memberId]: note };
    const updated: Board = {
      ...activeBoard,
      memberNotes: nextNotes,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateBoard(updated);
  };

  // Workload summary
  const workload = useMemo(() => {
    if (!activeBoard) return null;
    return calculateWorkload(activeBoard);
  }, [activeBoard]);

  // Current actor object
  const currentActor = useMemo(() => {
    if (!activeBoard || !currentActorId) return null;
    return activeBoard.members.find((m) => m.id === currentActorId) || null;
  }, [activeBoard, currentActorId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Application Bar (no-print) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <FolderKanban className="w-4 h-4" />
              </div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hidden sm:inline">
                GroupSync
              </span>
            </div>

            {/* Project Switcher Pill & Settings */}
            {activeBoard && (
              <div className="flex items-center gap-1 min-w-0">
                <button
                  onClick={() => setIsProjectListModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all max-w-[200px] sm:max-w-[260px]"
                >
                  <span className="truncate">{activeBoard.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  title="Project & Milestone Settings"
                  aria-label="Project & Milestone Settings"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation View Switcher (Board vs Timeline) */}
          {activeBoard && (
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'board'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Task Board</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Identity Chip */}
            {activeBoard && (
              <button
                onClick={() => setIsIdentityModalOpen(true)}
                title="Change active self-reported identity"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold transition-all"
              >
                {currentActor ? (
                  <>
                    <span
                      className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: currentActor.color }}
                    >
                      {currentActor.name.charAt(0)}
                    </span>
                    <span className="hidden sm:inline text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
                      {currentActor.name}
                    </span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 italic hidden sm:inline">Identify</span>
                  </>
                )}
              </button>
            )}

            {/* Share Snapshot */}
            {activeBoard && (
              <Button
                variant="outline"
                size="sm"
                icon={<Share2 className="w-3.5 h-3.5 text-indigo-500" />}
                onClick={() => setIsShareModalOpen(true)}
              >
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}

            {/* Professor Report Modal */}
            {activeBoard && (
              <Button
                variant="primary"
                size="sm"
                icon={<FileText className="w-3.5 h-3.5" />}
                onClick={() => setIsReportModalOpen(true)}
              >
                <span className="hidden sm:inline">Report</span>
              </Button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        {activeBoard && (
          <div className="md:hidden flex border-t border-slate-200 dark:border-slate-800 px-4 py-1.5 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 ${
                activeTab === 'board'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {!activeBoard ? (
          <div className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Welcome to GroupSync</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Zero-login group project management. Automatic workload balancing, derived interim deadlines, and professor-ready contribution reports.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Project
              </Button>
              <Button
                variant="outline"
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                onClick={handleLoadDemo}
              >
                Load Demo Project
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Live Workload Bar (Shared at top) */}
            {workload && (
              <WorkloadBar
                workload={workload}
                selectedMemberId={filters.memberId}
                onFilterMember={(memberId) =>
                  setFilters((prev) => ({ ...prev, memberId }))
                }
              />
            )}

            {/* Active View: Board or Timeline */}
            {activeTab === 'board' ? (
              <div className="space-y-4">
                {/* Search & Filters */}
                <BoardFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  members={activeBoard.members}
                  milestones={activeBoard.milestones}
                />

                {/* Kanban DnD Board */}
                <KanbanBoard
                  board={activeBoard}
                  currentActorId={currentActorId}
                  filters={filters}
                  onUpdateBoard={handleUpdateBoard}
                />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="py-20 text-center text-slate-400 text-sm">
                    Loading timeline...
                  </div>
                }
              >
                <TimelineView board={activeBoard} />
              </Suspense>
            )}
          </>
        )}
      </main>

      {/* Identity Selector Modal */}
      {activeBoard && (
        <IdentityModal
          isOpen={isIdentityModalOpen}
          onClose={() => setIsIdentityModalOpen(false)}
          members={activeBoard.members}
          currentActorId={currentActorId}
          onSelectActor={handleSelectActor}
        />
      )}

      {/* Share & Backup Modal */}
      {activeBoard && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          board={activeBoard}
          onImportBoard={handleImportBoard}
        />
      )}

      {/* Merge Conflict Modal */}
      {activeBoard && incomingConflictBoard && (
        <MergeModal
          isOpen={Boolean(incomingConflictBoard)}
          onClose={() => setIncomingConflictBoard(null)}
          localBoard={activeBoard}
          incomingBoard={incomingConflictBoard}
          currentActorId={currentActorId}
          onResolve={(resolved) => {
            switchBoard(resolved);
            setIncomingConflictBoard(null);
            showToast({ type: 'success', message: 'Project synchronization complete!' });
          }}
        />
      )}

      {/* Lazy-Loaded Report Modal */}
      {activeBoard && (
        <Suspense fallback={null}>
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            board={activeBoard}
            currentActorId={currentActorId}
            onUpdateMemberNote={handleUpdateMemberNote}
          />
        </Suspense>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* Projects List Modal */}
      <ProjectListModal
        isOpen={isProjectListModalOpen}
        onClose={() => setIsProjectListModalOpen(false)}
        projects={projects}
        activeProjectId={activeBoard?.id || null}
        onSelectProject={(id) => {
          const loaded = loadBoard(id);
          if (loaded) switchBoard(loaded);
        }}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onOpenCreate={() => setIsCreateModalOpen(true)}
        onLoadDemo={handleLoadDemo}
      />

      {/* Project & Milestone Settings Modal */}
      {activeBoard && (
        <ProjectSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          board={activeBoard}
          currentActorId={currentActorId}
          onSave={handleUpdateBoard}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

