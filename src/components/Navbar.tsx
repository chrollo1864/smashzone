import React, { useState } from 'react';
import { User } from '../types';
import { Zap, LogOut, LayoutDashboard, Menu, X, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onNavigateView: (view: 'home' | 'dashboard' | 'admin' | 'booking' | 'queue') => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onNavigateView,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      {/* Optional Top Role Testing Bar */}
      <div className="bg-slate-900/90 text-xs px-4 py-1.5 border-b border-slate-800 flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime-400"></span>
          <span>Metro Manila Hubs Open Today · 06:00 AM – 12:00 Midnight</span>
        </div>
        <span className="text-right">
          {currentUser ? `Signed in as ${currentUser.name}` : 'Demo sign-in available for Player and Admin'}
        </span>
      </div>

      {/* Main Navigation Bar (Top Bar Contract: 3 Zones) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigateView('home')}
          className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-lime-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-lime-400/20 group-hover:scale-105 transition">
            <Zap className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white font-heading">
              SMASH<span className="text-lime-400">ZONE</span>
            </span>
          </div>
        </button>

        {/* Zone 2: Concise Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => {
              onNavigateView('home');
              const el = document.getElementById('booking-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-lime-400 transition whitespace-nowrap shrink-0"
          >
            Court Booking
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              const el = document.getElementById('lobby-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-lime-400 transition whitespace-nowrap shrink-0"
          >
            Community Lobby
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              const el = document.getElementById('queue-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-lime-400 transition whitespace-nowrap shrink-0"
          >
            Live Queueing
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              const el = document.getElementById('coaching-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-lime-400 transition whitespace-nowrap shrink-0"
          >
            Coaching
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              const el = document.getElementById('availability-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-lime-400 transition whitespace-nowrap shrink-0"
          >
            Availability Grid
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              const el = document.getElementById('locations-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-lime-400 transition whitespace-nowrap shrink-0"
          >
            Branches
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' || currentUser.role === 'manager' ? (
                <button
                  onClick={() => onNavigateView('admin')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
                    currentView === 'admin'
                      ? 'bg-lime-400 text-slate-950 border-lime-400'
                      : 'bg-slate-800 text-lime-400 border-lime-400/30 hover:bg-slate-700'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigateView('dashboard')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
                    currentView === 'dashboard'
                      ? 'bg-lime-400 text-slate-950 border-lime-400'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-lime-400" />
                  <span>Dashboard</span>
                </button>
              )}

              <button
                onClick={onLogout}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-lime-400 rounded-lg hover:bg-lime-300 shadow-md shadow-lime-400/20 transition whitespace-nowrap"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <button
            onClick={() => {
              onNavigateView('home');
              setMobileMenuOpen(false);
              document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block w-full text-left py-2 text-sm text-slate-200 hover:text-lime-400 font-medium"
          >
            Court Booking
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              setMobileMenuOpen(false);
              document.getElementById('lobby-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block w-full text-left py-2 text-sm text-slate-200 hover:text-lime-400 font-medium"
          >
            Community Lobby (Open & Unli Play)
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              setMobileMenuOpen(false);
              document.getElementById('queue-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block w-full text-left py-2 text-sm text-slate-200 hover:text-lime-400 font-medium"
          >
            Live Queueing Board
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              setMobileMenuOpen(false);
              document.getElementById('coaching-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block w-full text-left py-2 text-sm text-slate-200 hover:text-lime-400 font-medium"
          >
            Certified Coaches
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              setMobileMenuOpen(false);
              document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block w-full text-left py-2 text-sm text-slate-200 hover:text-lime-400 font-medium"
          >
            Court Availability Grid
          </button>
          <button
            onClick={() => {
              onNavigateView('home');
              setMobileMenuOpen(false);
              document.getElementById('locations-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block w-full text-left py-2 text-sm text-slate-200 hover:text-lime-400 font-medium"
          >
            Branches & Rates
          </button>
        </div>
      )}
    </header>
  );
};
