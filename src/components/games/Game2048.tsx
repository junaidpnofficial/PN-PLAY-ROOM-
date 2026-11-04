import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function getEmptyIndices(board: number[]): number[] {
  return board.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
}

function spawnTile(board: number[]): number[] {
  const empty = getEmptyIndices(board);
  if (!empty.length) return board;
  const target = empty[Math.floor(Math.random() * empty.length)];
  const next = [...board];
  next[target] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slideLine(line: number[], onMerge: (val: number) => void): number[] {
  const nonZero = line.filter(Boolean);
  const result: number[] = [];
  let i = 0;

  while (i < nonZero.length) {
    if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
      const mergedVal = nonZero[i] * 2;
      result.push(mergedVal);
      onMerge(mergedVal);
      i += 2;
    } else {
      result.push(nonZero[i]);
      i += 1;
    }
  }

  while (result.length < 4) {
    result.push(0);
  }

  return result;
}

function canMove(board: number[]): boolean {
  if (board.includes(0)) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = board[r * 4 + c];
      if (c < 3 && val === board[r * 4 + c + 1]) return true;
      if (r < 3 && val === board[(r + 1) * 4 + c]) return true;
    }
  }
  return false;
}

function getTileColor(val: number): string {
  if (!val) return 'bg-[#dcd8f0]/40 dark:bg-[#282247]/50 text-transparent';
  const colors: Record<number, string> = {
    2: 'bg-[#eeecff] dark:bg-[#2f2759] text-[#1e1b3a] dark:text-white',
    4: 'bg-[#ddd8ff] dark:bg-[#3d3275] text-[#1e1b3a] dark:text-white',
    8: 'bg-[#ff9478] text-white font-bold',
    16: 'bg-[#ff6e54] text-white font-bold',
    32: 'bg-[#ff5542] text-white font-extrabold',
    64: 'bg-[#e53e3e] text-white font-extrabold shadow-sm',
    128: 'bg-[#f6ad55] text-white font-extrabold shadow-sm',
    256: 'bg-[#ecc94b] text-white font-extrabold shadow-md',
    512: 'bg-[#d69e2e] text-white font-extrabold shadow-md',
    1024: 'bg-[#319795] text-white font-extrabold shadow-lg',
    2048: 'bg-[#805ad5] text-white font-black shadow-xl ring-2 ring-yellow-300',
  };
  return colors[val] || 'bg-[#2b6cb0] text-white font-black ring-2 ring-emerald-400';
}

interface Game2048Props {
  onRestart: () => void;
  gameKey: number;
}

export const Game2048: React.FC<Game2048Props> = ({ onRestart, gameKey }) => {
  const [board, setBoard] = useState<number[]>(() => {
    let b = Array(16).fill(0);
    b = spawnTile(b);
    return spawnTile(b);
  });
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('playroom_2048_best') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let fresh = Array(16).fill(0);
    fresh = spawnTile(fresh);
    fresh = spawnTile(fresh);
    setBoard(fresh);
    setScore(0);
    setIsGameOver(false);
  }, [gameKey]);

  const executeMove = (dir: Direction) => {
    if (isGameOver) return;

    let pointsAdded = 0;
    const nextBoard = [...board];
    let changed = false;

    const onMerge = (val: number) => {
      pointsAdded += val;
    };

    if (dir === 'LEFT' || dir === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        const row = [nextBoard[r * 4], nextBoard[r * 4 + 1], nextBoard[r * 4 + 2], nextBoard[r * 4 + 3]];
        const line = dir === 'LEFT' ? row : [...row].reverse();
        const slid = slideLine(line, onMerge);
        const finalLine = dir === 'LEFT' ? slid : [...slid].reverse();

        for (let c = 0; c < 4; c++) {
          if (nextBoard[r * 4 + c] !== finalLine[c]) changed = true;
          nextBoard[r * 4 + c] = finalLine[c];
        }
      }
    } else {
      // UP or DOWN
      for (let c = 0; c < 4; c++) {
        const col = [nextBoard[c], nextBoard[4 + c], nextBoard[8 + c], nextBoard[12 + c]];
        const line = dir === 'UP' ? col : [...col].reverse();
        const slid = slideLine(line, onMerge);
        const finalLine = dir === 'UP' ? slid : [...slid].reverse();

        for (let r = 0; r < 4; r++) {
          if (nextBoard[r * 4 + c] !== finalLine[r]) changed = true;
          nextBoard[r * 4 + c] = finalLine[r];
        }
      }
    }

    if (changed) {
      sound.playSlide();
      const spawned = spawnTile(nextBoard);
      const nextScore = score + pointsAdded;
      setBoard(spawned);
      setScore(nextScore);

      if (nextScore > bestScore) {
        setBestScore(nextScore);
        try {
          localStorage.setItem('playroom_2048_best', String(nextScore));
        } catch {}
      }

      if (pointsAdded >= 2048) {
        confetti({ particleCount: 70, spread: 60 });
      }

      if (!canMove(spawned)) {
        setIsGameOver(true);
        sound.playError();
        recordGameResult('2048', nextScore, `Reached ${nextScore} points`);
      }
    }
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, Direction> = {
          ArrowUp: 'UP',
          ArrowDown: 'DOWN',
          ArrowLeft: 'LEFT',
          ArrowRight: 'RIGHT',
        };
        executeMove(map[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Touch swipe events
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      executeMove(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      executeMove(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Score strip */}
      <div className="flex items-center justify-between w-full max-w-sm mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Score</span>
            <span className="text-base font-black font-mono-nums text-slate-900 dark:text-white">{score}</span>
          </div>
          <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Best</span>
            <span className="text-base font-black font-mono-nums text-blue-600 dark:text-blue-400">{bestScore}</span>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
          Swipe or Arrow Keys
        </span>
      </div>

      {/* 4x4 Grid Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="grid grid-cols-4 gap-2.5 p-3 rounded-3xl bg-slate-200 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 w-full max-w-sm aspect-square select-none shadow-md touch-none"
      >
        {board.map((val, idx) => (
          <div
            key={idx}
            className={`aspect-square rounded-2xl flex items-center justify-center font-display font-black transition-all duration-100 ${getTileColor(
              val
            )} ${val > 512 ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'}`}
          >
            {val > 0 ? val : ''}
          </div>
        ))}
      </div>

      {/* Directional Pad for Mobile / Clicking */}
      <div className="grid grid-cols-3 gap-2 w-48 mt-4">
        <div />
        <button
          onClick={() => executeMove('UP')}
          aria-label="Up"
          className="py-2.5 rounded-xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white shadow-xs hover:border-blue-600 active:scale-95 transition-all cursor-pointer"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => executeMove('LEFT')}
          aria-label="Left"
          className="py-2.5 rounded-xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white shadow-xs hover:border-blue-600 active:scale-95 transition-all cursor-pointer"
        >
          ◀
        </button>
        <button
          onClick={() => executeMove('DOWN')}
          aria-label="Down"
          className="py-2.5 rounded-xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white shadow-xs hover:border-blue-600 active:scale-95 transition-all cursor-pointer"
        >
          ▼
        </button>
        <button
          onClick={() => executeMove('RIGHT')}
          aria-label="Right"
          className="py-2.5 rounded-xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white shadow-xs hover:border-blue-600 active:scale-95 transition-all cursor-pointer"
        >
          ▶
        </button>
      </div>

      {/* Game Over status */}
      <div className="mt-3 text-center min-h-[3rem]">
        {isGameOver ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-rose-500">
              Game Over! No more moves possible.
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
            Slide tiles into each other to merge same numbers!
          </p>
        )}
      </div>
    </div>
  );
};
