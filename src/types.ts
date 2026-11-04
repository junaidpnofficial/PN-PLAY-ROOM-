export type GameId =
  | 'memory'
  | 'ttt'
  | 'sos'
  | 'sudoku'
  | 'shikaku'
  | 'mbn'
  | '2048'
  | 'hangman'
  | 'whack';

export interface GameMeta {
  id: GameId;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  metric: 'low' | 'high' | 'sum';
  unit: string;
  isTimeBased?: boolean;
  color: string;
  badge: string;
}

export interface GameResult {
  id: string;
  n: string; // player name
  g: string; // game name
  gameId: GameId;
  v: number; // score or seconds
  t: number; // timestamp
  detail?: string;
}

export interface UserProfile {
  name: string;
  players: string[];
}

export interface LeaderboardEntry {
  name: string;
  value: number;
  gamesPlayed: number;
  lastPlayed: number;
}

export type PublishedItemType = 'score' | 'challenge' | 'card';
export type ModerationStatus = 'active' | 'flagged' | 'hidden';

export interface PublishedItem {
  id: string;
  authorName: string;
  type: PublishedItemType;
  gameId: GameId;
  title: string;
  detail?: string;
  scoreValue: number;
  challengeSeed?: string;
  status: ModerationStatus;
  flagCount: number;
  flagReasons?: string[];
  createdAt: number;
}
