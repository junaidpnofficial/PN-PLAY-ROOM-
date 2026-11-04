import { GameId, GameResult, LeaderboardEntry, UserProfile } from '../types';
import { GAME_MAP, GAMES } from '../data/gamesMeta';
import { saveGameResultToFirestore } from '../services/firebaseService';

export const ADMIN_NAME = 'JUNAID P.N';
export const ADMIN_PASSWORD = '8105013356';

const STORAGE_KEYS = {
  PROFILE: 'playroom_profile',
  RESULTS: 'playroom_results',
  THEME: 'playroom_theme',
  ADMIN_AUTH: 'playroom_admin_auth',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'JUNAID P.N',
  players: ['JUNAID P.N', 'Alex', 'Sam', 'Jordan'],
};

// Seed initial records for realism if storage is brand new
const INITIAL_RESULTS: GameResult[] = [
  { id: '1', n: 'JUNAID P.N', g: 'Shikaku', gameId: 'shikaku', v: 38, t: Date.now() - 1000 * 60 * 15, detail: 'Solved 6x6 Rainbow Mosaic' },
  { id: '2', n: 'JUNAID P.N', g: 'Sudoku', gameId: 'sudoku', v: 142, t: Date.now() - 1000 * 60 * 45, detail: 'Completed hard grid' },
  { id: '3', n: 'Alex', g: '2048', gameId: '2048', v: 3120, t: Date.now() - 1000 * 60 * 120 },
  { id: '4', n: 'Sam', g: 'Memory match', gameId: 'memory', v: 14, t: Date.now() - 1000 * 60 * 200 },
  { id: '5', n: 'Jordan', g: 'Whack-a-mole', gameId: 'whack', v: 24, t: Date.now() - 1000 * 60 * 30 },
  { id: '6', n: 'Sam', g: 'Murder by Numbers', gameId: 'mbn', v: 95, t: Date.now() - 1000 * 60 * 300 },
  { id: '7', n: 'Alex', g: 'SOS', gameId: 'sos', v: 8, t: Date.now() - 1000 * 60 * 70 },
];

export function isAdminAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(auth: boolean): void {
  try {
    if (auth) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  } catch {}
}

export function verifyAdminPassword(pass: string): boolean {
  return pass.trim() === ADMIN_PASSWORD;
}

export function getProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === 'string') {
        return parsed;
      }
    }
  } catch {}
  saveProfile(DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {}
}

export function getResults(): GameResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  saveResults(INITIAL_RESULTS);
  return INITIAL_RESULTS;
}

export function saveResults(results: GameResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results.slice(0, 500)));
  } catch {}
}

export function recordGameResult(gameId: GameId, value: number, detail?: string): GameResult {
  const profile = getProfile();
  const meta = GAME_MAP[gameId];
  const newEntry: GameResult = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    n: profile.name || 'Guest',
    g: meta ? meta.name : gameId,
    gameId,
    v: value,
    t: Date.now(),
    detail,
  };

  const existing = getResults();
  const updated = [newEntry, ...existing];
  saveResults(updated);

  // Sync to Firestore in background
  saveGameResultToFirestore(newEntry).catch((err) => {
    console.debug('Firestore save notice:', err);
  });

  return newEntry;
}

export function mergeRemoteResults(remote: GameResult[]): GameResult[] {
  if (!Array.isArray(remote) || remote.length === 0) return getResults();
  const current = getResults();
  const map = new Map<string, GameResult>();

  // Add existing
  for (const r of current) {
    if (r && r.id) map.set(r.id, r);
  }
  // Overlay remote
  for (const r of remote) {
    if (r && r.id) map.set(r.id, r);
  }

  const merged = Array.from(map.values()).sort((a, b) => b.t - a.t);
  saveResults(merged);
  return merged;
}

export function getLeaderboardForGame(gameId: GameId): LeaderboardEntry[] {
  const results = getResults();
  const meta = GAME_MAP[gameId];
  if (!meta) return [];

  const playerStats: Record<string, { value: number; count: number; lastPlayed: number }> = {};

  for (const r of results) {
    if (r.gameId !== gameId) continue;
    const name = r.n;
    if (!playerStats[name]) {
      playerStats[name] = { value: r.v, count: 1, lastPlayed: r.t };
    } else {
      playerStats[name].count += 1;
      playerStats[name].lastPlayed = Math.max(playerStats[name].lastPlayed, r.t);
      if (meta.metric === 'low') {
        playerStats[name].value = Math.min(playerStats[name].value, r.v);
      } else if (meta.metric === 'high') {
        playerStats[name].value = Math.max(playerStats[name].value, r.v);
      } else {
        playerStats[name].value += r.v;
      }
    }
  }

  const entries: LeaderboardEntry[] = Object.entries(playerStats).map(([name, stat]) => ({
    name,
    value: stat.value,
    gamesPlayed: stat.count,
    lastPlayed: stat.lastPlayed,
  }));

  if (meta.metric === 'low') {
    entries.sort((a, b) => a.value - b.value);
  } else {
    entries.sort((a, b) => b.value - a.value);
  }

  return entries;
}

export function clearAllResults(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RESULTS);
  } catch {}
}

export function exportDataAsJSON(): string {
  const profile = getProfile();
  const results = getResults();
  return JSON.stringify({ profile, results, exportDate: new Date().toISOString() }, null, 2);
}

export function importDataFromJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.profile && typeof parsed.profile.name === 'string') {
      saveProfile(parsed.profile);
    }
    if (Array.isArray(parsed.results)) {
      saveResults(parsed.results);
    }
    return true;
  } catch {
    return false;
  }
}
