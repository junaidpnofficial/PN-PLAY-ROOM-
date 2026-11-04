import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

const EMOJI_THEMES = [
  { name: 'Delicious Foods', emojis: ['🍎', '🍕', '🍓', '🥑', '🍔', '🍩', '🍇', '🍦'] },
  { name: 'Cute Animals', emojis: ['🐶', '🐱', '🦊', '🐼', '🦁', '🐨', '🐯', '🐰'] },
  { name: 'Space & Cosmos', emojis: ['🚀', '🪐', '🛸', '👾', '🌌', '🛰️', '⭐', '🌙'] },
  { name: 'Sports & Games', emojis: ['⚽', '🏀', '🎾', '🎲', '🎸', '🎨', '🏆', '🎯'] },
  { name: 'Magic & Fantasy', emojis: ['🧙', '🐉', '🦄', '🔮', '👑', '⚔️', '🏰', '💎'] },
  { name: 'Deep Sea Life', emojis: ['🐙', '🐬', '🦈', '🐠', '🦀', '🐢', '🐳', '🐚'] },
  { name: 'Wild Nature', emojis: ['🌵', '🌺', '🌲', '🍄', '🌻', '🍀', '🌴', '🍁'] },
  { name: 'Speed & Travel', emojis: ['🏎️', '✈️', '🚢', '🚁', '🚂', '🚲', '🚜', '🏍️'] },
];

function generateDeck(themeIndex: number) {
  const theme = EMOJI_THEMES[themeIndex % EMOJI_THEMES.length];
  const paired = [...theme.emojis, ...theme.emojis];
  return paired.sort(() => Math.random() - 0.5);
}

interface MemoryMatchProps {
  onRestart: () => void;
  gameKey: number;
}

export const MemoryMatch: React.FC<MemoryMatchProps> = ({ onRestart, gameKey }) => {
  const [themeIdx, setThemeIdx] = useState(() => Math.floor(Math.random() * EMOJI_THEMES.length));
  const [deck, setDeck] = useState<string[]>(() => generateDeck(themeIdx));
  const [opened, setOpened] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // When gameKey or round changes, load a brand new fresh theme!
  useEffect(() => {
    const nextTheme = (themeIdx + 1) % EMOJI_THEMES.length;
    setThemeIdx(nextTheme);
    setDeck(generateDeck(nextTheme));
    setOpened([]);
    setMatched([]);
    setMoves(0);
    setIsBusy(false);
    setHasWon(false);
  }, [gameKey]);

  const handleNextRound = () => {
    const nextTheme = (themeIdx + 1) % EMOJI_THEMES.length;
    setThemeIdx(nextTheme);
    setDeck(generateDeck(nextTheme));
    setOpened([]);
    setMatched([]);
    setMoves(0);
    setIsBusy(false);
    setHasWon(false);
  };

  const handleCardClick = (index: number) => {
    if (isBusy || matched.includes(index) || opened.includes(index)) return;

    sound.playPop();
    const nextOpened = [...opened, index];
    setOpened(nextOpened);

    if (nextOpened.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      setIsBusy(true);

      const [first, second] = nextOpened;
      if (deck[first] === deck[second]) {
        // Matched!
        sound.playMatch();
        const nextMatched = [...matched, first, second];
        setMatched(nextMatched);
        setOpened([]);
        setIsBusy(false);

        if (nextMatched.length === deck.length) {
          // Won!
          setHasWon(true);
          sound.playSuccess();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          recordGameResult('memory', nextMoves, `Won in ${nextMoves} moves (${EMOJI_THEMES[themeIdx].name})`);
        }
      } else {
        // Not matched
        setTimeout(() => {
          setOpened([]);
          setIsBusy(false);
        }, 850);
      }
    }
  };

  const currentTheme = EMOJI_THEMES[themeIdx % EMOJI_THEMES.length];

  return (
    <div className="flex flex-col items-center">
      {/* Theme banner & HUD info */}
      <div className="flex items-center justify-between w-full max-w-sm text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">
        <span className="text-blue-600 dark:text-blue-400 font-extrabold">
          Theme: {currentTheme.name}
        </span>
        <span className="font-mono-nums">
          Moves: {moves} · Pairs: {matched.length / 2} / 8
        </span>
      </div>

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
        {deck.map((emoji, index) => {
          const isFlipped = opened.includes(index) || matched.includes(index);
          const isDone = matched.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleCardClick(index)}
              disabled={isDone || isBusy}
              aria-label={`Card ${index + 1}`}
              className={`aspect-square rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-all duration-200 select-none shadow-sm cursor-pointer border-2 ${
                isFlipped
                  ? isDone
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-600'
                    : 'bg-white dark:bg-[#131b2e] border-blue-600'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white hover:scale-[1.03] active:scale-95'
              }`}
            >
              <span className={isFlipped ? 'opacity-100 scale-100 transition-all' : 'opacity-0 scale-50'}>
                {emoji}
              </span>
              {!isFlipped && (
                <span className="text-white text-lg font-black select-none opacity-80">★</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Message and Play Again */}
      <div className="min-h-[4rem] flex flex-col items-center justify-center mt-5 text-center">
        {hasWon ? (
          <div className="animate-fade-in flex flex-col items-center gap-2.5">
            <p className="text-base font-black text-blue-600 dark:text-blue-400">
              🎉 Brilliant! You matched all pairs in {moves} moves!
            </p>
            <button
              onClick={handleNextRound}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              Next Theme Round ▶
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Every round features a completely new theme of cards!
          </p>
        )}
      </div>
    </div>
  );
};
