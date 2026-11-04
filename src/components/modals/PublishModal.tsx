import React, { useState } from 'react';
import { X, Share2, Copy, Check, AlertTriangle, Sparkles, Send, Globe } from 'lucide-react';
import { GameId, PublishedItemType, PublishedItem } from '../../types';
import { GAMES, GAME_MAP, formatScore } from '../../data/gamesMeta';
import { publishContentItem } from '../../services/firebaseService';
import { checkContentModeration } from '../../services/moderationService';
import { sound } from '../../utils/audio';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGameId?: GameId;
  defaultScore?: number;
  defaultDetail?: string;
  defaultType?: PublishedItemType;
  playerName: string;
  onPublishedSuccess?: (item: PublishedItem) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  defaultGameId = 'sudoku',
  defaultScore = 120,
  defaultDetail = '',
  defaultType = 'challenge',
  playerName,
  onPublishedSuccess,
}) => {
  const [type, setType] = useState<PublishedItemType>(defaultType);
  const [gameId, setGameId] = useState<GameId>(defaultGameId);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState(defaultDetail);
  const [scoreValue, setScoreValue] = useState<number>(defaultScore);
  const [authorName, setAuthorName] = useState(playerName || 'Arcade Challenger');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [publishedItem, setPublishedItem] = useState<PublishedItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync state if props change when opening
  React.useEffect(() => {
    if (isOpen) {
      setGameId(defaultGameId);
      setScoreValue(defaultScore);
      setDetail(defaultDetail);
      setType(defaultType);
      setAuthorName(playerName || 'Arcade Challenger');
      setPublishedItem(null);
      setErrorNotice(null);
      setCopied(false);

      if (!title) {
        const meta = GAME_MAP[defaultGameId];
        if (defaultType === 'challenge') {
          setTitle(`Can you beat my ${meta?.name || 'arcade'} record?`);
        } else {
          setTitle(`New High Score on ${meta?.name || 'Play Room'}!`);
        }
      }
    }
  }, [isOpen, defaultGameId, defaultScore, defaultDetail, defaultType, playerName]);

  if (!isOpen) return null;

  const meta = GAME_MAP[gameId];
  const shareUrl = publishedItem
    ? `${window.location.origin}${window.location.pathname}?share=${publishedItem.id}`
    : '';

  // Real-time validation
  const titleValidation = checkContentModeration(title);
  const detailValidation = checkContentModeration(detail);
  const authorValidation = checkContentModeration(authorName);
  const hasContentViolation = !titleValidation.isClean || !detailValidation.isClean || !authorValidation.isClean;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!title.trim()) {
      setErrorNotice('Please provide a title for your publication.');
      return;
    }

    if (hasContentViolation) {
      setErrorNotice(
        titleValidation.reason || detailValidation.reason || authorValidation.reason || 'Content contains prohibited words.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      sound.playPop();

      const item = await publishContentItem({
        authorName: authorName.trim() || 'Player',
        type,
        gameId,
        title: title.trim(),
        detail: detail.trim() || undefined,
        scoreValue,
      });

      setPublishedItem(item);
      sound.playSuccess();
      if (onPublishedSuccess) {
        onPublishedSuccess(item);
      }
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setErrorNotice(err?.message || 'Failed to publish. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      sound.playPop();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWebShare = async () => {
    if (!publishedItem || !navigator.share) return;
    try {
      await navigator.share({
        title: publishedItem.title,
        text: `Play Room Challenge by ${publishedItem.authorName} on ${meta?.name}: ${publishedItem.title}`,
        url: shareUrl,
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black font-display text-slate-900 dark:text-white">
                {publishedItem ? '🎉 Content Published!' : '🌐 Publish & Share'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {publishedItem
                  ? 'Your challenge is live! Share this specific link with friends.'
                  : 'Create a shareable link & challenge friends publicly.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {publishedItem ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-900 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 text-2xl shadow-sm">
                {meta?.icon || '🎮'}
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                {publishedItem.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
                {publishedItem.detail || `Beat ${publishedItem.authorName}'s record of ${formatScore(publishedItem.gameId, publishedItem.scoreValue)}!`}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#131b2e] rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <span>Target: {formatScore(publishedItem.gameId, publishedItem.scoreValue)}</span>
                <span>•</span>
                <span>By {publishedItem.authorName}</span>
              </div>
            </div>

            {/* Shareable Link Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                🔗 Specific Shareable Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-xs font-mono select-all text-slate-800 dark:text-slate-200"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Share Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleWebShare}
                  className="flex-1 py-2.5 px-4 rounded-xl border-2 border-blue-600 bg-white dark:bg-[#131b2e] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share via Device</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Publication Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Publish Type Selector */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setType('challenge')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === 'challenge'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                }`}
              >
                ⚔️ Game Challenge
              </button>
              <button
                type="button"
                onClick={() => setType('score')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === 'score'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                }`}
              >
                🏆 Score Showcase
              </button>
            </div>

            {/* Game Selection */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Game
                </label>
                <select
                  value={gameId}
                  onChange={(e) => {
                    const nextId = e.target.value as GameId;
                    setGameId(nextId);
                    const g = GAME_MAP[nextId];
                    if (type === 'challenge') {
                      setTitle(`Can you beat my ${g?.name || 'game'} record?`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                >
                  {GAMES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon} {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Score / Time
                </label>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
                  <input
                    type="number"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-bold font-mono text-slate-900 dark:text-white outline-none"
                    min={1}
                  />
                  <span className="text-[11px] font-bold text-blue-600 shrink-0">
                    {meta?.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Headline / Title with Safety Indicator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Challenge Title / Headline
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {title.length}/80
                </span>
              </div>
              <input
                type="text"
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Try to beat my lightning 45s puzzle run!"
                className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 text-xs font-medium text-slate-900 dark:text-white transition-colors outline-none ${
                  !titleValidation.isClean
                    ? 'border-rose-500 focus:border-rose-600'
                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                }`}
              />
              {!titleValidation.isClean && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{titleValidation.reason}</span>
                </p>
              )}
            </div>

            {/* Note / Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Description / Message (Optional)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {detail.length}/250
                </span>
              </div>
              <textarea
                maxLength={250}
                rows={2}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Add hints, personal records, or fun challenge rules..."
                className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 text-xs font-medium text-slate-900 dark:text-white transition-colors outline-none resize-none ${
                  !detailValidation.isClean
                    ? 'border-rose-500 focus:border-rose-600'
                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                }`}
              />
              {!detailValidation.isClean && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{detailValidation.reason}</span>
                </p>
              )}
            </div>

            {/* Author Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Published By
              </label>
              <input
                type="text"
                maxLength={60}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Moderation Policy Notice */}
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Play Room Safety:</strong> All published links are moderated for child safety and fair play. Offensive language or toxic terms will be automatically blocked.
              </span>
            </div>

            {/* Error notice */}
            {errorNotice && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || hasContentViolation}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Publishing to Cloud...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish & Generate Shareable Link</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
