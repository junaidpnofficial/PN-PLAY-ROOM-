import React, { useState, useEffect } from 'react';
import { GameId } from './types';
import { GAMES } from './data/gamesMeta';
import { getProfile, isAdminAuthenticated, setAdminAuthenticated, mergeRemoteResults } from './utils/storage';
import { subscribeToGameResults, subscribeToAuth, isUserAdmin, logoutUser } from './services/firebaseService';
import { sound } from './utils/audio';
import { GameShell } from './components/common/GameShell';
import { ArcadeHome } from './components/views/ArcadeHome';
import { LeaderboardView } from './components/views/LeaderboardView';
import { MyResultsView } from './components/views/MyResultsView';
import { AdminView } from './components/views/AdminView';
import { LandingPage } from './components/views/LandingPage';
import { NameSetupPage } from './components/views/NameSetupPage';
import { PlayerModal } from './components/modals/PlayerModal';
import { AdminLoginModal } from './components/modals/AdminLoginModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { PublishModal } from './components/modals/PublishModal';
import { SharedItemModal } from './components/modals/SharedItemModal';
import { getPublishedItemById } from './services/firebaseService';
import { PublishedItem, PublishedItemType, GameResult } from './types';

// Game components
import { MemoryMatch } from './components/games/MemoryMatch';
import { TicTacToe } from './components/games/TicTacToe';
import { SosGame } from './components/games/SosGame';
import { SudokuGame } from './components/games/SudokuGame';
import { ShikakuGame } from './components/games/ShikakuGame';
import { MurderByNumbers } from './components/games/MurderByNumbers';
import { Game2048 } from './components/games/Game2048';
import { HangmanGame } from './components/games/HangmanGame';
import { WhackAMole } from './components/games/WhackAMole';

import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  User,
  Gamepad2,
  Trophy,
  ListOrdered,
  Shield,
  Lock,
  Unlock,
  Settings as SettingsIcon,
  LogOut,
  Smartphone,
  Monitor,
} from 'lucide-react';

type ViewMode = 'landing' | 'name-setup' | 'home' | 'game' | 'leaderboard' | 'results' | 'admin';

export default function App() {
  const [profile, setProfileState] = useState(() => getProfile());
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [activeGameId, setActiveGameId] = useState<GameId>('shikaku');
  const [gameKey, setGameKey] = useState<number>(0);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => isAdminAuthenticated());
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // Publish & Sharing modal states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishDefaults, setPublishDefaults] = useState<{
    gameId?: GameId;
    score?: number;
    detail?: string;
    type?: PublishedItemType;
  }>({});
  const [selectedSharedItem, setSelectedSharedItem] = useState<PublishedItem | null>(null);
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);

  // Deep linking: check URL search parameters for shared item links (?share=...)
  useEffect(() => {
    const checkDeepLink = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const shareId = searchParams.get('share');
        if (shareId) {
          const item = await getPublishedItemById(shareId);
          if (item) {
            setSelectedSharedItem(item);
            setIsSharedModalOpen(true);
          }
        }
      } catch (err) {
        console.debug('Deep-link fetch notice:', err);
      }
    };
    checkDeepLink();
  }, []);

  // Subscribe to Firebase real-time scores and auth state
  useEffect(() => {
    const unsubScores = subscribeToGameResults((remoteResults) => {
      mergeRemoteResults(remoteResults);
    });

    const unsubAuth = subscribeToAuth((user) => {
      setFirebaseUser(user);
      if (user && isUserAdmin(user)) {
        setIsAdminAuthed(true);
        setAdminAuthenticated(true);
      }
    });

    return () => {
      unsubScores();
      unsubAuth();
    };
  }, []);

  const [deviceMode, setDeviceMode] = useState<'pc' | 'mobile'>(() => {
    try {
      const saved = localStorage.getItem('playroom_device_mode');
      if (saved === 'mobile' || saved === 'pc') return saved;
      return window.innerWidth < 768 ? 'mobile' : 'pc';
    } catch {
      return 'pc';
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('playroom_theme') === 'dark' ||
        (!('playroom_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    } catch {
      return false;
    }
  });
  const [isMuted, setIsMuted] = useState(sound.initMuteState());

  // Apply dark mode class to html document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('playroom_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('playroom_theme', 'light');
      } catch {}
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const toggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const handleDeviceModeChange = (mode: 'pc' | 'mobile') => {
    setDeviceMode(mode);
    try {
      localStorage.setItem('playroom_device_mode', mode);
    } catch {}
  };

  const handleUserLogout = async () => {
    sound.playPop();
    try {
      await logoutUser();
    } catch {}
    setProfileState((prev) => ({ ...prev, name: 'Guest' }));
    setCurrentView('landing');
  };

  const handleSelectGame = (gameId: GameId) => {
    setActiveGameId(gameId);
    setGameKey((prev) => prev + 1);
    setCurrentView('game');
  };

  const handleRestartGame = () => {
    setGameKey((prev) => prev + 1);
  };

  const handleNextGame = () => {
    const currentIndex = GAMES.findIndex((g) => g.id === activeGameId);
    const nextIndex = (currentIndex + 1) % GAMES.length;
    setActiveGameId(GAMES[nextIndex].id);
    setGameKey((prev) => prev + 1);
  };

  const handleNameChanged = (newName: string) => {
    setProfileState((prev) => ({
      ...prev,
      name: newName,
      players: [newName, ...prev.players.filter((p) => p !== newName)].slice(0, 8),
    }));
  };

  const handleAdminNavClick = () => {
    if (isAdminAuthenticated()) {
      setIsAdminAuthed(true);
      setCurrentView('admin');
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthed(true);
    setCurrentView('admin');
  };

  const handleLockAdminSession = () => {
    setAdminAuthenticated(false);
    setIsAdminAuthed(false);
    setCurrentView('landing');
  };

  const handleOpenPublish = (opts?: {
    gameId?: GameId;
    score?: number;
    detail?: string;
    type?: PublishedItemType;
  }) => {
    setPublishDefaults(opts || { gameId: activeGameId, score: 100, type: 'challenge' });
    setIsPublishModalOpen(true);
  };

  // Render view content
  const renderCurrentView = () => {
    if (currentView === 'landing') {
      return (
        <LandingPage
          onLetsPlay={() => setCurrentView('name-setup')}
          deviceMode={deviceMode}
          onToggleDeviceMode={handleDeviceModeChange}
        />
      );
    }

    if (currentView === 'name-setup') {
      return (
        <NameSetupPage
          onConfirmName={(chosenName) => {
            handleNameChanged(chosenName);
            setCurrentView('home');
          }}
          onBackToLanding={() => setCurrentView('landing')}
        />
      );
    }

    if (currentView === 'home') {
      return (
        <ArcadeHome
          playerName={profile.name}
          onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onUserLogout={handleUserLogout}
          onSelectGame={handleSelectGame}
          onNavigate={(view) => {
            if (view === 'admin') {
              handleAdminNavClick();
            } else {
              setCurrentView(view);
            }
          }}
          onOpenPublishModal={() => handleOpenPublish()}
          onSelectSharedItem={(item) => {
            setSelectedSharedItem(item);
            setIsSharedModalOpen(true);
          }}
        />
      );
    }

    if (currentView === 'game') {
      return (
        <GameShell
          gameId={activeGameId}
          onBack={() => setCurrentView('home')}
          onRestart={handleRestartGame}
          onNextGame={handleNextGame}
          onOpenPublish={() =>
            handleOpenPublish({ gameId: activeGameId, score: 100, type: 'challenge' })
          }
        >
          {() => {
            switch (activeGameId) {
              case 'memory':
                return <MemoryMatch onRestart={handleRestartGame} gameKey={gameKey} />;
              case 'ttt':
                return <TicTacToe onRestart={handleRestartGame} gameKey={gameKey} />;
              case 'sos':
                return <SosGame onRestart={handleRestartGame} gameKey={gameKey} />;
              case 'sudoku':
                return <SudokuGame onRestart={handleRestartGame} gameKey={gameKey} />;
              case 'shikaku':
                return <ShikakuGame onRestart={handleRestartGame} gameKey={gameKey} />;
              case 'mbn':
                return <MurderByNumbers onRestart={handleRestartGame} gameKey={gameKey} />;
              case '2048':
                return <Game2048 onRestart={handleRestartGame} gameKey={gameKey} />;
              case 'hangman':
                return <HangmanGame onRestart={handleRestartGame} gameKey={gameKey} />;
              case 'whack':
                return <WhackAMole onRestart={handleRestartGame} gameKey={gameKey} />;
              default:
                return null;
            }
          }}
        </GameShell>
      );
    }

    if (currentView === 'leaderboard') {
      return (
        <LeaderboardView
          onPlayGame={handleSelectGame}
          onOpenPublishModal={(gId, score) =>
            handleOpenPublish({ gameId: gId, score, type: 'score' })
          }
        />
      );
    }

    if (currentView === 'results') {
      return (
        <MyResultsView
          onPlayGame={handleSelectGame}
          onChangeName={() => setIsPlayerModalOpen(true)}
          onOpenPublishModal={() => handleOpenPublish()}
          onPublishResult={(r) =>
            handleOpenPublish({
              gameId: r.gameId,
              score: r.v,
              detail: r.detail,
              type: 'score',
            })
          }
        />
      );
    }

    if (currentView === 'admin') {
      return (
        <AdminView
          onRefresh={() => setProfileState(getProfile())}
          onLockAdmin={handleLockAdminSession}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-white transition-colors duration-200">
      {/* 3-Zone Top Navigation Bar with Option in the Above for PC and Mobile Mode */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#131b2e]/95 backdrop-blur-md border-b-2 border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2.5 text-xl font-black font-display tracking-tight whitespace-nowrap shrink-0 cursor-pointer group"
          >
            <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base shadow-sm group-hover:scale-105 transition-transform">
              🎮
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-black text-2xl tracking-tight">
              Play Room
            </span>
          </button>

          {/* Center Zone: Mode Option in the Above (Mobile vs PC mode switch) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleDeviceModeChange('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
              }`}
              title="Play in Mobile Mode"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
            <button
              onClick={() => handleDeviceModeChange('pc')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deviceMode === 'pc'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
              }`}
              title="Play in PC Desktop Mode"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC</span>
            </button>
          </div>

          {/* Zone 2: Navigation Links for Desktop */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-bold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setCurrentView('home')}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'home' || currentView === 'game'
                  ? 'text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              All Games
            </button>
            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'leaderboard'
                  ? 'text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              Leaderboards
            </button>
            <button
              onClick={() => setCurrentView('results')}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'results'
                  ? 'text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              My Results
            </button>
            <button
              onClick={handleAdminNavClick}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              {isAdminAuthed ? (
                <Unlock className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isAdminAuthed ? 'Admin (Unlocked)' : 'Admin 🔒'}</span>
            </button>
          </nav>

          {/* Zone 3: Utilities (Sound, Theme, Settings, Player, Logout) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>

            {/* Settings Modal Toggle */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Arcade Settings"
            >
              <SettingsIcon className="w-4 h-4 text-blue-600" />
            </button>

            {/* Player Switcher Button */}
            <button
              onClick={() => setIsPlayerModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] hover:border-blue-600 text-xs font-bold text-slate-800 dark:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="max-w-[75px] truncate">{profile.name || 'Guest'}</span>
            </button>

            {/* Log Out */}
            <button
              onClick={handleUserLogout}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Return to Cover Page & Switch User"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Responsive to PC or Mobile Mode */}
      <main className="flex-1 w-full flex flex-col justify-start">
        {deviceMode === 'mobile' ? (
          // Simulated Smartphone Viewport for Mobile Mode
          <div className="w-full py-4 sm:py-6 px-2 flex justify-center items-start">
            <div className="w-full max-w-[420px] rounded-[2.5rem] border-[10px] border-slate-800 dark:border-slate-900 shadow-2xl bg-slate-50 dark:bg-[#090d16] overflow-hidden min-h-[760px] relative flex flex-col">
              {/* Dynamic Island / Speaker Notch Header */}
              <div className="w-full flex items-center justify-between px-6 pt-2 pb-1 bg-transparent shrink-0">
                <span className="text-[10px] font-bold text-slate-400">9:41</span>
                <div className="w-20 h-4 bg-slate-800 dark:bg-slate-900 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400">5G 🔋</span>
              </div>

              {/* Viewport content */}
              <div className="flex-1 overflow-y-auto px-1 py-2">
                {renderCurrentView()}
              </div>
            </div>
          </div>
        ) : (
          // Full PC Desktop Layout
          <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex-1">
            {renderCurrentView()}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden sticky bottom-0 z-40 bg-white/95 dark:bg-[#131b2e]/95 border-t-2 border-slate-200 dark:border-slate-800 backdrop-blur-md px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => setCurrentView('landing')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer ${
            currentView === 'landing'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span>🏠</span>
          <span>Cover</span>
        </button>

        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer ${
            currentView === 'home' || currentView === 'game'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Games</span>
        </button>

        <button
          onClick={() => setCurrentView('leaderboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer ${
            currentView === 'leaderboard'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Scores</span>
        </button>

        <button
          onClick={() => setCurrentView('results')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer ${
            currentView === 'results'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>My Results</span>
        </button>

        <button
          onClick={handleAdminNavClick}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer ${
            currentView === 'admin'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{isAdminAuthed ? 'Admin' : 'Admin 🔒'}</span>
        </button>
      </div>

      {/* Player Nickname / Switch Modal */}
      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onNameChanged={handleNameChanged}
      />

      {/* Admin Password Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onUserLogout={handleUserLogout}
        onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
        onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        onRefreshData={() => setProfileState(getProfile())}
      />

      {/* Publish & Share Content Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        defaultGameId={publishDefaults.gameId || activeGameId}
        defaultScore={publishDefaults.score || 100}
        defaultDetail={publishDefaults.detail || ''}
        defaultType={publishDefaults.type || 'challenge'}
        playerName={profile.name}
        onPublishedSuccess={(item) => {
          setSelectedSharedItem(item);
        }}
      />

      {/* Shared Item Deep Link / Community Card Modal */}
      <SharedItemModal
        item={selectedSharedItem}
        isOpen={isSharedModalOpen}
        onClose={() => {
          setIsSharedModalOpen(false);
          // Clean share query parameter from URL without page reload
          if (window.location.search.includes('share=')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('share');
            window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
          }
        }}
        onPlayGame={(gameId) => {
          handleSelectGame(gameId);
        }}
      />
    </div>
  );
}
