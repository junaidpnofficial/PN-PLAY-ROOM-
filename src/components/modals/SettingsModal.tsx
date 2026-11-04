import React, { useState } from 'react';
import {
  clearAllResults,
  exportDataAsJSON,
  getProfile,
  isAdminAuthenticated,
  setAdminAuthenticated,
  ADMIN_NAME,
} from '../../utils/storage';
import { sound } from '../../utils/audio';
import {
  X,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  User,
  LogOut,
  Lock,
  Unlock,
  Download,
  Trash2,
  Settings as SettingsIcon,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onUserLogout: () => void;
  onOpenPlayerModal: () => void;
  onOpenAdminLogin: () => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
  onUserLogout,
  onOpenPlayerModal,
  onOpenAdminLogin,
  onRefreshData,
}) => {
  const profile = getProfile();
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [isArmed, setIsArmed] = useState(false);
  const [notice, setNotice] = useState('');
  const isAuth = isAdminAuthenticated();

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
    if (!next) sound.playPop();
  };

  const handleAdminLock = () => {
    setAdminAuthenticated(false);
    setNotice('Admin session locked.');
    onRefreshData();
  };

  const handleExport = () => {
    const json = exportDataAsJSON();
    navigator.clipboard.writeText(json).then(() => {
      setNotice('Backup data copied to clipboard!');
      setTimeout(() => setNotice(''), 2500);
    });
  };

  const handleClear = () => {
    if (!isArmed) {
      setIsArmed(true);
      return;
    }
    clearAllResults();
    setIsArmed(false);
    setNotice('All local scores have been cleared.');
    onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black font-display text-slate-900 dark:text-white">
            Arcade Settings
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 font-medium">
          Customize audio, appearance, user profile, and administrative controls.
        </p>

        {notice && (
          <div className="mb-4 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Sound FX Setting */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-blue-600" />}
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Sound Effects
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isMuted ? 'Muted' : 'Enabled (Zero latency Web Audio)'}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`py-1 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-300 dark:border-rose-900'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>

          {/* Theme Setting */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {isDarkMode ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Color Theme
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleTheme}
              className="py-1 px-3 rounded-xl text-xs font-bold border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-white hover:border-blue-600 transition-all cursor-pointer"
            >
              Switch to {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* User Account & Logout */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Active Player: <strong className="text-blue-600 dark:text-blue-400">{profile.name || 'Guest'}</strong>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenPlayerModal();
                }}
                className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-white hover:border-blue-600 cursor-pointer"
              >
                Change Name
              </button>
              <button
                onClick={() => {
                  onClose();
                  onUserLogout();
                }}
                className="flex items-center justify-center gap-1.5 flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out User</span>
              </button>
            </div>
          </div>

          {/* Admin Security */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isAuth ? <Unlock className="w-4 h-4 text-blue-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Admin: {ADMIN_NAME} {isAuth ? '(Unlocked)' : '(Locked)'}
                </span>
              </div>
            </div>
            {isAuth ? (
              <button
                onClick={handleAdminLock}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Admin (Logout)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminLogin();
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Admin with Password</span>
              </button>
            )}
          </div>

          {/* Backup / Clear */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 py-2 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-white hover:border-blue-600 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Data</span>
            </button>
            <button
              onClick={handleClear}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                isArmed
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'border-2 border-rose-200 dark:border-rose-900 bg-white dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isArmed ? 'Tap to Confirm' : 'Clear Scores'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
