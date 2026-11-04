import React from 'react';
import { sound } from '../../utils/audio';
import { Play, Smartphone, Monitor } from 'lucide-react';

interface LandingPageProps {
  onLetsPlay: () => void;
  deviceMode: 'pc' | 'mobile';
  onToggleDeviceMode: (mode: 'pc' | 'mobile') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLetsPlay,
  deviceMode,
  onToggleDeviceMode,
}) => {
  const handlePress = () => {
    sound.playSuccess();
    onLetsPlay();
  };

  const gameBadges = [
    { icon: '🃏', name: 'Memory' },
    { icon: '⭕', name: 'Tic-Tac-Toe' },
    { icon: '🆘', name: 'SOS' },
    { icon: '🔢', name: 'Sudoku' },
    { icon: '🟩', name: 'Shikaku' },
    { icon: '🕵️', name: 'Nonogram' },
    { icon: '🧮', name: '2048' },
    { icon: '🔤', name: 'Hangman' },
    { icon: '🐹', name: 'Whack-a-Mole' },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 relative text-center">
      {/* Top Device Mode Selector Banner */}
      <div className="mb-8 flex items-center gap-2 bg-white dark:bg-[#131b2e] px-4 py-2 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Mode:
        </span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => {
              sound.playPop();
              onToggleDeviceMode('mobile');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => {
              sound.playPop();
              onToggleDeviceMode('pc');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              deviceMode === 'pc'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC</span>
          </button>
        </div>
      </div>

      {/* Hero Badge - Electric Blue & White */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-5xl sm:text-6xl shadow-xl shadow-blue-500/25 mb-6 select-none hover:scale-105 transition-transform">
        🎮
      </div>

      {/* Main App Name "Play Room" - Clean Electric Blue */}
      <h1 className="text-5xl sm:text-7xl font-black font-display tracking-tight mb-3 text-blue-600 dark:text-blue-400 select-none">
        Play Room
      </h1>

      <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-10 leading-relaxed">
        Your ultimate arcade with 9 fun logic, puzzle, and strategy games.
      </p>

      {/* Big Press Button: "Let's Play" - Electric Blue with White Text */}
      <div className="relative group mb-12">
        <button
          onClick={handlePress}
          className="px-12 py-5 sm:px-16 sm:py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl sm:text-3xl shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-4 border-4 border-white"
        >
          <Play className="w-8 h-8 fill-white" />
          <span className="tracking-wide">Let's Play</span>
        </button>
      </div>

      {/* 9 Games Showcase Strip - Pure White Cards with Blue Accents */}
      <div className="w-full max-w-xl bg-white dark:bg-[#131b2e] p-5 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-md">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-3">
          9 Games Ready to Play
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {gameBadges.map((badge, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mb-1">{badge.icon}</span>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
