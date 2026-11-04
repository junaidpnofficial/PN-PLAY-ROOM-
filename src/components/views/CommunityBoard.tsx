import React, { useState, useEffect } from 'react';
import { PublishedItem, GameId } from '../../types';
import { GAMES, GAME_MAP, formatScore } from '../../data/gamesMeta';
import { subscribeToPublishedItems } from '../../services/firebaseService';
import { Globe, Plus, Share2, Play, Flag, Sparkles, Filter, Check } from 'lucide-react';
import { sound } from '../../utils/audio';

interface CommunityBoardProps {
  onPlayGame: (gameId: GameId) => void;
  onOpenPublishModal: () => void;
  onSelectSharedItem: (item: PublishedItem) => void;
}

export const CommunityBoard: React.FC<CommunityBoardProps> = ({
  onPlayGame,
  onOpenPublishModal,
  onSelectSharedItem,
}) => {
  const [items, setItems] = useState<PublishedItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'challenge' | 'score'>('all');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToPublishedItems((updatedList) => {
      // Only display active non-hidden items on the public board
      const activeItems = updatedList.filter((item) => item.status === 'active');
      setItems(activeItems);
    });
    return () => unsub();
  }, []);

  const handleCopyLink = (item: PublishedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}${window.location.pathname}?share=${item.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(item.id);
      sound.playPop();
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredItems = items.filter((item) => {
    if (selectedFilter !== 'all' && item.type !== selectedFilter) return false;
    if (selectedGame !== 'all' && item.gameId !== selectedGame) return false;
    return true;
  });

  return (
    <div className="w-full">
      {/* Community Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 p-4 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border-2 border-blue-100 dark:border-blue-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                Community Playboard
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Public challenges & shareable records published by players.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playPop();
            onOpenPublishModal();
          }}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish & Share Link</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap text-xs">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            All Posts ({items.length})
          </button>
          <button
            onClick={() => setSelectedFilter('challenge')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedFilter === 'challenge'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            ⚔️ Challenges
          </button>
          <button
            onClick={() => setSelectedFilter('score')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedFilter === 'score'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            🏆 High Scores
          </button>
        </div>

        {/* Filter by game */}
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="all">All Mini-Games</option>
          {GAMES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.icon} {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-3xl bg-white dark:bg-[#131b2e] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="text-3xl mb-2">🚀</div>
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">
            No published posts yet for this filter!
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Be the first to publish a game challenge or high score to share with friends.
          </p>
          <button
            onClick={onOpenPublishModal}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Publish New Challenge
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const meta = GAME_MAP[item.gameId];
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectSharedItem(item)}
                className="group relative p-4 rounded-3xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{meta?.icon || '🎮'}</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {meta?.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.type === 'challenge'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {item.type === 'challenge' ? '⚔️ Challenge' : '🏆 Score'}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h4>

                  {/* Description / Detail */}
                  {item.detail && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 line-clamp-2">
                      {item.detail}
                    </p>
                  )}
                </div>

                {/* Bottom stats and action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                  <div className="flex items-center justify-between mb-2.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                      👤 {item.authorName}
                    </span>
                    <span className="font-mono-nums font-black text-blue-600 dark:text-blue-400">
                      {formatScore(item.gameId, item.scoreValue)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playPop();
                        onPlayGame(item.gameId);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Play Now</span>
                    </button>

                    <button
                      onClick={(e) => handleCopyLink(item, e)}
                      className={`p-1.5 rounded-xl border-2 transition-colors cursor-pointer ${
                        isCopied
                          ? 'border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-600'
                      }`}
                      title="Copy specific share link"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
