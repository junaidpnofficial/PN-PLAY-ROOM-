import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

interface WhackAMoleProps {
  onRestart: () => void;
  gameKey: number;
}

export const WhackAMole: React.FC<WhackAMoleProps> = ({ onRestart, gameKey }) => {
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [activeMole, setActiveMole] = useState<number>(-1);
  const [isGolden, setIsGolden] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [hitFeedback, setHitFeedback] = useState<number | null>(null);

  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clockTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initGame();
    return () => {
      clearAllTimers();
    };
  }, [gameKey]);

  const clearAllTimers = () => {
    if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);
  };

  const initGame = () => {
    clearAllTimers();
    setScore(0);
    setTimeLeft(20);
    setActiveMole(-1);
    setIsGameOver(false);
    setHitFeedback(null);

    // Mole spawn interval
    moleTimerRef.current = setInterval(() => {
      const nextHole = Math.floor(Math.random() * 9);
      const goldenChance = Math.random() < 0.2; // 20% golden mole for +3 pts
      setIsGolden(goldenChance);
      setActiveMole(nextHole);
    }, 700);

    // Countdown timer
    clockTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearAllTimers();
          setActiveMole(-1);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // When game finishes, record score
  useEffect(() => {
    if (isGameOver && timeLeft === 0) {
      if (score >= 15) {
        sound.playSuccess();
        confetti({ particleCount: 75, spread: 60 });
      }
      recordGameResult('whack', score, `Whacked ${score} moles in 20s`);
    }
  }, [isGameOver, timeLeft]);

  const handleHoleClick = (index: number) => {
    if (isGameOver) return;

    if (index === activeMole) {
      sound.playHit();
      const points = isGolden ? 3 : 1;
      setScore((prev) => prev + points);
      setHitFeedback(index);
      setActiveMole(-1);

      setTimeout(() => {
        setHitFeedback(null);
      }, 250);
    } else {
      sound.playPop();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* HUD Info */}
      <div className="flex items-center justify-between w-full max-w-xs text-xs font-semibold text-[#6b678a] dark:text-[#9994c4] mb-3 px-1">
        <span className="font-bold text-[#1e1b3a] dark:text-white">
          Score: <span className="text-emerald-500 font-mono-nums text-base">{score}</span>
        </span>
        <span className="font-mono-nums text-rose-500 font-bold text-sm">
          ⏳ {timeLeft}s left
        </span>
      </div>

      {/* 3x3 Mole Holes Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs aspect-square p-3 rounded-2xl bg-[#593d2e]/10 dark:bg-[#1a1410] border-2 border-[#8c5e3c]/30 shadow-md">
        {Array.from({ length: 9 }).map((_, idx) => {
          const isMoleHere = activeMole === idx;
          const wasHitHere = hitFeedback === idx;

          return (
            <button
              key={idx}
              onClick={() => handleHoleClick(idx)}
              disabled={isGameOver}
              aria-label={`Mole hole ${idx + 1}`}
              className={`aspect-square rounded-2xl relative overflow-hidden flex items-center justify-center transition-all select-none border-2 cursor-pointer shadow-inner ${
                isMoleHere
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-[#7a4e32]/40 bg-[#422918]/25 dark:bg-[#2e1d12]/50'
              }`}
            >
              {/* Hole ground depression */}
              <div className="absolute inset-x-2 bottom-1.5 h-3 bg-black/30 rounded-full blur-[1px]" />

              {/* Mole Sprite */}
              {isMoleHere && (
                <div className="text-4xl sm:text-5xl animate-bounce transform -translate-y-1 select-none">
                  {isGolden ? '🌟' : '🐹'}
                </div>
              )}

              {/* Hit Splash */}
              {wasHitHere && (
                <div className="absolute inset-0 flex items-center justify-center font-black text-rose-500 text-2xl animate-ping select-none">
                  💥
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Outcome and Guidance */}
      <div className="mt-5 text-center min-h-[3.5rem] flex flex-col items-center justify-center">
        {isGameOver ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-black text-slate-900 dark:text-white">
              ⏰ Time's up! You scored {score} {score === 1 ? 'hit' : 'hits'}!
            </p>
            <button
              onClick={onRestart}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              Play Again
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tap the mole as fast as you can! Golden 🌟 moles are worth +3 points!
          </p>
        )}
      </div>
    </div>
  );
};
