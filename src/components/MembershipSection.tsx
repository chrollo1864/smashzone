import React from 'react';
import { Check, Zap, Sparkles, ShieldCheck } from 'lucide-react';

interface MembershipSectionProps {
  onSignUp: () => void;
  onLogin: () => void;
}

export const MembershipSection: React.FC<MembershipSectionProps> = ({ onSignUp, onLogin }) => {
  const plans = [
    {
      name: 'Free Community',
      subtitle: 'For casual and weekend players',
      price: '₱0',
      cadence: 'Forever free',
      highlighted: false,
      features: [
        'Pay-as-you-play standard court rates',
        'Real-time online court booking (up to 3 days in advance)',
        'Access to daily Open Play & Unli Play lobbies',
        'Live digital paddle rack queueing entry',
        'Customer dashboard & booking history',
      ],
      ctaText: 'Create Free Account',
      ctaAction: onSignUp,
    },
    {
      name: 'Silver Smash Club',
      subtitle: 'For weekly league and doubles enthusiasts',
      price: '₱1,200',
      cadence: 'per month',
      highlighted: true,
      features: [
        '10% discount on all Badminton & Pickleball court hours',
        '5 days advance priority booking window',
        '1 complimentary Open Play pass every month (₱250 value)',
        '10% off demo racket & paddle rentals',
        'VIP locker access and towel service',
      ],
      ctaText: 'Join Silver Club',
      ctaAction: onSignUp,
    },
    {
      name: 'Gold Master Pass',
      subtitle: 'For competitive athletes & daily regulars',
      price: '₱2,800',
      cadence: 'per month',
      highlighted: false,
      features: [
        '25% discount on all court reservations across all 4 hubs',
        '7 days advance priority booking window',
        '4 complimentary Open Play passes monthly (₱1,000 value)',
        'Priority queueing status on digital paddle boards',
        '1 free electronic racket restringing per month',
        'Exclusive invitations to SmashZone Invitationals',
      ],
      ctaText: 'Upgrade to Gold Pass',
      ctaAction: onSignUp,
    },
  ];

  return (
    <section id="membership-section" className="py-16 bg-[#0d121c] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
            Exclusive Player Benefits
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
            SmashZone Membership Tiers
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Play more, save more, and enjoy priority access with our athlete membership plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 flex flex-col justify-between transition relative ${
                p.highlighted
                  ? 'bg-[#111827] border-2 border-lime-400 shadow-2xl shadow-lime-500/10'
                  : 'bg-[#111827] border border-slate-800'
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime-400 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow">
                  MOST POPULAR CLUB TIER
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white font-heading">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">{p.subtitle}</p>

                <div className="mb-6 pt-3 border-t border-slate-800/80">
                  <span className="text-3xl font-black text-white tabular-nums font-heading">
                    {p.price}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">/ {p.cadence}</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={p.ctaAction}
                  className={`w-full py-3 text-xs uppercase font-extrabold rounded-xl transition cursor-pointer ${
                    p.highlighted
                      ? 'bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-lg shadow-lime-400/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {p.ctaText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          Already a SmashZone member?{' '}
          <button
            onClick={onLogin}
            className="text-lime-400 font-bold hover:underline cursor-pointer"
          >
            Sign in to access your membership rates
          </button>
        </div>
      </div>
    </section>
  );
};
