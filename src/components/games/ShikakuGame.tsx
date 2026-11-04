import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

interface Rect {
  id: string;
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  color: string;
}

interface PuzzleDef {
  name: string;
  size: number;
  // numbers at [row, col, value]
  numbers: Array<{ r: number; c: number; val: number }>;
}

const PUZZLES: PuzzleDef[] = [
  {
    name: 'Puzzle #1: Bright Squares (5x5)',
    size: 5,
    numbers: [
      { r: 0, c: 0, val: 4 }, // (0,0)-(1,1) = 2x2 = 4
      { r: 0, c: 2, val: 6 }, // (0,2)-(1,4) = 2x3 = 6
      { r: 2, c: 0, val: 3 }, // (2,0)-(2,2) = 1x3 = 3
      { r: 2, c: 3, val: 2 }, // (2,3)-(2,4) = 1x2 = 2
      { r: 3, c: 0, val: 6 }, // (3,0)-(4,2) = 2x3 = 6
      { r: 3, c: 3, val: 4 }, // (3,3)-(4,4) = 2x2 = 4
    ],
  },
  {
    name: 'Puzzle #2: Rainbow Mosaic (6x6)',
    size: 6,
    numbers: [
      { r: 0, c: 0, val: 6 }, // (0,0)-(1,2) = 2x3 = 6
      { r: 0, c: 3, val: 6 }, // (0,3)-(1,5) = 2x3 = 6
      { r: 2, c: 0, val: 4 }, // (2,0)-(3,1) = 2x2 = 4
      { r: 2, c: 2, val: 4 }, // (2,2)-(3,3) = 2x2 = 4
      { r: 2, c: 4, val: 8 }, // (2,4)-(5,5) = 4x2 = 8
      { r: 4, c: 0, val: 4 }, // (4,0)-(5,1) = 2x2 = 4
      { r: 4, c: 2, val: 4 }, // (4,2)-(5,3) = 2x2 = 4
    ],
  },
  {
    name: 'Puzzle #3: Prismatic Tiles (6x6)',
    size: 6,
    numbers: [
      { r: 0, c: 0, val: 9 }, // (0,0)-(2,2) = 3x3 = 9
      { r: 0, c: 3, val: 3 }, // (0,3)-(0,5) = 1x3 = 3
      { r: 1, c: 3, val: 6 }, // (1,3)-(2,5) = 2x3 = 6
      { r: 3, c: 0, val: 3 }, // (3,0)-(5,0) = 3x1 = 3
      { r: 3, c: 1, val: 5 }, // (3,1)-(3,5) = 1x5 = 5
      { r: 4, c: 1, val: 10 },// (4,1)-(5,5) = 2x5 = 10
    ],
  },
  {
    name: 'Puzzle #4: Emerald Quad (5x5)',
    size: 5,
    numbers: [
      { r: 0, c: 0, val: 5 }, // (0,0)-(4,0) = 5x1 = 5
      { r: 0, c: 1, val: 8 }, // (0,1)-(3,2) = 4x2 = 8
      { r: 0, c: 3, val: 4 }, // (0,3)-(1,4) = 2x2 = 4
      { r: 2, c: 3, val: 6 }, // (2,3)-(4,4) = 3x2 = 6
      { r: 4, c: 1, val: 2 }, // (4,1)-(4,2) = 1x2 = 2
    ],
  },
  {
    name: 'Puzzle #5: Sunset Spectrum (6x6)',
    size: 6,
    numbers: [
      { r: 0, c: 0, val: 12 },// (0,0)-(3,2) = 4x3 = 12
      { r: 0, c: 3, val: 6 }, // (0,3)-(1,5) = 2x3 = 6
      { r: 2, c: 3, val: 6 }, // (2,3)-(3,5) = 2x3 = 6
      { r: 4, c: 0, val: 6 }, // (4,0)-(5,2) = 2x3 = 6
      { r: 4, c: 3, val: 6 }, // (4,3)-(5,5) = 2x3 = 6
    ],
  },
  {
    name: 'Puzzle #6: Golden Triangles (5x5)',
    size: 5,
    numbers: [
      { r: 0, c: 0, val: 6 }, // (0,0)-(1,2) = 2x3 = 6
      { r: 0, c: 3, val: 4 }, // (0,3)-(1,4) = 2x2 = 4
      { r: 2, c: 0, val: 9 }, // (2,0)-(4,2) = 3x3 = 9
      { r: 2, c: 3, val: 6 }, // (2,3)-(4,4) = 3x2 = 6
    ],
  },
  {
    name: 'Puzzle #7: Royal Amethyst (6x6)',
    size: 6,
    numbers: [
      { r: 0, c: 0, val: 4 }, // (0,0)-(1,1) = 2x2 = 4
      { r: 0, c: 2, val: 8 }, // (0,2)-(3,3) = 4x2 = 8
      { r: 0, c: 4, val: 4 }, // (0,4)-(1,5) = 2x2 = 4
      { r: 2, c: 0, val: 8 }, // (2,0)-(5,1) = 4x2 = 8
      { r: 2, c: 4, val: 8 }, // (2,4)-(5,5) = 4x2 = 8
      { r: 4, c: 2, val: 4 }, // (4,2)-(5,3) = 2x2 = 4
    ],
  },
];

const PALETTE = [
  { fill: 'rgba(6, 182, 212, 0.22)', stroke: '#06b6d4', text: '#0891b2' }, // cyan
  { fill: 'rgba(236, 72, 153, 0.22)', stroke: '#ec4899', text: '#db2777' }, // pink
  { fill: 'rgba(139, 92, 246, 0.22)', stroke: '#8b5cf6', text: '#7c3aed' }, // purple
  { fill: 'rgba(16, 185, 129, 0.22)', stroke: '#10b981', text: '#059669' }, // emerald
  { fill: 'rgba(245, 158, 11, 0.22)', stroke: '#f59e0b', text: '#d97706' }, // amber
  { fill: 'rgba(59, 130, 246, 0.22)', stroke: '#3b82f6', text: '#2563eb' }, // blue
  { fill: 'rgba(249, 115, 22, 0.22)', stroke: '#f97316', text: '#ea580c' }, // orange
  { fill: 'rgba(168, 85, 247, 0.22)', stroke: '#a855f7', text: '#9333ea' }, // violet
];

let globalShikakuIndex = 0;

interface ShikakuGameProps {
  onRestart: () => void;
  gameKey: number;
}

export const ShikakuGame: React.FC<ShikakuGameProps> = ({ onRestart, gameKey }) => {
  const [puzzleIndex, setPuzzleIndex] = useState(() => {
    return globalShikakuIndex % PUZZLES.length;
  });

  const puzzle = PUZZLES[puzzleIndex % PUZZLES.length];
  const N = puzzle.size;

  const [rects, setRects] = useState<Rect[]>([]);
  const [dragStart, setDragStart] = useState<{ r: number; c: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ r: number; c: number } | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [feedback, setFeedback] = useState('Drag or tap two opposite corners to form a rectangle around each number.');

  const boardRef = useRef<HTMLDivElement | null>(null);

  // When gameKey updates (e.g. restart or next), advance puzzle!
  useEffect(() => {
    globalShikakuIndex = (globalShikakuIndex + 1) % PUZZLES.length;
    setPuzzleIndex(globalShikakuIndex);
    setRects([]);
    setDragStart(null);
    setDragCurrent(null);
    setIsSolved(false);
    setFeedback('Drag or tap two opposite corners to form a rectangle around each number.');
  }, [gameKey]);

  const handleNextPuzzle = () => {
    globalShikakuIndex = (globalShikakuIndex + 1) % PUZZLES.length;
    setPuzzleIndex(globalShikakuIndex);
    setRects([]);
    setDragStart(null);
    setDragCurrent(null);
    setIsSolved(false);
    setFeedback('New puzzle loaded! Drag or tap opposite corners to place rectangles.');
  };

  // Find if a cell has a clue number
  const getNumberAt = (r: number, c: number) => {
    return puzzle.numbers.find((n) => n.r === r && n.c === c);
  };

  // Check if a rectangle contains exactly 1 number matching its area
  const evaluateRect = (r1: number, c1: number, r2: number, c2: number) => {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    const area = (maxR - minR + 1) * (maxC - minC + 1);

    const enclosedNumbers = puzzle.numbers.filter(
      (n) => n.r >= minR && n.r <= maxR && n.c >= minC && n.c <= maxC
    );

    const isMatch = enclosedNumbers.length === 1 && enclosedNumbers[0].val === area;
    return { minR, maxR, minC, maxC, area, enclosedCount: enclosedNumbers.length, isMatch };
  };

  // Check victory condition
  const checkVictory = (currentRects: Rect[]) => {
    const allValid = currentRects.every((rect) => {
      const evalRes = evaluateRect(rect.r1, rect.c1, rect.r2, rect.c2);
      return evalRes.isMatch;
    });

    if (!allValid) return false;

    const covered = new Set<string>();
    for (const rect of currentRects) {
      const minR = Math.min(rect.r1, rect.r2);
      const maxR = Math.max(rect.r1, rect.r2);
      const minC = Math.min(rect.c1, rect.c2);
      const maxC = Math.max(rect.c1, rect.c2);

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const key = `${r},${c}`;
          if (covered.has(key)) return false;
          covered.add(key);
        }
      }
    }

    return covered.size === N * N;
  };

  const addRectangle = (r1: number, c1: number, r2: number, c2: number) => {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);

    const nonOverlapping = rects.filter((rect) => {
      const rMinR = Math.min(rect.r1, rect.r2);
      const rMaxR = Math.max(rect.r1, rect.r2);
      const rMinC = Math.min(rect.c1, rect.c2);
      const rMaxC = Math.max(rect.c1, rect.c2);

      const hasOverlap = !(maxR < rMinR || minR > rMaxR || maxC < rMinC || minC > rMaxC);
      return !hasOverlap;
    });

    const color = PALETTE[nonOverlapping.length % PALETTE.length].stroke;
    const newRect: Rect = {
      id: `${Date.now()}_${Math.random()}`,
      r1: minR,
      c1: minC,
      r2: maxR,
      c2: maxC,
      color,
    };

    const nextRects = [...nonOverlapping, newRect];
    setRects(nextRects);

    const evalRes = evaluateRect(minR, minC, maxR, maxC);
    if (evalRes.isMatch) {
      sound.playMatch();
    } else {
      sound.playPop();
    }

    if (checkVictory(nextRects)) {
      setIsSolved(true);
      sound.playSuccess();
      confetti({ particleCount: 90, spread: 75 });
      setFeedback('🎉 Outstanding! You partitioned the entire grid into colorful Shikaku rectangles!');
      recordGameResult('shikaku', Math.floor(Date.now() / 1000) % 3600, `Solved ${puzzle.name}`);
    } else {
      setFeedback(
        evalRes.isMatch
          ? `Nice! Rectangle area of ${evalRes.area} matched.`
          : `Area is ${evalRes.area} tiles. Make sure it contains exactly 1 number matching its area.`
      );
    }
  };

  const removeRectAt = (r: number, c: number) => {
    const foundIndex = rects.findIndex(
      (rect) => r >= rect.r1 && r <= rect.r2 && c >= rect.c1 && c <= rect.c2
    );
    if (foundIndex >= 0) {
      sound.playPop();
      const updated = rects.filter((_, i) => i !== foundIndex);
      setRects(updated);
      setFeedback('Rectangle removed. Tap or drag to draw a new one.');
      return true;
    }
    return false;
  };

  const handleCellClick = (r: number, c: number) => {
    if (isSolved) return;

    if (!dragStart) {
      const removed = removeRectAt(r, c);
      if (!removed) {
        sound.playPop();
        setDragStart({ r, c });
        setDragCurrent({ r, c });
      }
    } else {
      addRectangle(dragStart.r, dragStart.c, r, c);
      setDragStart(null);
      setDragCurrent(null);
    }
  };

  const clearAll = () => {
    if (isSolved) return;
    setRects([]);
    setDragStart(null);
    setDragCurrent(null);
    setFeedback('Board cleared. Start placing your colorful rectangles.');
  };

  const preview = dragStart && dragCurrent ? {
    minR: Math.min(dragStart.r, dragCurrent.r),
    maxR: Math.max(dragStart.r, dragCurrent.r),
    minC: Math.min(dragStart.c, dragCurrent.c),
    maxC: Math.max(dragStart.c, dragCurrent.c),
  } : null;

  const previewArea = preview ? (preview.maxR - preview.minR + 1) * (preview.maxC - preview.minC + 1) : 0;

  return (
    <div className="flex flex-col items-center">
      {/* Puzzle selector & controls */}
      <div className="flex items-center justify-between w-full max-w-sm gap-2 mb-3">
        <span className="text-xs font-black text-blue-600 dark:text-blue-400">
          {puzzle.name}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNextPuzzle}
            className="py-1 px-3 text-xs font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-800 dark:text-white hover:border-blue-600 transition-colors cursor-pointer shadow-xs"
          >
            Next Puzzle ▶
          </button>
          <button
            onClick={clearAll}
            disabled={rects.length === 0 || isSolved}
            className="py-1 px-2.5 text-xs font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-rose-500 hover:border-rose-400 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Shikaku Colorful Grid Container */}
      <div
        ref={boardRef}
        className="relative bg-white dark:bg-[#1c1836] p-3 rounded-3xl border-2 border-[#dcd8f0] dark:border-[#2e2854] shadow-md select-none w-full max-w-[380px] aspect-square"
      >
        <div
          className="grid gap-1.5 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: N * N }).map((_, idx) => {
            const r = Math.floor(idx / N);
            const c = idx % N;
            const clue = getNumberAt(r, c);

            const inRect = rects.find(
              (rect) => r >= rect.r1 && r <= rect.r2 && c >= rect.c1 && c <= rect.c2
            );

            const inPreview =
              preview &&
              r >= preview.minR &&
              r <= preview.maxR &&
              c >= preview.minC &&
              c <= preview.maxC;

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(r, c)}
                onMouseEnter={() => {
                  if (dragStart) setDragCurrent({ r, c });
                }}
                style={{
                  backgroundColor: inRect
                    ? inRect.color + '26'
                    : inPreview
                    ? 'rgba(37, 99, 235, 0.25)'
                    : undefined,
                  borderColor: inRect ? inRect.color : inPreview ? '#2563eb' : undefined,
                }}
                className={`rounded-xl flex items-center justify-center font-extrabold text-base sm:text-xl font-display transition-all cursor-pointer border-2 relative ${
                  inRect
                    ? 'shadow-xs font-black'
                    : inPreview
                    ? 'border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-600'
                }`}
              >
                {clue ? (
                  <span
                    style={{ color: inRect ? inRect.color : undefined }}
                    className={!inRect ? 'text-slate-900 dark:text-white font-mono-nums' : 'font-mono-nums font-black scale-110 drop-shadow-xs'}
                  >
                    {clue.val}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Outcome and Preview status */}
      <div className="mt-3 text-center min-h-[3.5rem] flex flex-col items-center justify-center">
        {isSolved ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-black text-blue-600 dark:text-blue-400">
              🎉 Level Solved! Ready for the next challenge?
            </p>
            <button
              onClick={handleNextPuzzle}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              Play Next Puzzle ▶
            </button>
          </div>
        ) : dragStart && preview ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>Selecting: {preview.maxR - preview.minR + 1} × {preview.maxC - preview.minC + 1} = {previewArea} tiles</span>
            <span>(Tap opposite corner)</span>
          </div>
        ) : (
          <p className="text-xs max-w-sm text-slate-500 dark:text-slate-400 font-medium">
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
};
