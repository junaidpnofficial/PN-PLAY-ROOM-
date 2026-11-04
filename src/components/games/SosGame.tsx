import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

interface SosGameProps {
  onRestart: () => void;
  gameKey: number;
}

const DIRS = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal down-right
  [1, -1],  // diagonal down-left
];

export const SosGame: React.FC<SosGameProps> = ({ onRestart, gameKey }) => {
  const [size, setSize] = useState<number>(8);
  const [mode, setMode] = useState<'cpu' | 'two'>('cpu');
  const [letterChoice, setLetterChoice] = useState<'S' | 'O'>('S');
  const [board, setBoard] = useState<string[]>([]);
  const [owners, setOwners] = useState<number[]>([]);
  const [turn, setTurn] = useState<number>(0); // 0 = Player 1/User, 1 = Player 2/Bot
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [sosLines, setSosLines] = useState<number[][]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initGame(size);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [size, mode, gameKey]);

  const initGame = (n: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBoard(Array(n * n).fill(''));
    setOwners(Array(n * n).fill(-1));
    setTurn(0);
    setScores([0, 0]);
    setGameOver(false);
    setSosLines([]);
  };

  const getCell = (b: string[], r: number, c: number, n: number) => {
    if (r < 0 || c < 0 || r >= n || c >= n) return '';
    return b[r * n + c];
  };

  const countSosAt = (b: string[], idx: number, placed: 'S' | 'O', n: number): { count: number; lines: number[][] } => {
    const r = Math.floor(idx / n);
    const c = idx % n;
    let found = 0;
    const lines: number[][] = [];

    for (const [dr, dc] of DIRS) {
      if (placed === 'O') {
        if (getCell(b, r - dr, c - dc, n) === 'S' && getCell(b, r + dr, c + dc, n) === 'S') {
          found++;
          lines.push([(r - dr) * n + (c - dc), idx, (r + dr) * n + (c + dc)]);
        }
      } else {
        // placed === 'S'
        // S - O - S forward
        if (getCell(b, r + dr, c + dc, n) === 'O' && getCell(b, r + 2 * dr, c + 2 * dc, n) === 'S') {
          found++;
          lines.push([idx, (r + dr) * n + (c + dc), (r + 2 * dr) * n + (c + 2 * dc)]);
        }
        // S - O - S backward
        if (getCell(b, r - dr, c - dc, n) === 'O' && getCell(b, r - 2 * dr, c - 2 * dc, n) === 'S') {
          found++;
          lines.push([(r - 2 * dr) * n + (c - 2 * dc), (r - dr) * n + (c - dc), idx]);
        }
      }
    }
    return { count: found, lines };
  };

  const getAvailableMoves = (b: string[]) => {
    const moves: Array<{ idx: number; char: 'S' | 'O' }> = [];
    b.forEach((v, i) => {
      if (!v) {
        moves.push({ idx: i, char: 'S' });
        moves.push({ idx: i, char: 'O' });
      }
    });
    return moves;
  };

  const computeBestCpuMove = (b: string[], n: number): { idx: number; char: 'S' | 'O' } => {
    const moves = getAvailableMoves(b);
    if (!moves.length) return { idx: 0, char: 'S' };

    // 1. Can CPU score immediately?
    let maxScore = 0;
    let scoringMoves: Array<{ idx: number; char: 'S' | 'O' }> = [];

    for (const m of moves) {
      b[m.idx] = m.char;
      const { count } = countSosAt(b, m.idx, m.char, n);
      b[m.idx] = '';
      if (count > maxScore) {
        maxScore = count;
        scoringMoves = [m];
      } else if (count === maxScore && maxScore > 0) {
        scoringMoves.push(m);
      }
    }

    if (maxScore > 0 && scoringMoves.length > 0) {
      return scoringMoves[Math.floor(Math.random() * scoringMoves.length)];
    }

    // 2. Avoid giving player a free SOS on their next turn
    const safeMoves = moves.filter((m) => {
      b[m.idx] = m.char;
      const playerMoves = getAvailableMoves(b);
      const givesFreebie = playerMoves.some((pm) => {
        b[pm.idx] = pm.char;
        const res = countSosAt(b, pm.idx, pm.char, n);
        b[pm.idx] = '';
        return res.count > 0;
      });
      b[m.idx] = '';
      return !givesFreebie;
    });

    const candidatePool = safeMoves.length > 0 ? safeMoves : moves;
    return candidatePool[Math.floor(Math.random() * candidatePool.length)];
  };

  const applyMove = (idx: number, char: 'S' | 'O', playerIdx: number) => {
    const nextBoard = [...board];
    const nextOwners = [...owners];
    nextBoard[idx] = char;
    nextOwners[idx] = playerIdx;

    const { count, lines } = countSosAt(nextBoard, idx, char, size);
    let nextScores: [number, number] = [scores[0], scores[1]];

    if (count > 0) {
      sound.playMatch();
      nextScores[playerIdx] += count;
      setSosLines((prev) => [...prev, ...lines]);
    } else {
      sound.playPop();
    }

    const isFull = !nextBoard.includes('');
    setBoard(nextBoard);
    setOwners(nextOwners);
    setScores(nextScores);

    if (isFull) {
      setGameOver(true);
      if (mode === 'cpu') {
        recordGameResult('sos', nextScores[0], `Score: ${nextScores[0]} vs ${nextScores[1]}`);
        if (nextScores[0] > nextScores[1]) {
          sound.playSuccess();
          confetti({ particleCount: 75, spread: 60 });
        } else if (nextScores[0] < nextScores[1]) {
          sound.playError();
        }
      }
      return;
    }

    // In SOS rules: if you form an SOS, you get to play again! Otherwise turn passes
    const nextTurn = count > 0 ? playerIdx : 1 - playerIdx;
    setTurn(nextTurn);

    if (mode === 'cpu' && nextTurn === 1) {
      // Trigger CPU move
      timeoutRef.current = setTimeout(() => {
        executeCpuTurn(nextBoard, nextOwners, nextScores);
      }, 500);
    }
  };

  const executeCpuTurn = (currentBoard: string[], currentOwners: number[], currentScores: [number, number]) => {
    const bestMove = computeBestCpuMove(currentBoard, size);
    const nextBoard = [...currentBoard];
    const nextOwners = [...currentOwners];
    nextBoard[bestMove.idx] = bestMove.char;
    nextOwners[bestMove.idx] = 1;

    const { count, lines } = countSosAt(nextBoard, bestMove.idx, bestMove.char, size);
    const nextScores: [number, number] = [currentScores[0], currentScores[1]];

    if (count > 0) {
      sound.playMatch();
      nextScores[1] += count;
      setSosLines((prev) => [...prev, ...lines]);
    } else {
      sound.playPop();
    }

    const isFull = !nextBoard.includes('');
    setBoard(nextBoard);
    setOwners(nextOwners);
    setScores(nextScores);

    if (isFull) {
      setGameOver(true);
      recordGameResult('sos', nextScores[0], `Score: ${nextScores[0]} vs ${nextScores[1]}`);
      if (nextScores[0] > nextScores[1]) {
        sound.playSuccess();
        confetti({ particleCount: 75, spread: 60 });
      } else if (nextScores[0] < nextScores[1]) {
        sound.playError();
      }
      return;
    }

    // If CPU scored, it goes again!
    if (count > 0) {
      timeoutRef.current = setTimeout(() => {
        executeCpuTurn(nextBoard, nextOwners, nextScores);
      }, 600);
    } else {
      setTurn(0);
    }
  };

  const handleCellClick = (idx: number) => {
    if (board[idx] || gameOver) return;
    if (mode === 'cpu' && turn === 1) return;
    applyMove(idx, letterChoice, turn);
  };

  const playerNames = mode === 'cpu' ? ['You', 'Computer'] : ['Player 1', 'Player 2'];

  return (
    <div className="flex flex-col items-center">
      {/* Controls row */}
      <div className="flex items-center justify-between w-full max-w-md gap-2 mb-3 flex-wrap">
        {/* Mode switcher */}
        <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          <button
            onClick={() => setMode('cpu')}
            className={`py-1 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              mode === 'cpu' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            vs Computer
          </button>
          <button
            onClick={() => setMode('two')}
            className={`py-1 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              mode === 'two' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            2 Players
          </button>
        </div>

        {/* Grid size */}
        <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          {[5, 8, 10].map((n) => (
            <button
              key={n}
              onClick={() => setSize(n)}
              className={`py-1 px-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                size === n ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {n}x{n}
            </button>
          ))}
        </div>
      </div>

      {/* S or O Choice Segment */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Letter to place:</span>
        <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          <button
            onClick={() => setLetterChoice('S')}
            className={`py-1 px-4 text-xs font-black rounded-lg transition-colors cursor-pointer ${
              letterChoice === 'S'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Place S
          </button>
          <button
            onClick={() => setLetterChoice('O')}
            className={`py-1 px-4 text-xs font-black rounded-lg transition-colors cursor-pointer ${
              letterChoice === 'O'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Place O
          </button>
        </div>
      </div>

      {/* Turn & Score Header */}
      <div className="flex items-center justify-between w-full max-w-md text-xs font-bold text-slate-700 dark:text-slate-200 mb-3 px-1">
        <span className="text-blue-600 dark:text-blue-400 font-extrabold">
          {gameOver
            ? scores[0] === scores[1]
              ? "Game over: It's a tie!"
              : `${scores[0] > scores[1] ? playerNames[0] : playerNames[1]} wins!`
            : `${playerNames[turn]}'s turn`}
        </span>
        <span className="font-mono-nums font-black">
          <span className="text-blue-600 dark:text-blue-400">{playerNames[0]}: {scores[0]}</span>
          {' · '}
          <span className="text-slate-800 dark:text-white">{playerNames[1]}: {scores[1]}</span>
        </span>
      </div>

      {/* SOS Board */}
      <div
        className="grid gap-1.5 w-full max-w-md bg-white dark:bg-[#131b2e] p-3 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm select-none"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {board.map((val, idx) => {
          const owner = owners[idx];
          const isCpuThinking = mode === 'cpu' && turn === 1 && !gameOver;
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={Boolean(val) || gameOver || isCpuThinking}
              style={{
                fontSize: size === 10 ? '0.85rem' : size === 8 ? '1.1rem' : '1.4rem',
              }}
              className={`aspect-square rounded-xl flex items-center justify-center font-black font-display border-2 transition-all cursor-pointer ${
                val
                  ? owner === 0
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-600'
                    : 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border-slate-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-600'
              }`}
            >
              {val}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3 max-w-md font-medium">
        Form S-O-S in any direction to score and earn another turn!
      </p>
    </div>
  );
};
