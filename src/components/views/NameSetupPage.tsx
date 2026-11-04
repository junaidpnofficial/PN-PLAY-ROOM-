import React, { useState } from 'react';
import { getProfile, saveProfile, ADMIN_NAME } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { User, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';

interface NameSetupPageProps {
  onConfirmName: (name: string) => void;
  onBackToLanding: () => void;
}

export const NameSetupPage: React.FC<NameSetupPageProps> = ({
  onConfirmName,
  onBackToLanding,
}) => {
  const profile = getProfile();
  const [name, setName] = useState(profile.name || 'JUNAID P.N');
  const [error, setError] = useState('');

  const handleConfirm = (chosenName?: string) => {
    const finalName = (chosenName || name).trim().slice(0, 20);
    if (!finalName) {
      setError('Please enter a player name to appear on the scoreboard.');
      sound.playError();
      return;
    }
    sound.playSuccess();
    const updatedPlayers = [finalName, ...profile.players.filter((p) => p !== finalName)].slice(0, 8);
    saveProfile({ name: finalName, players: updatedPlayers });
    onConfirmName(finalName);
  };

  const presetList = profile.players.length > 0 ? profile.players : [ADMIN_NAME, 'Alex', 'Sam', 'Jordan'];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-xl relative">
        {/* Back Button */}
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
          <Trophy className="w-7 h-7" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight mb-2">
          Scoreboard Player Name
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          Type or choose the name that will be recorded on all leaderboards, personal records, and match scores.
        </p>

        {/* Name Input Box */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Player Name</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
            maxLength={20}
            placeholder="Enter player name..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131b2e] font-bold text-base text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
          />
          {error && <p className="text-xs font-semibold text-rose-500 mt-2">{error}</p>}

          {/* Quick Preset Buttons */}
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
              Select existing scoreboard name:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetList.map((pName) => (
                <button
                  key={pName}
                  type="button"
                  onClick={() => {
                    setName(pName);
                    handleConfirm(pName);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    pName === name
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 hover:border-blue-500'
                  }`}
                >
                  {pName === ADMIN_NAME ? '👑 ' + pName : pName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => handleConfirm()}
          className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue to Scoreboards & Games</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
