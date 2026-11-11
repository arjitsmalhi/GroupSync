import React from 'react';
import { Modal } from './Modal';
import { Member } from '../lib/schema';
import { Check, ShieldAlert, UserCheck } from 'lucide-react';

export interface IdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentActorId: string | null;
  onSelectActor: (memberId: string) => void;
}

export const IdentityModal: React.FC<IdentityModalProps> = ({
  isOpen,
  onClose,
  members,
  currentActorId,
  onSelectActor,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Which one are you?"
      description="Pick your name from the project team. Your choice is stored locally in your browser and used to tag your contributions in the audit log."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Honest Disclosure:</strong> GroupSync is 100% client-side with zero logins. This identity is self-declared, not cryptographically verified, and can be changed at any time.
          </p>
        </div>

        <div className="space-y-2 mt-4" role="radiogroup" aria-label="Select your identity">
          {members.map((member) => {
            const isSelected = currentActorId === member.id;
            return (
              <button
                key={member.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  onSelectActor(member.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 block">
                      {member.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Team Contributor</span>
                  </div>
                </div>
                {isSelected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <UserCheck className="w-4 h-4 text-slate-400 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

