import React, { useState, useEffect } from 'react';
import {
  clearAllResults,
  exportDataAsJSON,
  getResults,
  saveResults,
  importDataFromJSON,
  isAdminAuthenticated,
  setAdminAuthenticated,
  ADMIN_NAME,
} from '../../utils/storage';
import { formatScore, GAME_MAP } from '../../data/gamesMeta';
import {
  deleteGameResultFromFirestore,
  subscribeToPublishedItems,
  adminModeratePublishedItem,
  adminDeletePublishedItem,
} from '../../services/firebaseService';
import { PublishedItem, ModerationStatus } from '../../types';
import {
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  Cloud,
  Flag,
  Eye,
  EyeOff,
  Check,
  Share2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface AdminViewProps {
  onRefresh: () => void;
  onLockAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onRefresh, onLockAdmin }) => {
  const [activeTab, setActiveTab] = useState<'scores' | 'moderation'>('scores');
  const [results, setResults] = useState(() => getResults());
  const [publishedItems, setPublishedItems] = useState<PublishedItem[]>([]);
  const [moderationFilter, setModerationFilter] = useState<'all' | 'flagged' | 'active' | 'hidden'>('all');
  const [isArmed, setIsArmed] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');

  const isAuth = isAdminAuthenticated();

  // Subscribe to community published items for admin moderation
  useEffect(() => {
    if (!isAuth) return;
    const unsub = subscribeToPublishedItems((items) => {
      setPublishedItems(items);
    });
    return () => unsub();
  }, [isAuth]);

  if (!isAuth) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white mb-2">
          🔒 Admin Locked
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium">
          This area is locked. Only the administrator (<strong>{ADMIN_NAME}</strong>) can view the results of all players and manage the arcade database.
        </p>
        <button
          onClick={onLockAdmin}
          className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-2"
        >
          <Unlock className="w-4 h-4" />
          <span>Enter Admin Password</span>
        </button>
      </div>
    );
  }

  const handleClear = () => {
    if (!isArmed) {
      setIsArmed(true);
      return;
    }
    clearAllResults();
    setResults([]);
    setIsArmed(false);
    setNotice('All records have been reset.');
    onRefresh();
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await deleteGameResultFromFirestore(id);
    } catch {}
    const updated = results.filter((item) => item.id !== id);
    setResults(updated);
    saveResults(updated);
    onRefresh();
  };

  const handleExport = () => {
    const json = exportDataAsJSON();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importDataFromJSON(importText);
    if (ok) {
      setResults(getResults());
      setShowImportBox(false);
      setImportText('');
      setNotice('Backup data successfully imported!');
      onRefresh();
    } else {
      setNotice('Invalid JSON format. Please check the backup string.');
    }
  };

  const handleModerateStatus = async (itemId: string, newStatus: ModerationStatus) => {
    sound.playPop();
    try {
      await adminModeratePublishedItem(itemId, newStatus);
      setNotice(`Item status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Failed to moderate status:', err);
    }
  };

  const handleDeletePublished = async (itemId: string) => {
    sound.playPop();
    try {
      await adminDeletePublishedItem(itemId);
      setNotice('Published post deleted permanently.');
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleLockSession = () => {
    setAdminAuthenticated(false);
    onLockAdmin();
  };

  const flaggedCount = publishedItems.filter((item) => item.status === 'flagged' || item.flagCount > 0).length;

  const filteredModerationItems = publishedItems.filter((item) => {
    if (moderationFilter === 'flagged') return item.status === 'flagged' || item.flagCount > 0;
    if (moderationFilter === 'active') return item.status === 'active';
    if (moderationFilter === 'hidden') return item.status === 'hidden';
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
              🔓 Admin Console
            </h2>
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Admin ({ADMIN_NAME})</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" />
              <span>Firebase Cloud Live</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Full control of player score database and community content moderation.
          </p>
        </div>

        <button
          onClick={handleLockSession}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border-2 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer shadow-xs"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Admin</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('scores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'scores'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Game Scores ({results.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'moderation'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Community Moderation ({publishedItems.length})</span>
          {flaggedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {flaggedCount}
            </span>
          )}
        </button>
      </div>

      {notice && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: Scores Management */}
      {activeTab === 'scores' && (
        <>
          {/* Action controls */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-white hover:border-blue-600 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>{copied ? 'Copied JSON to Clipboard!' : 'Export All Results'}</span>
            </button>

            <button
              onClick={() => setShowImportBox(!showImportBox)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-white hover:border-blue-600 transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Import Results Backup</span>
            </button>

            <button
              onClick={handleClear}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isArmed
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'border-2 border-rose-200 dark:border-rose-900 bg-white dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isArmed ? 'Tap Again to Confirm Clear' : 'Clear All Results'}</span>
            </button>
          </div>

          {/* Import box */}
          {showImportBox && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                Paste JSON Backup to Restore
              </h4>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={4}
                placeholder='{"profile": ..., "results": [...]}'
                className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Apply Import
                </button>
                <button
                  onClick={() => setShowImportBox(false)}
                  className="py-1.5 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* All Results Table for Admin */}
          <div className="bg-white dark:bg-[#131b2e] rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                All Players' Results ({results.length})
              </h3>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Confidential Admin View
              </span>
            </div>

            {results.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                No records in database.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-[#131b2e]">
                    <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">Player</th>
                      <th className="py-2.5 px-3">Game</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3 text-right">Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {results.slice(0, 100).map((r) => {
                      const meta = GAME_MAP[r.gameId];
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {r.n}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-bold">
                            <span>{meta?.icon || '🎮'}</span>
                            <span>{r.g}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono-nums font-black text-blue-600 dark:text-blue-400">
                            {formatScore(r.gameId, r.v)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-xs text-slate-500 dark:text-slate-400 font-mono-nums font-semibold">
                            {new Date(r.t).toLocaleDateString([], {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteSingle(r.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: Moderation Dashboard */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {/* Moderation filters bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setModerationFilter('all')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  moderationFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                All Posts ({publishedItems.length})
              </button>
              <button
                onClick={() => setModerationFilter('flagged')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                  moderationFilter === 'flagged'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Flagged ({flaggedCount})</span>
              </button>
              <button
                onClick={() => setModerationFilter('active')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  moderationFilter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setModerationFilter('hidden')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  moderationFilter === 'hidden'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Hidden
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Administrator Moderation Controls
            </span>
          </div>

          {/* List of items */}
          <div className="bg-white dark:bg-[#131b2e] rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
            {filteredModerationItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-sm">No items in this moderation queue.</p>
                <p className="text-xs">Community content is clean and healthy.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredModerationItems.map((item) => {
                  const meta = GAME_MAP[item.gameId];
                  const isFlagged = item.status === 'flagged' || item.flagCount > 0;
                  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${item.id}`;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        isFlagged
                          ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/40 dark:bg-rose-950/20'
                          : item.status === 'hidden'
                          ? 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{meta?.icon || '🎮'}</span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {meta?.name} • By <strong>{item.authorName}</strong>
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ID: {item.id}
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-1.5">
                          {item.status === 'active' && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Public Active</span>
                            </span>
                          )}
                          {item.status === 'flagged' && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              <span>Flagged ({item.flagCount} reports)</span>
                            </span>
                          )}
                          {item.status === 'hidden' && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden (Taken Down)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content headline & detail */}
                      <div className="mb-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          "{item.title}"
                        </h4>
                        {item.detail && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {item.detail}
                          </p>
                        )}
                        <div className="mt-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          Target / Score: {formatScore(item.gameId, item.scoreValue)}
                        </div>
                      </div>

                      {/* Flag reasons if any */}
                      {item.flagReasons && item.flagReasons.length > 0 && (
                        <div className="mb-3 p-2 rounded-xl bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                          <span className="font-bold block mb-1">Reported Reasons:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {item.flagReasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Moderator Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex-wrap text-xs">
                        <div className="flex items-center gap-2">
                          {/* Approve / Restore */}
                          <button
                            onClick={() => handleModerateStatus(item.id, 'active')}
                            className="px-3 py-1.5 rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Clear Flags</span>
                          </button>

                          {/* Takedown / Hide */}
                          {item.status !== 'hidden' && (
                            <button
                              onClick={() => handleModerateStatus(item.id, 'hidden')}
                              className="px-3 py-1.5 rounded-xl border border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Takedown / Hide</span>
                            </button>
                          )}

                          {/* Delete Permanently */}
                          <button
                            onClick={() => handleDeletePublished(item.id)}
                            className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        {/* Copy Link to inspect */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            setNotice('Copied share link to clipboard.');
                          }}
                          className="text-slate-400 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
