import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { X, Lock, Mail, Phone, UserCheck, ShieldCheck, Zap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+63 9');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, phone, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication failed');
      } else {
        onAuthSuccess(data.user);
        onClose();
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Logo */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded bg-lime-400 flex items-center justify-center text-slate-950 font-black">
            <Zap className="w-4 h-4 fill-slate-950" />
          </div>
          <span className="text-lg font-black tracking-tight text-white font-heading">
            SMASH<span className="text-lime-400">ZONE</span>
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-1 font-heading">
          {mode === 'login' ? 'Sign In to SmashZone' : 'Create Athlete Account'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          {mode === 'login'
            ? 'Manage your court reservations, wallet, and session invites.'
            : 'Get ₱500 welcome credit and access to daily open play sessions.'}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 917 000 0000"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wide rounded-xl shadow-md transition cursor-pointer mt-2"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-lime-400 font-bold hover:underline"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-lime-400 font-bold hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

        {mode === 'login' && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Demo accounts
            </div>
            <div className="grid gap-2 text-[11px]">
              {[
                { label: 'Player · Alex Rivera', email: 'alex@smashzone.ph', password: 'customer123' },
                { label: 'Admin · Marcus Tan', email: 'admin@smashzone.ph', password: 'admin123' },
              ].map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                    setErrorMsg('');
                  }}
                  className="text-left px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
                >
                  <span className="block text-slate-200 font-semibold">{account.label}</span>
                  <span className="block mt-1 text-slate-400">{account.email}</span>
                  <span className="block text-slate-500">Password: {account.password}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
