import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

const WORDS_DATABASE = [
  { word: 'PLANET', clue: 'Celestial body revolving around a star like our Sun', category: 'Astronomy' },
  { word: 'JUNGLE', clue: 'Dense tropical forest teeming with wildlife and thick vines', category: 'Nature' },
  { word: 'ROCKET', clue: 'High-thrust vehicle that propels astronauts past gravity into orbit', category: 'Science' },
  { word: 'PIZZA', clue: 'Round Italian baked flatbread with savory sauce and melted cheese', category: 'Food' },
  { word: 'GUITAR', clue: 'Popular musical instrument played by plucking or strumming six strings', category: 'Music' },
  { word: 'GARDEN', clue: 'Cultivated plot of land dedicated to colorful flowers and herbs', category: 'Nature' },
  { word: 'BRIDGE', clue: 'Sturdy structural crossing built spanning over rivers or valleys', category: 'Architecture' },
  { word: 'CASTLE', clue: 'Fortified stone residence built for medieval royalty and defense', category: 'History' },
  { word: 'DRAGON', clue: 'Mythical fire-breathing reptilian monster with scaled wings', category: 'Fantasy' },
  { word: 'PUZZLE', clue: 'Challenging mental conundrum solved by assembling fitting pieces', category: 'Games' },
  { word: 'ISLAND', clue: 'Sub-continental landmass entirely encircled by open water', category: 'Geography' },
  { word: 'CAMERA', clue: 'Optical device used to focus light and capture digital photographs', category: 'Technology' },
  { word: 'DOLPHIN', clue: 'Acrobatic marine mammal famed for echolocation and high intellect', category: 'Animals' },
  { word: 'VOLCANO', clue: 'Rupture in planetary crust expelling hot magma, gases, and ash', category: 'Earth Science' },
  { word: 'COMPASS', clue: 'Navigational tool with a magnetized needle aligning to magnetic North', category: 'Exploration' },
  { word: 'TELESCOPE', clue: 'Optical curved lens device used to gaze at distant nebulae and stars', category: 'Science' },
  { word: 'PYRAMID', clue: 'Monumental ancient triangular tombs built along the Nile in Egypt', category: 'History' },
  { word: 'CHEETAH', clue: 'Fastest land mammal on Earth, accelerating up to 70 miles per hour', category: 'Animals' },
  { word: 'ORIGAMI', clue: 'Traditional Japanese cultural craft of folding paper into artistic shapes', category: 'Art' },
  { word: 'SUBMARINE', clue: 'Watercraft capable of independent underwater submersion and transit', category: 'Engineering' },
  { word: 'DIAMOND', clue: 'Precious gemstone composed of pure carbon under extreme pressure', category: 'Minerals' },
  { word: 'GLACIER', clue: 'Massive persistent body of slow-moving compressed ice and snow', category: 'Geography' },
  { word: 'PENGUIN', clue: 'Flightless aquatic bird sporting a tuxedo coat in Antarctic climates', category: 'Animals' },
  { word: 'KANGAROO', clue: 'Marsupial from Australia famous for powerful bounding hops and pouches', category: 'Animals' },
  { word: 'CROISSANT', clue: 'Flaky, buttery crescent-shaped pastry staple from French bakeries', category: 'Food' },
  { word: 'MICROSCOPE', clue: 'Laboratory optical instrument that magnifies microscopic bacteria', category: 'Science' },
  { word: 'SUNFLOWER', clue: 'Tall yellow blossom that dynamically tilts toward solar rays', category: 'Nature' },
  { word: 'METEOR', clue: 'Streak of brilliant light caused by space rock entering the atmosphere', category: 'Astronomy' },
  { word: 'TREASURE', clue: 'Hidden bounty of gold coins and jewels buried by pirates', category: 'Adventure' },
  { word: 'SPHINX', clue: 'Mythical limestone statue with a lion body and human pharaoh head', category: 'History' },
  { word: 'CHAMELEON', clue: 'Reptile famous for independently moving eyes and changing skin color', category: 'Animals' },
  { word: 'LIGHTHOUSE', clue: 'Tower with a bright navigational lamp guiding ships away from rocks', category: 'Maritime' },
  { word: 'RAINFOREST', clue: 'Dense equatorial woodland with high annual rainfall and biodiversity', category: 'Nature' },
  { word: 'ARCHITECT', clue: 'Master planner who designs buildings and spatial blueprints', category: 'Careers' },
  { word: 'AQUARIUM', clue: 'Water-filled transparent tank housing aquatic animals and coral', category: 'Marine' },
  { word: 'CHOCOLATE', clue: 'Sweet confection produced from roasted and ground cacao seeds', category: 'Food' },
  { word: 'SAXOPHONE', clue: 'Brass woodwind instrument that became the iconic voice of jazz', category: 'Music' },
  { word: 'GALAXY', clue: 'Vast gravitationally bound system of stars, gas, and dark matter', category: 'Space' },
  { word: 'PIRATE', clue: 'High-seas outlaw sailing under the skull-and-crossbones flag', category: 'History' },
  { word: 'OCTOPUS', clue: 'Eight-armed soft-bodied sea mollusk with three hearts and blue blood', category: 'Animals' },
  { word: 'OLYMPICS', clue: 'Global quadrennial multi-sport festival celebrating international athletes', category: 'Sports' },
  { word: 'SYMPHONY', clue: 'Elaborate musical composition played by a full classical orchestra', category: 'Music' },
  { word: 'BLIZZARD', clue: 'Severe snowstorm characterized by sustained freezing high-velocity winds', category: 'Weather' },
  { word: 'DINOSAUR', clue: 'Prehistoric reptiles that roamed during the Mesozoic era', category: 'Paleontology' },
  { word: 'HARMONICA', clue: 'Small handheld wind reed instrument played by exhaling and inhaling', category: 'Music' },
  { word: 'AMAZON', clue: 'World’s largest river basin harboring millions of unique species', category: 'Geography' },
  { word: 'MOSAIC', clue: 'Art composed of small assembled fragments of colored glass or stone', category: 'Art' },
  { word: 'HELICOPTER', clue: 'Rotary-wing aircraft capable of vertical takeoff and hovering', category: 'Aviation' },
  { word: 'COYOTE', clue: 'Clever North American canine known for nocturnal howling', category: 'Animals' },
  { word: 'FESTIVAL', clue: 'Public celebratory feast or jubilee gathering with music and food', category: 'Culture' },
];

let globalWordCounter = Math.floor(Math.random() * WORDS_DATABASE.length);

interface HangmanGameProps {
  onRestart: () => void;
  gameKey: number;
}

export const HangmanGame: React.FC<HangmanGameProps> = ({ onRestart, gameKey }) => {
  const [wordIdx, setWordIdx] = useState(() => {
    globalWordCounter = (globalWordCounter + 1) % WORDS_DATABASE.length;
    return globalWordCounter;
  });

  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [lives, setLives] = useState<number>(6);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Pick a fresh new question each gameKey or restart
  useEffect(() => {
    globalWordCounter = (globalWordCounter + 1) % WORDS_DATABASE.length;
    setWordIdx(globalWordCounter);
    setGuessedLetters([]);
    setLives(6);
    setIsFinished(false);
    setHintsUsed(0);
    setHintMessage(null);
  }, [gameKey]);

  const handleNextQuestion = () => {
    globalWordCounter = (globalWordCounter + 1) % WORDS_DATABASE.length;
    setWordIdx(globalWordCounter);
    setGuessedLetters([]);
    setLives(6);
    setIsFinished(false);
    setHintsUsed(0);
    setHintMessage(null);
  };

  const currentWordItem = WORDS_DATABASE[wordIdx % WORDS_DATABASE.length];
  const targetWord = currentWordItem.word;
  const lettersNeeded = Array.from(new Set(targetWord.split('')));
  const isWon = lettersNeeded.every((char) => guessedLetters.includes(char));
  const isLost = lives <= 0;

  const handleGuess = (letter: string) => {
    if (isFinished || guessedLetters.includes(letter) || isWon || isLost) return;

    const nextGuessed = [...guessedLetters, letter];
    setGuessedLetters(nextGuessed);

    if (targetWord.includes(letter)) {
      sound.playMatch();
      // Check win
      if (lettersNeeded.every((char) => nextGuessed.includes(char))) {
        setIsFinished(true);
        sound.playSuccess();
        confetti({ particleCount: 80, spread: 70 });
        recordGameResult('hangman', 1, `Won: ${targetWord} (${currentWordItem.category})`);
      }
    } else {
      sound.playError();
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        setIsFinished(true);
        recordGameResult('hangman', 0, `Lost on: ${targetWord}`);
      }
    }
  };

  const provideHint = () => {
    if (isFinished || isWon || isLost) return;

    // Find all unrevealed letters in target word
    const unrevealedLetters = lettersNeeded.filter((c) => !guessedLetters.includes(c));
    if (unrevealedLetters.length === 0) return;

    // Pick one unrevealed letter
    const hintLetter = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];

    setHintsUsed((prev) => prev + 1);
    setHintMessage(`💡 Hint: Revealed letter "${hintLetter}"!`);

    // Reveal the letter as a correct guess
    handleGuess(hintLetter);
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        handleGuess(char);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="flex flex-col items-center">
      {/* Lives, Hint & length strip */}
      <div className="flex items-center justify-between w-full max-w-md text-xs font-semibold text-[#6b678a] dark:text-[#9994c4] mb-3 px-1 gap-2">
        <div className="flex items-center gap-1 text-base">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="transition-transform duration-200">
              {i < lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>

        <button
          onClick={provideHint}
          disabled={isFinished || isWon || isLost}
          className="py-1 px-3 text-xs font-bold rounded-xl border-2 border-blue-600 bg-white dark:bg-[#131b2e] text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white disabled:opacity-40 transition-colors cursor-pointer shadow-xs flex items-center gap-1 active:scale-95"
          title="Reveal an unrevealed letter without penalty"
        >
          <span>💡</span>
          <span>Hint</span>
        </button>

        <span className="text-right">
          Word #{wordIdx + 1} · {targetWord.length} letters
        </span>
      </div>

      {/* Clue callout */}
      <div className="w-full max-w-md bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-4 mb-2 shadow-xs text-center">
        <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
          Question Clue ({currentWordItem.category})
        </span>
        <p className="text-base font-bold text-slate-900 dark:text-white">
          "{currentWordItem.clue}"
        </p>
      </div>

      {/* Hint Banner */}
      {hintMessage && !isFinished && (
        <div className="w-full max-w-md mb-3 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold text-center">
          {hintMessage}
        </div>
      )}

      {/* Secret Word Display */}
      <div className="flex flex-wrap items-center justify-center gap-2 my-4 px-2">
        {targetWord.split('').map((char, idx) => {
          const revealed = guessedLetters.includes(char) || isLost;
          return (
            <div
              key={idx}
              className={`w-10 sm:w-12 h-14 rounded-2xl flex items-center justify-center font-display text-2xl sm:text-3xl font-black border-2 transition-all ${
                revealed
                  ? isLost && !guessedLetters.includes(char)
                    ? 'border-rose-400 bg-rose-50 text-rose-500'
                    : 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-transparent'
              }`}
            >
              {revealed ? char : ''}
            </div>
          );
        })}
      </div>

      {/* Virtual Keyboard (A-Z) */}
      <div className="flex flex-wrap gap-1.5 justify-center max-w-md mt-4">
        {alphabet.map((letter) => {
          const isUsed = guessedLetters.includes(letter);
          const isCorrect = isUsed && targetWord.includes(letter);
          const isWrong = isUsed && !targetWord.includes(letter);

          return (
            <button
              key={letter}
              onClick={() => handleGuess(letter)}
              disabled={isUsed || isFinished}
              className={`w-9 sm:w-10 h-10 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                isCorrect
                  ? '!bg-blue-600 !border-blue-600 !text-white'
                  : isWrong
                  ? '!bg-slate-100 dark:!bg-slate-800 !border-slate-300 dark:!border-slate-700 !text-slate-400 opacity-40'
                  : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-blue-600 hover:scale-105 active:scale-95 shadow-xs'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Outcome message */}
      <div className="mt-5 text-center min-h-[3.5rem] flex flex-col items-center justify-center">
        {isWon ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-black text-blue-600 dark:text-blue-400">
              🎉 Superb! You deduced "{targetWord}"!
            </p>
            <button
              onClick={handleNextQuestion}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              Next Word Question ▶
            </button>
          </div>
        ) : isLost ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-rose-500">
              Out of lives! The word was {targetWord}.
            </p>
            <button
              onClick={handleNextQuestion}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              Try Next Word ▶
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Every game presents a completely new word question!
          </p>
        )}
      </div>
    </div>
  );
};
