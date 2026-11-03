import React, { useState, useEffect } from 'react';
import { QueueEntry, Branch, SportType, User } from '../types';
import { Users, Clock, Flame, Play, LogIn, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface QueueingBoardProps {
  branches: Branch[];
  currentUser: User | null;
}

export const QueueingBoard: React.FC<QueueingBoardProps> = ({
  branches,
  currentUser,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'b-valenzuela');
  const [selectedSport, setSelectedSport] = useState<SportType>('badminton');
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Join form state
  const [joinModalOpen, setJoinModalOpen] = useState<boolean>(false);
  const [teamName, setTeamName] = useState<string>('');
  const [p1Name, setP1Name] = useState<string>(currentUser?.name || '');
  const [p2Name, setP2Name] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchQueue = () => {
    setIsLoading(true);
    fetch(`/api/queues?branch_id=${selectedBranchId}&sport=${selectedSport}`)
      .then((res) => res.json())
      .then((data) => setQueueEntries(data))
      .catch((err) => console.error('Error fetching queue:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchQueue();
    // Poll every 12 seconds for live rotation updates
    const interval = setInterval(fetchQueue, 12000);
    return () => clearInterval(interval);
  }, [selectedBranchId, selectedSport]);

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Name.trim()) return;

    setIsSubmitting(true);
    const players = [p1Name.trim()];
    if (p2Name.trim()) players.push(p2Name.trim());

    try {
      const res = await fetch('/api/queues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: selectedBranchId,
          sport: selectedSport,
          player_names: players,
          team_name: teamName.trim() || `${p1Name}'s Duo`,
        }),
      });
      if (res.ok) {
        setJoinModalOpen(false);
        setTeamName('');
        setP2Name('');
        fetchQueue();
      }
    } catch (err) {
      console.error('Error joining queue:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveQueue = async (id: string) => {
    try {
      await fetch(`/api/queues/${id}/leave`, { method: 'POST' });
      fetchQueue();
    } catch (err) {
      console.error('Error leaving queue:', err);
    }
  };

  const handleCallNext = async () => {
    try {
      const res = await fetch('/api/queues/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: selectedBranchId,
          sport: selectedSport,
          court_name: `Court ${(Math.floor(Math.random() * 2) + 1)}`,
        }),
      });
      if (res.ok) fetchQueue();
    } catch (err) {
      console.error('Error calling next:', err);
    }
  };

  const activeMatches = queueEntries.filter((q) => q.status === 'on_court');
  const waitingEntries = queueEntries.filter((q) => q.status === 'waiting');

  return (
    <section id="queue-section" className="py-16 bg-[#0b0f17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
              Digital Paddle Rack
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
              Live Court Queueing Board
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Fair, transparent queue rotation for open players. Put your paddle on the board and rotate into action.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchQueue}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-lime-400' : ''}`} />
            </button>

            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-lime-400/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Join Live Queue</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Branch:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:border-lime-400 focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sport:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSelectedSport('badminton')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  selectedSport === 'badminton'
                    ? 'bg-lime-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Badminton
              </button>
              <button
                onClick={() => setSelectedSport('pickleball')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  selectedSport === 'pickleball'
                    ? 'bg-lime-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pickleball
              </button>
            </div>
          </div>

          {/* Marshal / Manager Call Next action */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
            <div className="ml-auto">
              <button
                onClick={handleCallNext}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Marshal: Call Next Up</span>
              </button>
            </div>
          )}
        </div>

        {/* Board View: On Court Matches vs Waiting Paddle Rack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Matches (1 column) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Courts In Play</span>
              <span className="text-lime-400">{activeMatches.length} Matches Live</span>
            </div>

            {activeMatches.map((m) => (
              <div
                key={m.id}
                className="bg-[#111827] border border-lime-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-lime-400">{m.court_assigned || 'Active Court'}</span>
                  <span className="text-[10px] bg-lime-500/20 text-lime-300 font-bold px-2 py-0.5 rounded-full animate-pulse">
                    LIVE PLAY
                  </span>
                </div>
                <div className="text-sm font-bold text-white mb-2">{m.team_name}</div>
                <div className="space-y-1 text-xs text-slate-300">
                  {m.player_names.map((name, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {activeMatches.length === 0 && (
              <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-500">
                No active matches recorded on this sport board right now.
              </div>
            )}
          </div>

          {/* Waiting Paddle Rack (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Waiting Paddle Rack (FIFO Rotation)</span>
              <span>{waitingEntries.length} Squads Waiting</span>
            </div>

            <div className="space-y-3">
              {waitingEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border transition flex items-center justify-between ${
                    entry.position === 1
                      ? 'bg-lime-500/10 border-lime-500/50 shadow-md shadow-lime-500/5'
                      : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Position Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm tabular-nums ${
                        entry.position === 1
                          ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/25'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      #{entry.position}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{entry.team_name}</span>
                        {entry.position === 1 && (
                          <span className="text-[10px] font-bold text-lime-400 uppercase tracking-wider bg-lime-950/80 px-2 py-0.5 rounded border border-lime-500/30">
                            NEXT UP
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Players: {entry.player_names.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="tabular-nums font-semibold text-white">
                          ~{entry.estimated_wait_mins} mins
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">Joined at {entry.joined_at}</div>
                    </div>

                    <button
                      onClick={() => handleLeaveQueue(entry.id)}
                      className="text-xs text-slate-500 hover:text-red-400 p-1.5 transition"
                      title="Leave Queue"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              ))}

              {waitingEntries.length === 0 && (
                <div className="p-12 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-400">
                  Paddle rack is currently empty! Click "Join Live Queue" to be first up for the next available court.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Join Queue */}
        {joinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1 font-heading">
                Join {selectedSport.toUpperCase()} Paddle Queue
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Enter your player or doubles squad details to join the rotation.
              </p>

              <form onSubmit={handleJoinQueue} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Team / Squad Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Smash Masters"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Player 1 Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Player 2 / Partner Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    placeholder="Partner name (for doubles)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setJoinModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !p1Name.trim()}
                    className="px-5 py-2 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition"
                  >
                    {isSubmitting ? 'Joining...' : 'Confirm Paddle Spot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
