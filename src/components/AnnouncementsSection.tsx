import React, { useState, useEffect } from 'react';
import { Announcement } from '../types';
import { Calendar, ArrowRight, X, Sparkles, Tag } from 'lucide-react';

export const AnnouncementsSection: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeModalAnnouncement, setActiveModalAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error('Error fetching announcements:', err));
  }, []);

  return (
    <section id="announcements-section" className="py-16 bg-[#0d121c] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
              Latest News & Updates
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
              Announcements & Tournaments
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Stay in the loop with upcoming leagues, facility enhancements, and member perks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between shadow-xl group"
            >
              <div>
                <div className="relative h-40 overflow-hidden bg-slate-900">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-lime-400 px-2 py-0.5 rounded border border-lime-500/30 uppercase">
                    {item.category}
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{item.published_at}</span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight leading-snug mb-2 font-heading">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => setActiveModalAnnouncement(item)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Read Full Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Read More */}
        {activeModalAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
              <button
                onClick={() => setActiveModalAnnouncement(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase text-lime-400 bg-lime-950/80 px-2 py-0.5 rounded border border-lime-500/30">
                  {activeModalAnnouncement.category}
                </span>
                <span className="text-xs text-slate-400 tabular-nums">
                  Published {activeModalAnnouncement.published_at}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-4 font-heading">
                {activeModalAnnouncement.title}
              </h3>

              <div className="h-44 rounded-xl overflow-hidden mb-4">
                <img
                  src={activeModalAnnouncement.image_url}
                  alt={activeModalAnnouncement.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                {activeModalAnnouncement.content}
              </p>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveModalAnnouncement(null)}
                  className="px-5 py-2 bg-lime-400 text-slate-950 font-bold text-xs rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
