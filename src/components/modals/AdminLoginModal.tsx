import React, { useState } from 'react';
import { ADMIN_NAME, verifyAdminPassword, setAdminAuthenticated } from '../../utils/storage';
import { loginWithGoogle, isUserAdmin, ADMIN_EMAIL } from '../../services/firebaseService';
import { Lock, Eye, EyeOff, X, KeyRound, ShieldCheck } from 'lucide-react';
import { sound } from '../../utils/audio';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      sound.playSuccess();
      setAdminAuthenticated(true);
      setErrorMsg('');
      setPassword('');
      onSuccess();
      onClose();
    } else {
      sound.playError();
      setErrorMsg('Incorrect admin password. Access denied.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user && (isUserAdmin(user) || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
        sound.playSuccess();
        setAdminAuthenticated(true);
        onSuccess();
        onClose();
      } else if (user) {
        sound.playError();
        setErrorMsg(`Signed in as ${user.email}, but this account is not registered as the admin (${ADMIN_EMAIL}).`);
      }
    } catch (err: any) {
      console.error(err);
      sound.playError();
      setErrorMsg(err.message || 'Failed to authenticate via Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black font-display text-slate-900 dark:text-white">
              Admin Access Lock
            </h3>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Admin: <strong className="text-blue-600 dark:text-blue-400">{ADMIN_NAME}</strong>
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed font-medium">
          Only the authorized administrator ({ADMIN_NAME} · {ADMIN_EMAIL}) can view all user results and perform maintenance.
        </p>

        {/* Google One-Click Login */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full py-2.5 px-4 mb-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{isGoogleLoading ? 'Verifying with Google...' : 'Sign in as Admin with Google'}</span>
        </button>

        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] uppercase font-bold text-slate-400">or enter password</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-3">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Enter Admin Password"
              autoFocus
              className="w-full pl-4 pr-11 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-rose-500 mb-3 animate-fade-in">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow hover:opacity-95 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Unlock Admin Panel</span>
          </button>
        </form>
      </div>
    </div>
  );
};
