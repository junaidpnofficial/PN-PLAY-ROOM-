import React from 'react';
import { GameId, PublishedItem } from '../../types';
import { GAMES } from '../../data/gamesMeta';
import { isAdminAuthenticated } from '../../utils/storage';
import {
  Trophy,
  ListOrdered,
  Lock,
  Unlock,
  Dices,
  UserCheck,
  Settings as SettingsIcon,
  LogOut,
  Home,
  Globe,
} from 'lucide-react';
import { CommunityBoard } from './CommunityBoard';

interface ArcadeHomeProps {
  playerName: string;
  onOpenPlayerModal: () => void;
  onOpenSettingsModal: () => void;
  onUserLogout: () => void;
  onSelectGame: (gameId: GameId) => void;
  onNavigate: (view: 'home' | 'landing' | 'name-setup' | 'leaderboard' | 'results' | 'admin') => void;
  onOpenPublishModal: () => void;
  onSelectSharedItem: (item: PublishedItem) => void;
}

export const ArcadeHome: React.FC<ArcadeHomeProps> = ({
  playerName,
  onOpenPlayerModal,
  onOpenSettingsModal,
  onUserLogout,
  onSelectGame,
  onNavigate,
  onOpenPublishModal,
  onSelectSharedItem,
}) => {
  const isAuth = isAdminAuthenticated();

  const handleRandomGame = () => {
    const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
    onSelectGame(randomGame.id);
  };

  const scrollToCommunity = () => {
    const el = document.getElementById('community-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-8">
      {/* Hero Header - Crisp Blue & White */}
      <div className="text-center">
        <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight mb-2 text-blue-600 dark:text-blue-400 select-none">
          Play Room
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">
          <span>Playing as</span>
          <button
            onClick={onOpenPlayerModal}
            className="font-bold text-blue-600 dark:text-blue-400 underline decoration-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
          >
            {playerName || 'Guest'} 👤
          </button>
        </div>
      </div>

      {/* Arcade Navigation Buttons in 2-color styling */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
        >
          <Home className="w-4 h-4 text-blue-600" />
          <span>Cover / Landing</span>
        </button>

        <button
          onClick={onOpenPlayerModal}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
        >
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>Scoreboard Name</span>
        </button>

        <button
          onClick={() => onNavigate('leaderboard')}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
        >
          <Trophy className="w-4 h-4 text-blue-600" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => onNavigate('results')}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
        >
          <ListOrdered className="w-4 h-4 text-blue-600" />
          <span>My Results</span>
        </button>

        <button
          onClick={scrollToCommunity}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-xs font-bold text-blue-600 dark:text-blue-400 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
        >
          <Globe className="w-4 h-4 text-blue-600" />
          <span>Community Posts</span>
        </button>

        <button
          onClick={() => onNavigate('admin')}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border-2 ${
            isAuth
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 hover:border-blue-600'
          }`}
        >
          {isAuth ? <Unlock className="w-4 h-4 text-blue-600" /> : <Lock className="w-4 h-4 text-slate-500" />}
          <span>{isAuth ? 'Admin (Unlocked)' : 'Admin 🔒'}</span>
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
        >
          <SettingsIcon className="w-4 h-4 text-blue-600" />
          <span>Settings</span>
        </button>

        <button
          onClick={handleRandomGame}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
        >
          <Dices className="w-4 h-4 text-blue-600" />
          <span>Surprise Me!</span>
        </button>

        <button
          onClick={onUserLogout}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          title="Exit to cover"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* 9-Game Grid: Two-Color Pure White Cards with Child-Attracting Blue Accents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black font-display text-slate-900 dark:text-white">
            🎮 Play Room Mini-Games
          </h2>
          <span className="text-xs font-bold text-slate-500">9 Games Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game) => {
            return (
              <button
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className="group p-6 rounded-3xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl group-hover:scale-110 transition-transform">
                      {game.icon}
                    </span>
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2.5 py-1 rounded-full">
                      {game.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    {game.tagline}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed font-normal">
                    {game.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {game.metric === 'low' ? 'Best Time/Moves' : game.metric === 'high' ? 'High Score' : 'Tally Points'}
                  </span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Play <span>→</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Community Board & Public Challenges Section */}
      <div id="community-section" className="pt-4 border-t-2 border-slate-200 dark:border-slate-800">
        <CommunityBoard
          onPlayGame={onSelectGame}
          onOpenPublishModal={onOpenPublishModal}
          onSelectSharedItem={onSelectSharedItem}
        />
      </div>
    </div>
  );
};
