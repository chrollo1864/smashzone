import React, { useState } from 'react';
import { Branch } from '../types';
import { MapPin, Clock, Phone, Navigation, ExternalLink, X, ShieldCheck } from 'lucide-react';

interface LocationsSectionProps {
  branches: Branch[];
  onSelectBranchForBooking: (branchId: string) => void;
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({
  branches,
  onSelectBranchForBooking,
}) => {
  const [directionsModalBranch, setDirectionsModalBranch] = useState<Branch | null>(null);

  return (
    <section id="locations-section" className="py-16 bg-[#0b0f17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
            Flagship Arenas
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
            Our Locations & Facilities
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Convenient hubs across Metro Manila equipped with tournament courts, pro shops, and player lounges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {branches.map((b) => (
            <div
              key={b.id}
              className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between shadow-2xl group"
            >
              <div>
                {/* Branch Image */}
                <div className="relative h-56 overflow-hidden bg-slate-900">
                  <img
                    src={b.image_url}
                    alt={b.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent"></div>
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    {b.total_courts} Professional Courts
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white tracking-tight font-heading mb-1">
                    {b.name}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-300 mt-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                      <div>
                        <div>{b.address}</div>
                        <div className="text-slate-500">{b.city}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-lime-400 shrink-0" />
                      <span>{b.opening_hours}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-lime-400 shrink-0" />
                      <span>{b.phone}</span>
                    </div>
                  </div>

                  {/* Hourly Rate Badges */}
                  <div className="grid grid-cols-2 gap-3 mt-5 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Badminton</div>
                      <div className="text-base font-black text-white tabular-nums">
                        ₱{b.badminton_rate} <span className="text-[10px] font-normal text-slate-400">/ hr</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Pickleball</div>
                      <div className="text-base font-black text-lime-400 tabular-nums">
                        ₱{b.pickleball_rate} <span className="text-[10px] font-normal text-slate-400">/ hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Amenities Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {b.amenities.map((a, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex items-center gap-3">
                <button
                  onClick={() => setDirectionsModalBranch(b)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-lime-400" />
                  <span>Get Directions</span>
                </button>
                <button
                  onClick={() => onSelectBranchForBooking(b.id)}
                  className="flex-1 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Book This Branch</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Map & Directions */}
        {directionsModalBranch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
              <button
                onClick={() => setDirectionsModalBranch(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-1 font-heading">
                {directionsModalBranch.name}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {directionsModalBranch.address}, {directionsModalBranch.city}
              </p>

              {/* Map Preview Simulation */}
              <div className="h-56 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center p-4 text-center">
                <div className="absolute inset-0 opacity-20 court-grid-pattern"></div>
                <div className="relative z-10 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-lime-400 text-slate-950 flex items-center justify-center mx-auto font-black shadow-lg shadow-lime-400/30">
                    <MapPin className="w-6 h-6 fill-slate-950" />
                  </div>
                  <div className="text-xs font-bold text-white">{directionsModalBranch.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Coordinates: 14.7011° N, 120.9830° E · Metro Manila
                  </div>
                  <div className="text-[11px] text-lime-400 font-medium">
                    Ample free parking · Accessible via North Luzon Expressway & EDSA
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-slate-400">
                  Contact Reception: <strong className="text-white">{directionsModalBranch.phone}</strong>
                </div>
                <button
                  onClick={() => {
                    const query = encodeURIComponent(`${directionsModalBranch.name} ${directionsModalBranch.address}`);
                    window.open(`https://maps.google.com/?q=${query}`, '_blank');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 font-semibold"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
