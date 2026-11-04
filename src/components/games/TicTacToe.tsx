import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

type Player = 'X' | 'O' | null;

function checkWinner(board: Player[]): { winner: Player | 'D' | null; line?: number[] } {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (!board.includes(null)) {
    return { winner: 'D' };
  }
  return { winner: null };
}

function minimax(board: Player[], isMaximizing: boolean): number {
  const { winner } = checkWinner(board);
  if (winner === 'O') return 10;
  if (winner === 'X') return -10;
  if (winner === 'D') return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, true));
        board[i] = null;
      }
    }
    return best;
  }
}

function getBestCpuMove(board: Player[]): number {
  let bestVal = -Infinity;
  const bestMoves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      const moveVal = minimax(board, false);
      board[i] = null;
      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMoves.length = 0;
        bestMoves.push(i);
      } else if (moveVal === bestVal) {
        bestMoves.push(i);
      }
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

interface TicTacToeProps {
  onRestart: () => void;
  gameKey: number;
}

export const TicTacToe: React.FC<TicTacToeProps> = ({ onRestart, gameKey }) => {
  const [mode, setMode] = useState<'cpu' | 'two'>('cpu');
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [tally, setTally] = useState({ X: 0, O: 0, D: 0 });

  useEffect(() => {
    resetRound();
  }, [mode, gameKey]);

  const [roundCount, setRoundCount] = useState(0);

  const resetRound = () => {
    const nextRound = roundCount + 1;
    setRoundCount(nextRound);
    const startPlayer: 'X' | 'O' = nextRound % 2 === 1 ? 'X' : 'O';
    const emptyBoard = Array(9).fill(null);
    setWinningLine(null);
    setGameOver(false);
    setStatusText('');

    if (mode === 'cpu' && startPlayer === 'O') {
      // Computer opens
      const openingMoves = [0, 2, 4, 6, 8];
      const botMove = openingMoves[Math.floor(Math.random() * openingMoves.length)];
      emptyBoard[botMove] = 'O';
      setBoard(emptyBoard);
      setTurn('X');
    } else {
      setBoard(emptyBoard);
      setTurn(startPlayer);
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || gameOver) return;
    if (mode === 'cpu' && turn === 'O') return;

    sound.playPop();
    const nextBoard = [...board];
    nextBoard[index] = turn;
    setBoard(nextBoard);

    const { winner, line } = checkWinner(nextBoard);
    if (winner) {
      handleGameOver(winner, line, nextBoard);
      return;
    }

    if (mode === 'two') {
      setTurn(turn === 'X' ? 'O' : 'X');
    } else {
      // CPU turn
      setTurn('O');
      setTimeout(() => {
        const cpuMove = getBestCpuMove(nextBoard);
        if (cpuMove !== undefined && cpuMove >= 0) {
          sound.playPop();
          nextBoard[cpuMove] = 'O';
          setBoard([...nextBoard]);

          const afterCpu = checkWinner(nextBoard);
          if (afterCpu.winner) {
            handleGameOver(afterCpu.winner, afterCpu.line, nextBoard);
          } else {
            setTurn('X');
          }
        }
      }, 400);
    }
  };

  const handleGameOver = (winner: Player | 'D', line?: number[], finalBoard?: Player[]) => {
    setGameOver(true);
    if (line) setWinningLine(line);

    if (winner === 'D') {
      sound.playError();
      setStatusText("It's a draw!");
      setTally((prev) => ({ ...prev, D: prev.D + 1 }));
      if (mode === 'cpu') recordGameResult('ttt', 1, 'Draw vs Computer');
    } else if (winner === 'X' || winner === 'O') {
      setTally((prev) => ({ ...prev, [winner]: prev[winner] + 1 }));
      if (winner === 'X') {
        sound.playSuccess();
        confetti({ particleCount: 70, spread: 60 });
        setStatusText(mode === 'cpu' ? 'You win!' : 'Player X wins!');
        if (mode === 'cpu') recordGameResult('ttt', 3, 'Win vs Computer (+3 pts)');
      } else {
        sound.playError();
        setStatusText(mode === 'cpu' ? 'Computer wins.' : 'Player O wins!');
        if (mode === 'cpu') recordGameResult('ttt', 0, 'Loss vs Computer');
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Mode switcher */}
      <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl mb-4 w-full max-w-xs">
        <button
          onClick={() => setMode('cpu')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            mode === 'cpu'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          vs Computer
        </button>
        <button
          onClick={() => setMode('two')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            mode === 'two'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          2 Players Pass & Play
        </button>
      </div>

      {/* Meta indicators */}
      <div className="flex items-center justify-between w-full max-w-xs text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">
        <span className="text-blue-600 dark:text-blue-400 font-extrabold">
          {gameOver
            ? 'Round finished'
            : mode === 'cpu'
            ? turn === 'X'
              ? 'Your turn (X)'
              : 'Computer thinking...'
            : `Player ${turn}'s turn`}
        </span>
        <span className="font-mono-nums">
          {mode === 'cpu'
            ? `You ${tally.X} · D ${tally.D} · Bot ${tally.O}`
            : `X ${tally.X} · D ${tally.D} · O ${tally.O}`}
        </span>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs aspect-square">
        {board.map((cell, index) => {
          const isWinningCell = winningLine?.includes(index);
          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={Boolean(cell) || gameOver || (mode === 'cpu' && turn === 'O')}
              className={`aspect-square rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black font-display border-2 transition-all cursor-pointer ${
                cell
                  ? cell === 'X'
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-600'
                    : 'text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 border-slate-400'
                  : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-800 hover:border-blue-600'
              } ${isWinningCell ? 'ring-4 ring-blue-500 scale-[1.03] !bg-blue-100 dark:!bg-blue-900/60' : ''}`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      {/* Status banner and Reset */}
      <div className="min-h-[4rem] flex flex-col items-center justify-center mt-5 text-center">
        {gameOver ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-black text-slate-900 dark:text-white">
              {statusText}
            </p>
            <button
              onClick={resetRound}
              className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              Next Round
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#6b678a] dark:text-[#9994c4]">
            {mode === 'cpu' ? 'Win earns +3 points on the leaderboard!' : 'Pass the device between moves.'}
          </p>
        )}
      </div>
    </div>
  );
};
