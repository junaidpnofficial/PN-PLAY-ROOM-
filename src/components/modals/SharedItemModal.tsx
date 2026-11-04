import React, { useState } from 'react';
import { X, Play, Share2, Copy, Check, Flag, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { PublishedItem, GameId } from '../../types';
import { GAME_MAP, formatScore } from '../../data/gamesMeta';
import { reportPublishedItem } from '../../services/firebaseService';
import { REPORT_REASONS } from '../../services/moderationService';
import { sound } from '../../utils/audio';

interface SharedItemModalProps {
  item: PublishedItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayGame: (gameId: GameId) => void;
}

export const SharedItemModal: React.FC<SharedItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onPlayGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [hasReported, setHasReported] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  if (!isOpen || !item) return null;

  const meta = GAME_MAP[item.gameId];
  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${item.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      sound.playPop();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWebShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: item.title,
          text: `Play Room Arcade Challenge: ${item.title} by ${item.authorName}`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handlePlayChallenge = () => {
    sound.playSuccess();
    onClose();
    onPlayGame(item.gameId);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    sound.playPop();
    try {
      await reportPublishedItem(item.id, selectedReason);
      setHasReported(true);
      setIsReporting(false);
    } catch (err) {
      console.error('Failed to report:', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta?.icon || '🎮'}</span>
            <div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                {item.type === 'challenge' ? '⚔️ Community Challenge' : '🏆 Score Showcase'}
              </span>
              <h3 className="text-lg font-black font-display text-slate-900 dark:text-white leading-tight">
                {meta?.name || 'Arcade Game'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 mb-4">
          <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-snug">
            "{item.title}"
          </h4>
          {item.detail && (
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3 whitespace-pre-wrap">
              {item.detail}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Challenger: <strong>{item.authorName}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-blue-600 dark:text-blue-400 font-mono text-sm font-black">
                {formatScore(item.gameId, item.scoreValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action: Play / Accept Challenge */}
        <div className="space-y-2 mb-4">
          <button
            onClick={handlePlayChallenge}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play {meta?.name} & Beat This!</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex-1 py-2 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                copied
                  ? 'border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-700 dark:text-slate-200 hover:border-blue-600 bg-white dark:bg-[#131b2e]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
              <span>{copied ? 'Link Copied!' : 'Copy Specific Link'}</span>
            </button>

            <button
              onClick={handleWebShare}
              className="py-2 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-600 bg-white dark:bg-[#131b2e] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Share with friends"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Community Moderation Section */}
        <div className="pt-3 border-t-2 border-slate-100 dark:border-slate-800">
          {hasReported ? (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Thank you. This post has been flagged and submitted to Play Room moderation.</span>
            </div>
          ) : isReporting ? (
            <form onSubmit={handleSubmitReport} className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5 text-rose-500" />
                  <span>Report Inappropriate Content</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsReporting(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Help us keep Play Room safe for kids and all players. Select a reason:
              </p>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white"
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isSubmittingReport}
                className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                {isSubmittingReport ? 'Submitting Report...' : 'Confirm Report'}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Published {formatDate(item.createdAt)}</span>
              <button
                onClick={() => setIsReporting(true)}
                className="text-slate-400 hover:text-rose-500 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Flag className="w-3 h-3" />
                <span>Report / Flag</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
