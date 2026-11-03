import React from 'react';
import { ShieldCheck, Users, Trophy, Sparkles, Activity, Clock } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-16 bg-[#0b0f17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
            The SmashZone Standard
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
            Why Players Choose SmashZone
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Engineered from the ground up for peak athletic performance, social community, and seamless booking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-lime-400/10 text-lime-400 flex items-center justify-center mb-5 border border-lime-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-heading">
              BWF & Regulation Surfaces
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every court is fitted with tournament-certified Taraflex shock absorption mats or high-traction Acrytech surfaces. Reduces joint stress by up to 57% during heavy jumping and sudden lunges.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-lime-400 font-semibold">
              1000 Lux Anti-Glare LED Fixtures
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center mb-5 border border-cyan-500/20">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-heading">
              Vibrant Racket Community
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No playing partner? No problem. Jump into daily Open Play sessions, Unli-Play morning passes, or place your paddle on the live digital queue board to rotate into doubles rallies.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-cyan-400 font-semibold">
              Transparent FIFO Paddle Rack
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-400/10 text-purple-400 flex items-center justify-center mb-5 border border-purple-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-heading">
              More Than Just A Game
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full pro shop with 24-hour racket restringing, demo gear rental, air-conditioned viewing gallery, craft cold-brew cafe, hot showers, and certified coaching masterclasses.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-purple-400 font-semibold">
              All-In-One Racket Lifestyle Hub
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
