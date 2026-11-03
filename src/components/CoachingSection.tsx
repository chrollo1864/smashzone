import React, { useState, useEffect } from 'react';
import { Coach, SportType, User } from '../types';
import { Star, Award, Calendar, CheckCircle2, Search, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

interface CoachingSectionProps {
  currentUser: User | null;
}

export const CoachingSection: React.FC<CoachingSectionProps> = ({ currentUser }) => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  // Lesson Booking Modal state
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingSlot, setBookingSlot] = useState<string>('09:00 - 10:00');
  const [notes, setNotes] = useState<string>('');
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetch(`/api/coaches?sport=${sportFilter}`)
      .then((res) => res.json())
      .then((data) => setCoaches(data))
      .catch((err) => console.error('Error fetching coaches:', err));
  }, [sportFilter]);

  const filteredCoaches = coaches.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certifications.some((cert) => cert.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/coaching/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: selectedCoach.id,
          user_name: currentUser?.name || 'SmashZone Trainee',
          sport: selectedCoach.sports[0],
          date: bookingDate,
          time_slot: bookingSlot,
          notes,
        }),
      });

      if (res.ok) {
        setBookingConfirmed(true);
      }
    } catch (err) {
      console.error('Error booking coach:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="coaching-section" className="py-16 bg-[#0d121c] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
              High-Performance Academy
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
              Certified Pro Coaches
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Accelerate your game with BWF-certified and PPR-certified national coaches and touring pros.
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coach, technique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg focus:border-lime-400 focus:outline-none w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSportFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  sportFilter === 'all' ? 'bg-lime-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSportFilter('badminton')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  sportFilter === 'badminton' ? 'bg-lime-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Badminton
              </button>
              <button
                onClick={() => setSportFilter('pickleball')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  sportFilter === 'pickleball' ? 'bg-lime-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pickleball
              </button>
            </div>
          </div>
        </div>

        {/* Coaches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCoaches.map((coach) => (
            <div
              key={coach.id}
              className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between shadow-xl group"
            >
              <div>
                {/* Coach Portrait Banner */}
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src={coach.avatar_url}
                    alt={coach.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent"></div>
                  {coach.is_verified && (
                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-lime-500/40 text-lime-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-lime-400" />
                      <span>Verified Pro</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white text-base font-heading">{coach.name}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{coach.rating}</span>
                    </div>
                  </div>

                  <div className="text-xs text-lime-400 font-semibold mb-2">{coach.title}</div>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {coach.bio}
                  </p>

                  {/* Certifications & Stats */}
                  <div className="space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800/80 pt-3">
                    <div className="text-slate-400 truncate">
                      📜 {coach.certifications[0]}
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Experience: {coach.experience_years} years</span>
                      <span className="tabular-nums font-semibold text-slate-300">{coach.total_sessions} Sessions Done</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking CTA Footer */}
              <div className="p-5 pt-0">
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mb-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Private Lesson</span>
                  <span className="text-base font-black text-white tabular-nums">
                    ₱{coach.hourly_rate} <span className="text-[10px] font-normal text-slate-400">/ hr</span>
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedCoach(coach);
                    setBookingConfirmed(false);
                    setBookingModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs uppercase tracking-wide rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Private Session</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Book Coach */}
        {bookingModalOpen && selectedCoach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              {!bookingConfirmed ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white font-heading">
                      Book Private Lesson with {selectedCoach.name}
                    </h3>
                    <span className="text-xs text-lime-400 font-bold tabular-nums">
                      ₱{selectedCoach.hourly_rate}/hr
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Schedule 1-on-1 technique assessment, footwork drills, or tactical strategy.
                  </p>

                  <form onSubmit={handleBookSession} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Time Slot
                      </label>
                      <select
                        value={bookingSlot}
                        onChange={(e) => setBookingSlot(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                      >
                        <option value="08:00 - 09:00">08:00 AM - 09:00 AM</option>
                        <option value="09:00 - 10:00">09:00 AM - 10:00 AM</option>
                        <option value="14:00 - 15:00">02:00 PM - 03:00 PM</option>
                        <option value="17:00 - 18:00">05:00 PM - 06:00 PM</option>
                        <option value="19:00 - 20:00">07:00 PM - 08:00 PM</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Skill Focus / Target Goals (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Backhand clear consistency, third-shot drop placement"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setBookingModalOpen(false)}
                        className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition"
                      >
                        {isSubmitting ? 'Requesting...' : 'Confirm Coaching Reservation'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white font-heading">
                    Coaching Session Booked!
                  </h4>
                  <p className="text-xs text-slate-400">
                    Coach {selectedCoach.name} has been notified for {bookingDate} ({bookingSlot}). You will receive coach confirmation via SMS.
                  </p>
                  <button
                    onClick={() => setBookingModalOpen(false)}
                    className="px-6 py-2 bg-lime-400 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
