import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Board, Member } from '../../lib/schema';
import { buildReportData, generateReportMarkdown, ReportData, REPORT_DISCLAIMER } from '../../lib/report';
import { Printer, Download, Copy, Check, ShieldCheck, Filter, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '../../ui/Toast';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  currentActorId: string | null;
  onUpdateMemberNote: (memberId: string, note: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  board,
  currentActorId,
  onUpdateMemberNote,
}) => {
  const { showToast } = useToast();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [logFilterMemberId, setLogFilterMemberId] = useState<string | null>(null);

  // Active user's personal statement note
  const [userNote, setUserNote] = useState('');

  useEffect(() => {
    if (currentActorId && board.memberNotes?.[currentActorId]) {
      setUserNote(board.memberNotes[currentActorId]);
    } else {
      setUserNote('');
    }
  }, [currentActorId, board.memberNotes, isOpen]);

  useEffect(() => {
    let cancelled = false;
    if (isOpen) {
      setLoading(true);
      buildReportData(board).then((data) => {
        if (!cancelled) {
          setReport(data);
          setLoading(false);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, board]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = async () => {
    if (!report) return;
    const md = generateReportMarkdown(report);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      showToast({ type: 'success', message: 'Report Markdown copied to clipboard!' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast({ type: 'error', message: 'Failed to copy Markdown' });
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const md = generateReportMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = board.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `${safeName}_contribution_report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({ type: 'success', message: 'Markdown report downloaded' });
  };

  const handleSaveNote = () => {
    if (!currentActorId) return;
    onUpdateMemberNote(currentActorId, userNote);
    showToast({ type: 'success', message: 'Your contribution statement was saved to the board.' });
  };

  // Filtered logs
  const visibleLogs = useMemo(() => {
    if (!report) return [];
    if (!logFilterMemberId) return report.logs;
    const targetMember = board.members.find((m) => m.id === logFilterMemberId);
    if (!targetMember) return report.logs;
    return report.logs.filter((l) => l.actorName === targetMember.name);
  }, [report, logFilterMemberId, board.members]);

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Professor-Ready Contribution Report"
        description="Formal audit report of team contributions, effort delivery, and cryptographic export fingerprint."
        maxWidth="4xl"
      >
        {loading || !report ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Calculating contribution weights & SHA-256 fingerprint...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 no-print">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Print as A4 PDF or download as Markdown document.
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={handlePrint}
                >
                  Print / Save as PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  onClick={handleCopyMarkdown}
                >
                  {copied ? 'Copied' : 'Copy MD'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleDownloadMarkdown}
                >
                  Download MD
                </Button>
              </div>
            </div>

            {/* Note Editor for Current Actor */}
            {currentActorId && (
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl space-y-2 no-print">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    Your Personal Statement / Contribution Note
                  </label>
                  <Button variant="secondary" size="sm" onClick={handleSaveNote}>
                    Save Statement
                  </Button>
                </div>
                <input
                  type="text"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="e.g. Focused on distributed telemetry algorithms and real-time pathfinding..."
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {/* Rendered Formal Report Document (used on screen and captured in Print) */}
            <div
              id="report-printable-area"
              className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 print-only-container"
            >
              {/* Header */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                      {report.projectName}
                    </h1>
                    {report.course && (
                      <p className="text-sm font-semibold text-slate-600 mt-0.5">
                        Course: {report.course}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Project Period: {report.startDate} to {report.dueDate}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>Generated: {new Date(report.generatedAt).toLocaleDateString()}</div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {new Date(report.generatedAt).toLocaleTimeString()} UTC
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Academic Integrity Notice:</strong> {REPORT_DISCLAIMER}
                  </span>
                </div>
              </div>

              {/* High-level Metrics */}
              <div className="grid grid-cols-4 gap-3 text-center print-avoid-break">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Tasks</div>
                  <div className="text-lg font-bold text-slate-900">{report.totalTasks}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Completed</div>
                  <div className="text-lg font-bold text-emerald-700">
                    {report.completedTasks} ({report.totalTasks > 0 ? Math.round((report.completedTasks / report.totalTasks) * 100) : 0}%)
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Effort</div>
                  <div className="text-lg font-bold text-slate-900">{report.totalEffortPoints} pts</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Delivered Effort</div>
                  <div className="text-lg font-bold text-indigo-700">
                    {report.completedEffortPoints} pts
                  </div>
                </div>
              </div>

              {/* Team Member Contribution Table */}
              <div className="space-y-2 print-avoid-break">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Member Contribution Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Member</th>
                        <th className="py-2 px-2 text-center">Assigned</th>
                        <th className="py-2 px-2 text-center">Completed</th>
                        <th className="py-2 px-2 text-center">Effort Delivered</th>
                        <th className="py-2 px-2 text-center">Effort Share</th>
                        <th className="py-2 px-2 text-center">On-Time Rate</th>
                        <th className="py-2 px-2 text-center">Activity Logs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.members.map((m) => (
                        <tr key={m.member.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {m.member.name}
                          </td>
                          <td className="py-2 px-2 text-center">{m.tasksAssigned}</td>
                          <td className="py-2 px-2 text-center font-medium">
                            {m.tasksCompleted} ({m.completionRatePercent}%)
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-indigo-700">
                            {m.completedEffortPoints} pts
                          </td>
                          <td className="py-2 px-2 text-center font-black text-slate-900">
                            {m.effortWeightedSharePercent}%
                          </td>
                          <td className="py-2 px-2 text-center">
                            {m.onTimeRatePercent !== null ? `${m.onTimeRatePercent}%` : '—'}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600">
                            {m.loggedActivitiesCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Member Self-Reported Statements if any */}
              {report.members.some((m) => m.note) && (
                <div className="space-y-2 print-avoid-break">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Member Self-Reported Statements
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {report.members
                      .filter((m) => m.note)
                      .map((m) => (
                        <div
                          key={m.member.id}
                          className="p-2.5 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <span className="font-bold text-slate-900 mr-2">{m.member.name}:</span>
                          <span className="text-slate-700 italic">"{m.note}"</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Milestone Status Table */}
              <div className="space-y-2 print-avoid-break">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Interim Milestone Pacing & Deadlines
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Milestone</th>
                      <th className="py-2 px-2 text-center">Target %</th>
                      <th className="py-2 px-2 text-center">Derived Due Date</th>
                      <th className="py-2 px-2 text-center">Effort Completed</th>
                      <th className="py-2 px-3">Pacing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {report.milestones.map((ms) => (
                      <tr key={ms.id}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{ms.name}</td>
                        <td className="py-2 px-2 text-center">{ms.percent}%</td>
                        <td className="py-2 px-2 text-center font-mono">{ms.derivedDate}</td>
                        <td className="py-2 px-2 text-center">
                          {ms.completedEffort} / {ms.totalEffort} pts ({ms.completionPercent}%)
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-700">{ms.statusLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Activity Log Table */}
              <div className="space-y-2 print-page-break">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Audit Activity Log ({visibleLogs.length} events)
                  </h3>

                  {/* Filter by member (hidden in print) */}
                  <div className="no-print flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={logFilterMemberId || ''}
                      onChange={(e) => setLogFilterMemberId(e.target.value ? e.target.value : null)}
                      className="text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700"
                    >
                      <option value="">All Contributors</option>
                      {board.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="max-h-[320px] overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-1.5 px-3">Time</th>
                        <th className="py-1.5 px-2">Contributor</th>
                        <th className="py-1.5 px-2">Action</th>
                        <th className="py-1.5 px-3">Event Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(l.ts).toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2 font-semibold text-slate-900 whitespace-nowrap">
                            {l.actorName}
                          </td>
                          <td className="py-1.5 px-2 font-mono text-[10px] text-slate-600 uppercase">
                            {l.type.replace('_', ' ')}
                          </td>
                          <td className="py-1.5 px-3 text-slate-800">{l.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cryptographic Integrity Line */}
              <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1 print-avoid-break">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Integrity Fingerprint (SHA-256)</span>
                </div>
                <div className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-700 break-all">
                  {report.integrity.hashHex}
                </div>
                <p className="text-[10px] text-slate-400">
                  Fingerprint generated at {report.integrity.generatedAt}. Cryptographically verifies that this snapshot matches the exported state at time of generation.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

