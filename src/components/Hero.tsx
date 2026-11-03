import React from 'react';
import { DatabaseStats } from '../types';
import { Calendar, Users, ShieldCheck, MapPin, Trophy, ArrowRight, Flame } from 'lucide-react';

interface HeroProps {
  stats: DatabaseStats | null;
  onBookClick: () => void;
  onLobbyClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ stats, onBookClick, onLobbyClick }) => {
  return (
    <div className="relative overflow-hidden bg-[#0b0f17] pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background Hero Photography with Measured Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_badminton_court_1793346018863.jpg"
          alt="SmashZone Professional Indoor Badminton and Pickleball Arena"
          className="w-full h-full object-cover object-center opacity-35"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/80 to-[#0b0f17]/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-lime-500/10 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Section Kicker */}
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-lime-400 mb-4 bg-lime-950/60 border border-lime-500/30 px-3 py-1 rounded-md backdrop-blur-sm">
            <Flame className="w-3.5 h-3.5 fill-lime-400" />
            <span>Badminton & Pickleball Hub · Metro Manila</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-[1.08] font-heading">
            SMASH. RALLY. <span className="text-lime-400">ELEVATE.</span>
          </h1>

          {/* Value Description */}
          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
            Play on Olympic BWF-grade Taraflex badminton mats and tournament-certified Acrytech pickleball courts.
            Reserve your court in real time, join walk-in Open Play sessions, or step up to the digital paddle queue.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onBookClick}
              className="px-6 py-3.5 bg-lime-400 hover:bg-lime-300 text-slate-950 text-sm font-extrabold uppercase tracking-wide rounded-xl shadow-xl shadow-lime-400/25 transition flex items-center gap-2 group cursor-pointer"
            >
              <span>Book a Court Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onLobbyClick}
              className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white text-sm font-bold uppercase tracking-wide rounded-xl border border-slate-700/80 transition cursor-pointer"
            >
              <span>Explore Member Lobby</span>
            </button>
          </div>
        </div>

        {/* Database Live Stats Counter Strip */}
        <div className="mt-14 pt-8 border-t border-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Real-Time Network Statistics
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs text-slate-400 font-medium">Total Bookings</div>
              <div className="text-2xl font-black text-white tracking-tight tabular-nums mt-1 font-heading">
                {stats?.totalBookings.toLocaleString() || '1,422'}
              </div>
              <div className="text-[11px] text-lime-400 mt-1">Live verified</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs text-slate-400 font-medium">Registered Members</div>
              <div className="text-2xl font-black text-white tracking-tight tabular-nums mt-1 font-heading">
                {stats?.registeredMembers.toLocaleString() || '869'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Across 4 hubs</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs text-slate-400 font-medium">Total Courts</div>
              <div className="text-2xl font-black text-white tracking-tight tabular-nums mt-1 font-heading">
                {stats?.totalCourts || '28'}
              </div>
              <div className="text-[11px] text-lime-400 mt-1">Taraflex & Acrytech</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs text-slate-400 font-medium">Active Branches</div>
              <div className="text-2xl font-black text-white tracking-tight tabular-nums mt-1 font-heading">
                {stats?.totalBranches || '4'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Metro Manila</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs text-slate-400 font-medium">Community Sessions</div>
              <div className="text-2xl font-black text-white tracking-tight tabular-nums mt-1 font-heading">
                {stats?.totalSessions || '316'}
              </div>
              <div className="text-[11px] text-lime-400 mt-1">Open & Unli play</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-xs text-slate-400 font-medium">Pro Coaches</div>
              <div className="text-2xl font-black text-white tracking-tight tabular-nums mt-1 font-heading">
                {stats?.totalCoaches || '5'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">BWF & PPR Certified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
