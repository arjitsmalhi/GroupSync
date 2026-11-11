import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { ProjectSummary } from '../../lib/storage';
import { FolderKanban, Plus, Sparkles, Trash2, Copy, ArrowRight } from 'lucide-react';

export interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectSummary[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenCreate: () => void;
  onLoadDemo: () => void;
}

export const ProjectListModal: React.FC<ProjectListModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onDuplicateProject,
  onDeleteProject,
  onOpenCreate,
  onLoadDemo,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Your Group Projects"
      description="Manage local browser projects or start a new workspace."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              onClose();
              onOpenCreate();
            }}
          >
            Create New Project
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
          >
            Load Demo Project
          </Button>
        </div>

        {/* Project Items */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No local projects saved yet. Create a new one or load the demo project!
            </div>
          ) : (
            projects.map((proj) => {
              const isActive = activeProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 dark:border-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div
                    onClick={() => {
                      onSelectProject(proj.id);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer pr-3"
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {proj.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.2 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      {proj.course && <span>{proj.course} •</span>}
                      <span>{proj.memberCount} members</span>
                      <span>•</span>
                      <span>{proj.taskCount} tasks</span>
                      <span>•</span>
                      <span>Updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateProject(proj.id)}
                      title="Duplicate project"
                      aria-label="Duplicate project"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${proj.name}"? This cannot be undone.`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      title="Delete project"
                      aria-label="Delete project"
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      title="Open project"
                      aria-label="Open project"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

