import React from 'react';
import { Zap, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080b11] border-t border-slate-800/80 text-slate-400 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-lime-400 flex items-center justify-center text-slate-950 font-black">
                <Zap className="w-4 h-4 fill-slate-950" />
              </div>
              <span className="text-lg font-black tracking-tight text-white font-heading">
                SMASH<span className="text-lime-400">ZONE</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Metro Manila’s premier sports facility network for badminton and pickleball. Professional BWF Taraflex and Acrytech courts, open play lobbies, and transparent queueing.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </div>
            <ul className="space-y-1.5">
              <li>
                <a href="#booking-section" className="hover:text-lime-400 transition">
                  Court Reservations
                </a>
              </li>
              <li>
                <a href="#lobby-section" className="hover:text-lime-400 transition">
                  Community Lobby & Open Play
                </a>
              </li>
              <li>
                <a href="#queue-section" className="hover:text-lime-400 transition">
                  Live Queueing Board
                </a>
              </li>
              <li>
                <a href="#coaching-section" className="hover:text-lime-400 transition">
                  Certified Pro Coaches
                </a>
              </li>
              <li>
                <a href="#availability-section" className="hover:text-lime-400 transition">
                  Court Availability Matrix
                </a>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Metro Manila Hubs
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li>Valenzuela Main Hub (Doneza St., Malinta)</li>
              <li>QC Araneta Hub (Gregorio Araneta Ave)</li>
              <li>BGC Central Arena (9th Ave cor 34th St)</li>
              <li>Makati Performance Center (Chino Roces Ext)</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Customer Support
            </div>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-lime-400" />
                <span>+63 915 662 8412</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-lime-400" />
                <span>support@smashzone.ph</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-2">
                Operating Daily · 06:00 AM – 12:00 Midnight
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} SmashZone Sports Hub Philippines. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: All bookings adhere to the 4-hour cancellation and refund policy.'); }} className="hover:text-slate-300">Terms of Service</a>
            <span>·</span>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: Customer contact and booking information is protected under the Data Privacy Act.'); }} className="hover:text-slate-300">Privacy Policy</a>
            <span>·</span>
            <a href="#rules" onClick={(e) => { e.preventDefault(); alert('Court Rules: Non-marking court shoes are required on all Taraflex badminton mats.'); }} className="hover:text-slate-300">Court Rules & Footwear</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
