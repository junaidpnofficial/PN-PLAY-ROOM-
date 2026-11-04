import React, { useState } from 'react';
import { getProfile, saveProfile } from '../../utils/storage';
import { User, X, Check } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNameChanged: (name: string) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ isOpen, onClose, onNameChanged }) => {
  const [profile, setProfileState] = useState(() => getProfile());
  const [inputVal, setInputVal] = useState(profile.name);

  if (!isOpen) return null;

  const handleSelectName = (name: string) => {
    const trimmed = name.trim().slice(0, 20);
    if (!trimmed) return;
    const nextPlayers = [trimmed, ...profile.players.filter((p) => p !== trimmed)].slice(0, 8);
    const updated = { name: trimmed, players: nextPlayers };
    saveProfile(updated);
    setProfileState(updated);
    onNameChanged(trimmed);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSelectName(inputVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <h3 className="text-xl font-black font-display text-slate-900 dark:text-white">
            Scoreboard Player
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 font-medium">
          Pick or enter a nickname for the scoreboard. Each player on this device has their own stats.
        </p>

        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            maxLength={20}
            placeholder="Enter player name"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 mb-3"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow hover:opacity-95 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Select Player</span>
          </button>
        </form>

        {profile.players.length > 0 && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Recent Players
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.players.map((pName) => (
                <button
                  key={pName}
                  type="button"
                  onClick={() => handleSelectName(pName)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    pName === profile.name
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-600'
                  }`}
                >
                  {pName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
