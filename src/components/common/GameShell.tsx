import React, { useEffect, useState } from 'react';
import { RotateCcw, Pause, Play, Volume2, VolumeX, SkipForward, Home, Share2 } from 'lucide-react';
import { GameId } from '../../types';
import { GAME_MAP } from '../../data/gamesMeta';
import { sound } from '../../utils/audio';

interface GameShellProps {
  gameId: GameId;
  onBack: () => void;
  onRestart: () => void;
  onNextGame?: () => void;
  onOpenPublish?: () => void;
  children: (props: {
    seconds: number;
    isPaused: boolean;
    formatTime: (s: number) => string;
    onWinOrFinish: (score: number, detail?: string) => void;
  }) => React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({
  gameId,
  onBack,
  onRestart,
  onNextGame,
  onOpenPublish,
  children,
}) => {
  const meta = GAME_MAP[gameId];
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  useEffect(() => {
    setIsMuted(sound.initMuteState());
    setSeconds(0);
    setIsPaused(false);
  }, [gameId]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const toggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-6 relative">
      {/* Top action bar with Home, Pause/Resume, Restart, Next buttons */}
      <div className="flex items-center justify-between gap-2.5 mb-5 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
        >
          <Home className="w-4 h-4 text-blue-600" />
          <span>🏠 Home</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
              isPaused
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 hover:border-blue-600'
            }`}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? '▶ Resume' : '⏸ Pause'}</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={() => {
              setSeconds(0);
              onRestart();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 hover:border-blue-600 shadow-xs transition-all cursor-pointer"
            title="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>↻ Restart</span>
          </button>

          {/* Share / Publish Challenge Button */}
          {onOpenPublish && (
            <button
              onClick={onOpenPublish}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:border-blue-600 shadow-xs transition-all cursor-pointer"
              title="Publish Challenge & Share Link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          )}

          {/* Next Button */}
          {onNextGame && (
            <button
              onClick={() => {
                setSeconds(0);
                onNextGame();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 hover:border-blue-600 shadow-xs transition-all cursor-pointer"
              title="Next Game"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-600 dark:text-slate-300 hover:border-blue-600 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
          </button>
        </div>
      </div>

      {/* Game Title & Timer Header */}
      <div className="flex items-baseline justify-between mb-4 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={meta.name}>{meta.icon}</span>
          <div>
            <h2 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              {meta.name}
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
              {meta.tagline}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold font-mono-nums text-slate-700 dark:text-slate-300 bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full shadow-xs">
          <span>⏱ {formatTime(seconds)}</span>
        </div>
      </div>

      {/* Main Game Content */}
      <div className="w-full">
        {children({
          seconds,
          isPaused,
          formatTime,
          onWinOrFinish: (score, detail) => {},
        })}
      </div>

      {/* Pause Backdrop Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
              <Pause className="w-7 h-7" />
            </div>
            <h3 className="text-3xl font-black font-display text-slate-900 dark:text-white mb-2">
              Paused
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">
              Your timer is stopped. Pick up right where you left off.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>▶ Resume</span>
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  onBack();
                }}
                className="w-full py-2.5 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white hover:border-blue-600 font-bold text-xs transition-colors cursor-pointer"
              >
                🏠 Return to Arcade Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
