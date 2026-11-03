import React, { useState, useEffect } from 'react';
import { Branch, SportType, Court } from '../types';
import { Calendar, Filter, Sparkles, Check, Clock, Info } from 'lucide-react';

interface AvailabilityGridProps {
  branches: Branch[];
  onSelectSlotToBook: (court: Court, date: string, slot: string) => void;
}

export const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  branches,
  onSelectSlotToBook,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'b-valenzuela');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [gridData, setGridData] = useState<{ court: Court; slots: { slot: string; status: string; detail: string; rate: number }[] }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    setIsLiveConnected(false);
    const fetchAvailability = (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      fetch(`/api/availability?branch_id=${selectedBranchId}&date=${selectedDate}&sport=${selectedSport}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Availability request failed with status ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (isCurrent) {
            setGridData(data.grid || []);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            console.error('Error fetching availability:', err);
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsLoading(false);
          }
        });
    };

    fetchAvailability(true);

    const eventSource = new EventSource(
      `/api/realtime/stream?branch_id=${selectedBranchId}&date=${selectedDate}`
    );
    eventSource.onopen = () => {
      if (isCurrent) setIsLiveConnected(true);
    };
    eventSource.onerror = () => {
      if (isCurrent) setIsLiveConnected(false);
    };
    eventSource.addEventListener('availability_updated', () => fetchAvailability());

    return () => {
      isCurrent = false;
      eventSource.close();
    };
  }, [selectedBranchId, selectedDate, selectedSport]);

  const statusColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    Available: { bg: 'bg-lime-500/10 hover:bg-lime-500/25 cursor-pointer', border: 'border-lime-500/40', text: 'text-lime-400', label: 'Available' },
    Booked: { bg: 'bg-red-500/15 cursor-not-allowed', border: 'border-red-500/30', text: 'text-red-400', label: 'Booked' },
    Session: { bg: 'bg-cyan-500/15 cursor-not-allowed', border: 'border-cyan-500/30', text: 'text-cyan-400', label: 'Open Play' },
    Event: { bg: 'bg-purple-500/15 cursor-not-allowed', border: 'border-purple-500/30', text: 'text-purple-400', label: 'Tournament' },
    Held: { bg: 'bg-amber-500/15 cursor-not-allowed', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Held' },
    Blocked: { bg: 'bg-slate-800/60 cursor-not-allowed', border: 'border-slate-700/40', text: 'text-slate-500', label: 'Maintenance' },
  };

  return (
    <section id="availability-section" className="py-16 bg-[#0b0f17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
              Live Facility Schedule
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
              Court Availability Matrix
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Live court schedule. Slot availability updates automatically as bookings and holds change.
            </p>
            <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${isLiveConnected ? 'text-lime-400' : 'text-slate-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isLiveConnected ? 'bg-lime-400' : 'bg-slate-500'}`} />
              {isLiveConnected ? 'Live updates connected' : 'Connecting to live updates...'}
            </div>
          </div>

          {/* Color-Coded Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {Object.entries(statusColors).map(([status, style]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded ${style.bg} border ${style.border}`}></span>
                <span className="text-slate-300 text-[11px]">{style.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
          {/* Branch Picker */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Branch Location
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 font-medium focus:border-lime-400 focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="w-48">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Schedule Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 font-medium focus:border-lime-400 focus:outline-none"
            />
          </div>

          {/* Sport Filter */}
          <div className="w-48">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Filter Sport
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 font-medium focus:border-lime-400 focus:outline-none"
            >
              <option value="all">All Sports</option>
              <option value="badminton">Badminton Only</option>
              <option value="pickleball">Pickleball Only</option>
            </select>
          </div>
        </div>

        {/* Matrix View */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading live court schedules...
            </div>
          ) : gridData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No courts found for the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400">
                    <th className="p-3.5 font-bold uppercase tracking-wider sticky left-0 bg-slate-900 z-10 min-w-[160px]">
                      Court Name
                    </th>
                    {gridData[0]?.slots.map((s) => (
                      <th
                        key={s.slot}
                        className="p-3 text-center font-bold tracking-tight whitespace-nowrap min-w-[90px] border-l border-slate-800/60"
                      >
                        {s.slot.split(' - ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {gridData.map(({ court, slots }) => (
                    <tr key={court.id} className="hover:bg-slate-800/30 transition">
                      {/* Court Title Sticky Column */}
                      <td className="p-3.5 sticky left-0 bg-[#111827] z-10 border-r border-slate-800 font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              court.sport === 'badminton' ? 'bg-lime-400' : 'bg-cyan-400'
                            }`}
                          ></span>
                          <span>{court.court_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          ₱{court.hourly_rate}/hr · {court.sport}
                        </div>
                      </td>

                      {/* Slot Cells */}
                      {slots.map((slotItem) => {
                        const style = statusColors[slotItem.status] || statusColors.Available;
                        const isAvailable = slotItem.status === 'Available';

                        return (
                          <td
                            key={slotItem.slot}
                            onClick={() => {
                              if (isAvailable) {
                                onSelectSlotToBook(court, selectedDate, slotItem.slot);
                              }
                            }}
                            className={`p-2 text-center border-l border-slate-800/60 transition ${style.bg}`}
                            title={`${court.court_name} · ${slotItem.slot} · ${slotItem.status} ${
                              slotItem.detail ? `(${slotItem.detail})` : ''
                            }`}
                          >
                            <div className={`text-[10px] font-bold ${style.text}`}>
                              {isAvailable ? 'OPEN' : slotItem.status.toUpperCase()}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate max-w-[80px] mx-auto">
                              {isAvailable ? `₱${slotItem.rate}` : slotItem.detail || '-'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
