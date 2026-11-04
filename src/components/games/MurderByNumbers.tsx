import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

const N = 6;

const CASES = [
  { evidence: 'a muddy boot print with clay from the riverbank', culprit: 'Mr. Black', motive: 'stolen manor land deeds' },
  { evidence: 'a torn silk glove bearing Victorian perfume', culprit: 'Lady Rose', motive: 'a contested royal inheritance' },
  { evidence: 'a broken pocket watch stopped at 11:42 PM', culprit: 'Dr. Green', motive: 'secret gambling debts' },
  { evidence: 'a candle stub with clear wax thumbprints', culprit: 'Miss Scarlet', motive: 'blackmail correspondences' },
  { evidence: 'a half-burnt cipher letter stamped by the Admiralty', culprit: 'Colonel Mustard', motive: 'international military espionage' },
  { evidence: 'an antique fountain pen leaking Prussian blue ink', culprit: 'Professor Plum', motive: 'forged museum antiquities' },
  { evidence: 'a silver pocket flask smelling of almond cyanide', culprit: 'Lord Sterling', motive: 'hostile takeover of the shipping docks' },
  { evidence: 'a theater ticket stub from the night of the crime', culprit: 'Madame Vivienne', motive: 'stolen diamond necklace' },
  { evidence: 'a brass skeleton key to the wine cellar vault', culprit: 'Barnaby the Butler', motive: 'forged checks drawn on the estate' },
  { evidence: 'a monogrammed handkerchief stained with tea', culprit: 'Duchess Eleanor', motive: 'suppressed scandalous memoirs' },
  { evidence: 'a stained magnifying glass dropped near the safe', culprit: 'Inspector Finch', motive: 'corrupt payoff hush money' },
  { evidence: 'a velvet pouch containing uncut sapphires', culprit: 'Captain Vance', motive: 'smuggled maritime contraband' },
];

function computeRunClues(line: number[]): number[] {
  const clues: number[] = [];
  let currentRun = 0;
  for (const v of line) {
    if (v === 1) {
      currentRun++;
    } else if (currentRun > 0) {
      clues.push(currentRun);
      currentRun = 0;
    }
  }
  if (currentRun > 0) clues.push(currentRun);
  return clues.length ? clues : [0];
}

let globalCaseCounter = 0;

interface MurderByNumbersProps {
  onRestart: () => void;
  gameKey: number;
}

export const MurderByNumbers: React.FC<MurderByNumbersProps> = ({ onRestart, gameKey }) => {
  const [caseIndex, setCaseIndex] = useState(() => {
    return globalCaseCounter % CASES.length;
  });

  const [solution, setSolution] = useState<number[]>([]);
  const [state, setState] = useState<number[]>([]); // 0: empty, 1: filled, 2: marked X
  const [mode, setMode] = useState<'fill' | 'mark'>('fill');
  const [rowClues, setRowClues] = useState<number[][]>([]);
  const [colClues, setColClues] = useState<number[][]>([]);
  const [solvedCase, setSolvedCase] = useState<(typeof CASES)[0] | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    globalCaseCounter = (globalCaseCounter + 1) % CASES.length;
    setCaseIndex(globalCaseCounter);
    initPuzzle();
  }, [gameKey]);

  const initPuzzle = () => {
    // Generate fresh distinct 6x6 solution
    let sol = Array.from({ length: N * N }, () => (Math.random() < 0.52 ? 1 : 0));
    // Ensure not all blank or all full
    if (!sol.includes(1)) sol[0] = sol[5] = sol[12] = 1;

    setSolution(sol);
    setState(Array(N * N).fill(0));
    setSolvedCase(null);
    setIsCompleted(false);

    // Compute row clues
    const rClues = Array.from({ length: N }, (_, r) => {
      const rowSlice = sol.slice(r * N, r * N + N);
      return computeRunClues(rowSlice);
    });

    // Compute col clues
    const cClues = Array.from({ length: N }, (_, c) => {
      const colSlice = Array.from({ length: N }, (_, r) => sol[r * N + c]);
      return computeRunClues(colSlice);
    });

    setRowClues(rClues);
    setColClues(cClues);
  };

  const handleNextCase = () => {
    globalCaseCounter = (globalCaseCounter + 1) % CASES.length;
    setCaseIndex(globalCaseCounter);
    initPuzzle();
  };

  const checkSolution = (currState: number[]) => {
    const filledOnly = currState.map((v) => (v === 1 ? 1 : 0));

    // Check rows
    const rowsOk = rowClues.every((clue, r) => {
      const rowSlice = filledOnly.slice(r * N, r * N + N);
      return computeRunClues(rowSlice).join(',') === clue.join(',');
    });

    // Check cols
    const colsOk = colClues.every((clue, c) => {
      const colSlice = Array.from({ length: N }, (_, r) => filledOnly[r * N + c]);
      return computeRunClues(colSlice).join(',') === clue.join(',');
    });

    if (rowsOk && colsOk && !isCompleted) {
      setIsCompleted(true);
      const chosenCase = CASES[caseIndex % CASES.length];
      setSolvedCase(chosenCase);
      sound.playSuccess();
      confetti({ particleCount: 85, spread: 70 });
      recordGameResult('mbn', Math.floor(Date.now() / 1000) % 3600, `Solved case: ${chosenCase.culprit}`);
    }
  };

  const handleCellClick = (idx: number) => {
    if (isCompleted) return;

    sound.playPop();
    const targetVal = mode === 'fill' ? 1 : 2;
    const nextState = [...state];
    nextState[idx] = nextState[idx] === targetVal ? 0 : targetVal;
    setState(nextState);

    checkSolution(nextState);
  };

  const activeMystery = CASES[caseIndex % CASES.length];

  return (
    <div className="flex flex-col items-center">
      {/* Case Header & Mode toggle */}
      <div className="flex items-center justify-between w-full max-w-sm gap-2 mb-3">
        <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          <button
            onClick={() => setMode('fill')}
            className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              mode === 'fill'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            ■ Fill
          </button>
          <button
            onClick={() => setMode('mark')}
            className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              mode === 'mark'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            ✕ Mark X
          </button>
        </div>

        <button
          onClick={handleNextCase}
          className="py-1.5 px-3.5 text-xs font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-blue-600 dark:text-blue-400 hover:border-blue-600 transition-colors cursor-pointer shadow-xs"
        >
          Next Mystery ▶
        </button>
      </div>

      {/* Nonogram Grid Container */}
      <div className="bg-white dark:bg-[#131b2e] p-4 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-md select-none w-full max-w-[400px]">
        {/* Top Column Clues */}
        <div className="grid grid-cols-[auto_repeat(6,1fr)] gap-1 mb-1">
          <div className="w-12 h-14" />
          {colClues.map((clue, c) => (
            <div
              key={c}
              className="h-14 flex flex-col justify-end items-center text-xs font-black font-mono-nums text-slate-600 dark:text-slate-300 pb-1 leading-tight"
            >
              {clue.map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </div>
          ))}
        </div>

        {/* Rows with Clues + Cells */}
        {Array.from({ length: N }, (_, r) => (
          <div key={r} className="grid grid-cols-[auto_repeat(6,1fr)] gap-1 mb-1 items-center">
            {/* Left Row Clue */}
            <div className="w-12 pr-2 flex justify-end items-center gap-1 text-xs font-black font-mono-nums text-slate-600 dark:text-slate-300">
              {rowClues[r]?.map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </div>

            {/* Cells in Row */}
            {Array.from({ length: N }, (_, c) => {
              const idx = r * N + c;
              const val = state[idx];
              return (
                <button
                  key={c}
                  onClick={() => handleCellClick(idx)}
                  disabled={isCompleted}
                  className={`aspect-square rounded-xl flex items-center justify-center font-black text-base transition-all border-2 cursor-pointer ${
                    val === 1
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : val === 2
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-rose-500 font-extrabold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-600'
                  }`}
                >
                  {val === 2 ? '✕' : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Detective Narrative Report */}
      <div className="mt-4 text-center max-w-sm min-h-[4rem]">
        {isCompleted && solvedCase ? (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-100 animate-fade-in text-left shadow-xs">
            <h4 className="font-black text-sm text-blue-600 dark:text-blue-400 mb-1 flex items-center justify-between">
              <span>🔍 Case #{caseIndex + 1} Solved!</span>
              <button
                onClick={handleNextCase}
                className="text-xs font-bold underline cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800"
              >
                Next Case ▶
              </button>
            </h4>
            <p className="text-xs mb-1 font-medium">
              Evidence recovered: <strong className="underline font-bold">{solvedCase.evidence}</strong>.
            </p>
            <p className="text-xs font-medium">
              The culprit was <strong className="font-bold">{solvedCase.culprit}</strong>, motivated by {solvedCase.motive}!
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Every game creates a brand new nonogram mystery and crime scene!
          </p>
        )}
      </div>
    </div>
  );
};
