import React, { useState, useMemo } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Board } from '../../lib/schema';
import { encodeBoardToHash, exportBoardToJsonFile, parseBoardFromJsonFile, SERIALIZE_CONFIG } from '../../lib/serialize';
import { AlertCircle, Check, Copy, Download, FileJson, Link2, ShieldAlert, Upload } from 'lucide-react';
import { useToast } from '../../ui/Toast';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onImportBoard: (incomingBoard: Board) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  board,
  onImportBoard,
}) => {
  const { showToast } = useToast();
  const [useSlim, setUseSlim] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate share link
  const shareUrl = useMemo(() => {
    if (!isOpen) return '';
    const hash = encodeBoardToHash(board, useSlim);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#${hash}`;
  }, [board, useSlim, isOpen]);

  const urlLength = shareUrl.length;
  const isUrlLong = urlLength > SERIALIZE_CONFIG.URL_WARN_LENGTH;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast({ type: 'success', message: 'Share link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast({ type: 'error', message: 'Failed to copy to clipboard' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseBoardFromJsonFile(file);
    if (result.success && result.data) {
      onImportBoard(result.data);
      onClose();
    } else {
      showToast({
        type: 'error',
        message: result.error || 'Failed to import JSON project file',
      });
    }
    // Reset file input
    e.target.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share & Backup Project"
      description="Zero-login snapshot sharing and file exports. Everything stays client-side."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Honest Architecture Disclosure */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p>
              <strong>Snapshot, not live sync:</strong> This link embeds your entire project directly in the URL hash. There is no central server or database.
            </p>
            <p>
              Anyone with this link can read and import the project. If two members make separate changes, share links and merge them.
            </p>
          </div>
        </div>

        {/* Share Link Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-indigo-500" />
              <span>Shareable Snapshot URL</span>
            </label>

            {/* Slim Toggle */}
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useSlim}
                onChange={(e) => setUseSlim(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Slim link (omit log history)</span>
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full pl-3 pr-24 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 select-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleCopyLink}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* URL Length & Guidance */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Link size: {urlLength.toLocaleString()} characters</span>
            {isUrlLong && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Link is long. Try "Slim link" or use .json export.
              </span>
            )}
          </div>
        </div>

        {/* JSON File Backup & Import Section */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileJson className="w-4 h-4 text-emerald-500" />
            <span>File Backup & Offline Sharing</span>
          </label>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            For large projects or permanent backups, download a complete JSON file or import a classmate's project file.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={() => exportBoardToJsonFile(board)}
            >
              Export .json file
            </Button>

            <label className="inline-flex items-center justify-center font-medium rounded-lg transition-colors border border-slate-300 hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 text-xs px-2.5 py-1.5 gap-1.5 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              <span>Import .json file</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};

