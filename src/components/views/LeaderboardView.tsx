import React, { useState } from 'react';
import { GameId } from '../../types';
import { GAMES, GAME_MAP, formatScore } from '../../data/gamesMeta';
import { getLeaderboardForGame } from '../../utils/storage';
import { Share2, Globe, Play } from 'lucide-react';
import { sound } from '../../utils/audio';

interface LeaderboardViewProps {
  onPlayGame: (gameId: GameId) => void;
  onOpenPublishModal?: (gameId: GameId, score: number) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onPlayGame, onOpenPublishModal }) => {
  const [selectedGameId, setSelectedGameId] = useState<GameId>('memory');
  const entries = getLeaderboardForGame(selectedGameId);
  const selectedMeta = GAME_MAP[selectedGameId];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight mb-2">
            🏆 Leaderboards
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Hall of fame across all 9 games. Filter by game to view best results.
          </p>
        </div>

        {onOpenPublishModal && (
          <button
            onClick={() => {
              sound.playPop();
              const topScore = entries.length > 0 ? entries[0].value : 100;
              onOpenPublishModal(selectedGameId, topScore);
            }}
            className="py-1.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Publish Challenge</span>
          </button>
        )}
      </div>

      {/* Game Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {GAMES.map((game) => {
          const isActive = game.id === selectedGameId;
          return (
            <button
              key={game.id}
              onClick={() => setSelectedGameId(game.id)}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border-2 ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-600'
              }`}
            >
              <span>{game.icon}</span>
              <span>{game.name}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-[#131b2e] rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedMeta.icon}</span>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {selectedMeta.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Ranking metric: {selectedMeta.metric === 'low' ? 'Lowest value (Best)' : selectedMeta.metric === 'high' ? 'Highest score (Best)' : 'Accumulated total points'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onPlayGame(selectedGameId)}
            className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play {selectedMeta.name}</span>
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base mb-2 font-bold">No scores recorded yet for this game.</p>
            <p className="text-xs">Be the very first player on the leaderboard!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 w-16">Rank</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3 text-right">
                    {selectedMeta.metric === 'sum' ? 'Total Score' : 'Best Record'}
                  </th>
                  <th className="py-2.5 px-3 text-right hidden sm:table-cell">Runs</th>
                  <th className="py-2.5 px-3 text-right">Challenge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {entries.map((entry, idx) => {
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                  return (
                    <tr
                      key={entry.name}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-base">{medal}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {entry.name}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-nums font-black text-blue-600 dark:text-blue-400">
                        {formatScore(selectedGameId, entry.value)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell font-mono-nums font-semibold">
                        {entry.gamesPlayed} {entry.gamesPlayed === 1 ? 'game' : 'games'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            sound.playPop();
                            if (onOpenPublishModal) {
                              onOpenPublishModal(selectedGameId, entry.value);
                            }
                          }}
                          className="py-1 px-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Publish a challenge to beat this record"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
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
    </div>
  );
};
