import React, { useState, useEffect } from 'react';
import { PlaySession, SportType, Branch, User } from '../types';
import { Users, Clock, MapPin, Share2, Check, UserPlus, Trophy, Sparkles } from 'lucide-react';

interface CommunityLobbyProps {
  branches: Branch[];
  currentUser: User | null;
  onSessionJoined: (session: PlaySession) => void;
}

export const CommunityLobby: React.FC<CommunityLobbyProps> = ({
  branches,
  currentUser,
  onSessionJoined,
}) => {
  const [sessions, setSessions] = useState<PlaySession[]>([]);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [joinMsg, setJoinMsg] = useState<{ id: string; text: string; isError?: boolean } | null>(null);

  const fetchSessions = () => {
    let url = `/api/sessions?sport=${sportFilter}`;
    if (branchFilter) url += `&branch_id=${branchFilter}`;
    if (typeFilter) url += `&type=${typeFilter}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setSessions(data))
      .catch((err) => console.error('Error fetching sessions:', err));
  };

  useEffect(() => {
    fetchSessions();
  }, [sportFilter, branchFilter, typeFilter]);

  const handleCopyLink = (sessionId: string) => {
    const inviteUrl = `${window.location.origin}#lobby-session-${sessionId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedSessionId(sessionId);
    setTimeout(() => setCopiedSessionId(null), 2500);
  };

  const handleJoinSession = async (session: PlaySession) => {
    setJoiningSessionId(session.id);
    setJoinMsg(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 'u-guest',
          user_name: currentUser?.name || 'SmashZone Player',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinMsg({ id: session.id, text: data.error || 'Failed to join session', isError: true });
      } else {
        setJoinMsg({ id: session.id, text: 'Successfully joined session! See you on court!' });
        onSessionJoined(data.session);
        fetchSessions();
      }
    } catch {
      setJoinMsg({ id: session.id, text: 'Network error. Please try again.', isError: true });
    } finally {
      setJoiningSessionId(null);
    }
  };

  return (
    <section id="lobby-section" className="py-16 bg-[#0d121c] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
              Social Play & Matchmaking
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-heading">
              Community Member Lobby
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Drop in, make new racket sport friends, and join Open Play and Unli Play sessions.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:border-lime-400 focus:outline-none"
            >
              <option value="all">All Sports</option>
              <option value="badminton">Badminton</option>
              <option value="pickleball">Pickleball</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:border-lime-400 focus:outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:border-lime-400 focus:outline-none"
            >
              <option value="">All Formats</option>
              <option value="open_play">Open Play</option>
              <option value="unli_play">Unli Play Pass</option>
            </select>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const isFull = session.current_participants >= session.max_participants;
            const progress = (session.current_participants / session.max_participants) * 100;

            return (
              <div
                key={session.id}
                className="bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                {/* Format Tag & Status */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-lime-400">
                      {session.session_type === 'open_play' ? 'Open Play' : 'Unli Play Pass'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFull
                          ? 'bg-red-500/20 text-red-400'
                          : session.status === 'Ongoing'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-lime-500/20 text-lime-400'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                    {session.title}
                  </h3>

                  {/* Metadata Row */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{session.branch_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="tabular-nums">
                        {session.date} · {session.start_time} - {session.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Host: {session.host_name} · <strong className="text-slate-300">{session.skill_level}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Attendees Progress Bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Participants</span>
                      <span className="font-semibold text-white tabular-nums">
                        {session.current_participants} / {session.max_participants} Joined
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-red-400' : 'bg-lime-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Price */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Entrance Fee</div>
                    <div className="text-lg font-black text-white tabular-nums">
                      ₱{session.fee_per_head} <span className="text-[10px] font-normal text-slate-400">/ head</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(session.id)}
                      title="Copy invitation link"
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    >
                      {copiedSessionId === session.id ? (
                        <Check className="w-4 h-4 text-lime-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleJoinSession(session)}
                      disabled={isFull || joiningSessionId === session.id}
                      className="px-4 py-2 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isFull ? 'Full' : joiningSessionId === session.id ? 'Joining...' : 'Join Session'}</span>
                    </button>
                  </div>
                </div>

                {joinMsg?.id === session.id && (
                  <div
                    className={`mt-2 text-[11px] p-2 rounded text-center font-medium ${
                      joinMsg.isError ? 'bg-red-950/60 text-red-300' : 'bg-lime-950/60 text-lime-300'
                    }`}
                  >
                    {joinMsg.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
