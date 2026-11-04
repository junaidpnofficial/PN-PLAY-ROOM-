import { GameId, GameMeta } from '../types';

export const GAMES: GameMeta[] = [
  {
    id: 'memory',
    name: 'Memory match',
    icon: '🃏',
    tagline: 'Find all the pairs',
    description: 'Flip cards and match all 8 pairs in the fewest moves possible.',
    metric: 'low',
    unit: 'moves',
    isTimeBased: false,
    color: '#2563eb',
    badge: 'Card Puzzle',
  },
  {
    id: 'ttt',
    name: 'Tic-tac-toe',
    icon: '⭕',
    tagline: 'Computer or a friend',
    description: 'Classic 3x3 grid battle with an intelligent Minimax computer or local 2-player pass & play.',
    metric: 'sum',
    unit: 'pts',
    isTimeBased: false,
    color: '#2563eb',
    badge: 'Classic Grid',
  },
  {
    id: 'sos',
    name: 'SOS',
    icon: '🆘',
    tagline: 'Make S-O-S lines',
    description: 'Place S or O to form horizontal, vertical, or diagonal SOS sequences on 5x5, 8x8, or 10x10 boards.',
    metric: 'high',
    unit: 'pts',
    isTimeBased: false,
    color: '#2563eb',
    badge: 'Strategy',
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    icon: '🔢',
    tagline: 'Fill the 9x9 grid',
    description: 'Fill the 9x9 grid with numbers 1 to 9 with no duplicates in rows, columns, or 3x3 blocks.',
    metric: 'low',
    unit: 'sec',
    isTimeBased: true,
    color: '#2563eb',
    badge: 'Number Logic',
  },
  {
    id: 'shikaku',
    name: 'Shikaku',
    icon: '🟩',
    tagline: 'Divide into colorful rectangles',
    description: 'Divide the grid into rectangular blocks. Each rectangle must cover the exact area of the number inside it!',
    metric: 'low',
    unit: 'sec',
    isTimeBased: true,
    color: '#2563eb',
    badge: 'Spatial Logic',
  },
  {
    id: 'mbn',
    name: 'Murder by Numbers',
    icon: '🕵️',
    tagline: 'Solve the grid, catch the culprit',
    description: 'Picross nonogram detective puzzle! Deduce filled tiles from row/column number runs to reveal crime scene clues and convict the culprit.',
    metric: 'low',
    unit: 'sec',
    isTimeBased: true,
    color: '#2563eb',
    badge: 'Detective Nonogram',
  },
  {
    id: '2048',
    name: '2048',
    icon: '🧮',
    tagline: 'Slide and merge tiles',
    description: 'Slide numbers horizontally and vertically to combine identical values and reach 2048 and beyond!',
    metric: 'high',
    unit: 'pts',
    isTimeBased: false,
    color: '#2563eb',
    badge: 'Math Arcade',
  },
  {
    id: 'hangman',
    name: 'Hangman',
    icon: '🔤',
    tagline: 'Guess the word with a clue',
    description: 'Guess the mystery word letter by letter with 6 chances and helpful contextual hints.',
    metric: 'sum',
    unit: 'wins',
    isTimeBased: false,
    color: '#2563eb',
    badge: 'Word Guess',
  },
  {
    id: 'whack',
    name: 'Whack-a-mole',
    icon: '🐹',
    tagline: '20 seconds, go',
    description: 'Lightning reflex arcade game! Whack as many cheeky moles as you can before the 20-second timer runs out.',
    metric: 'high',
    unit: 'hits',
    isTimeBased: false,
    color: '#2563eb',
    badge: 'Speed Reflex',
  },
];

export const GAME_MAP: Record<GameId, GameMeta> = GAMES.reduce((acc, g) => {
  acc[g.id] = g;
  return acc;
}, {} as Record<GameId, GameMeta>);

export function formatScore(gameId: GameId, value: number): string {
  const meta = GAME_MAP[gameId];
  if (!meta) return String(value);
  if (meta.isTimeBased) {
    const min = Math.floor(value / 60);
    const s = value % 60;
    return `${min}:${String(s).padStart(2, '0')}`;
  }
  return `${value} ${meta.unit}`;
}
