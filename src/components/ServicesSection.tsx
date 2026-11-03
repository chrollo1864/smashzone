import React from 'react';
import { Calendar, Users, Award, Zap, Repeat, Layers, CreditCard, ShoppingBag, ArrowRight } from 'lucide-react';

interface ServicesSectionProps {
  onSelectService: (serviceKey: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const services = [
    {
      key: 'badminton',
      title: 'Badminton Booking',
      desc: 'Reserve world-class BWF Taraflex and Cushion Pro courts with guaranteed time slot locking.',
      icon: Calendar,
      action: 'Book Court',
      badge: 'From ₱500/hr',
    },
    {
      key: 'pickleball',
      title: 'Pickleball Booking',
      desc: 'Play on tournament-grade Acrytech non-slip surfaces with official USAP/PPR regulation nets.',
      icon: Zap,
      action: 'Book Court',
      badge: 'From ₱650/hr',
    },
    {
      key: 'coaching',
      title: 'Pro Coaching Academy',
      desc: 'One-on-one private lessons and group technique clinics taught by certified national squad athletes.',
      icon: Award,
      action: 'Find Coach',
      badge: 'Certified Pros',
    },
    {
      key: 'open_play',
      title: 'Open Play Sessions',
      desc: 'Walk in or reserve a drop-in slot for social badminton and pickleball matches organized by skill tiers.',
      icon: Users,
      action: 'Join Lobby',
      badge: '₱250/head',
    },
    {
      key: 'unli_play',
      title: 'Unli Play Passes',
      desc: 'Unlimited play access during dedicated off-peak morning and late-night blocks.',
      icon: Repeat,
      action: 'View Passes',
      badge: 'Unlimited Slots',
    },
    {
      key: 'queueing',
      title: 'Digital Paddle Queueing',
      desc: 'Transparent automated paddle rack rotation system ensuring equal court time for drop-in players.',
      icon: Layers,
      action: 'Live Board',
      badge: 'Real-Time Sync',
    },
    {
      key: 'membership',
      title: 'Smash Club Membership',
      desc: 'Unlock exclusive 15-25% court rate discounts, priority booking windows, and complimentary guest passes.',
      icon: CreditCard,
      action: 'View Tiers',
      badge: 'Perks & Credits',
    },
    {
      key: 'merchant',
      title: 'Merchant & Pro Shop',
      desc: 'Yonex, Victor, and Selkirk racket sales, 24-hour electronic restringing, and grips.',
      icon: ShoppingBag,
      action: 'Explore Shop',
      badge: 'Pro Gear',
    },
  ];

  return (
    <section className="py-16 bg-[#0d121c] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
            Complete Racket Ecosystem
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
            Explore Our Services
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            From casual weekend rallies to competitive training ladders, SmashZone has you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                onClick={() => onSelectService(s.key)}
                className="bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-lime-500/50 hover:bg-slate-800/30 transition flex flex-col justify-between shadow-xl cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-lime-400/10 text-lime-400 flex items-center justify-center border border-lime-500/20 group-hover:scale-110 transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-lime-400 bg-lime-950/80 px-2 py-0.5 rounded border border-lime-500/30">
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 font-heading group-hover:text-lime-400 transition">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-lime-400 transition">
                  <span>{s.action}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
