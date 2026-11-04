import React from 'react';
import { GameId, GameResult } from '../../types';
import { getProfile, getResults } from '../../utils/storage';
import { formatScore, GAME_MAP } from '../../data/gamesMeta';
import { Share2, Globe, User } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MyResultsViewProps {
  onPlayGame: (gameId: GameId) => void;
  onChangeName: () => void;
  onPublishResult?: (result: GameResult) => void;
  onOpenPublishModal?: () => void;
}

export const MyResultsView: React.FC<MyResultsViewProps> = ({
  onPlayGame,
  onChangeName,
  onPublishResult,
  onOpenPublishModal,
}) => {
  const profile = getProfile();
  const allResults = getResults();
  const myResults = allResults.filter((r) => r.n === profile.name);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight mb-1">
            📋 My Game Results
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Private personal log. Only you can see these. Player: <strong className="text-blue-600 dark:text-blue-400">{profile.name || 'Guest'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPublishModal && (
            <button
              onClick={() => {
                sound.playPop();
                onOpenPublishModal();
              }}
              className="py-1.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publish Challenge</span>
            </button>
          )}

          <button
            onClick={onChangeName}
            className="py-1.5 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-white hover:border-blue-600 transition-colors cursor-pointer shadow-xs flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Switch Player</span>
          </button>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">Total Runs</span>
          <span className="text-2xl font-black font-mono-nums text-slate-900 dark:text-white">
            {myResults.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">Unique Games Played</span>
          <span className="text-2xl font-black font-mono-nums text-blue-600 dark:text-blue-400">
            {new Set(myResults.map((r) => r.gameId)).size} / 9
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">Active Player Profile</span>
          <span className="text-lg font-bold truncate block text-blue-600 dark:text-blue-400">
            {profile.name || 'Guest'}
          </span>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white dark:bg-[#131b2e] rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        {myResults.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base mb-2 font-bold">No game matches logged yet for {profile.name}.</p>
            <p className="text-xs">Pick any game from the arcade menu to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Game</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Detail</th>
                  <th className="py-2.5 px-3 text-right">When</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {myResults.map((r) => {
                  const meta = GAME_MAP[r.gameId];
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{meta?.icon || '🎮'}</span>
                        <span>{r.g}</span>
                      </td>
                      <td className="py-3 px-3 font-mono-nums font-black text-blue-600 dark:text-blue-400">
                        {formatScore(r.gameId, r.v)}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {r.detail || '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-slate-500 dark:text-slate-400 font-mono-nums font-semibold">
                        {formatDate(r.t)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            sound.playPop();
                            if (onPublishResult) {
                              onPublishResult(r);
                            }
                          }}
                          className="py-1 px-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Publish this score record and get a shareable link"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Publish</span>
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
