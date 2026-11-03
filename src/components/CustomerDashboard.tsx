import React, { useState, useEffect } from 'react';
import { User, Booking, PlaySession } from '../types';
import { Calendar, Clock, CreditCard, Tag, UserCheck, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, X, ArrowLeft, RefreshCw, Wallet } from 'lucide-react';

interface CustomerDashboardProps {
  currentUser: User;
  onBackToHome: () => void;
  onBookNewCourt: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  onBackToHome,
  onBookNewCourt,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'wallet' | 'sessions' | 'profile'>('overview');
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(currentUser.wallet_balance || 1850);

  // Reschedule Modal
  const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newSlot, setNewSlot] = useState<string>('19:00 - 20:00');
  const [actionMessage, setActionMessage] = useState<string>('');

  // Profile fields
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);
  const [newPassword, setNewPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const fetchUserBookings = () => {
    setIsLoading(true);
    fetch(`/api/bookings?user_id=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => setUserBookings(data))
      .catch((err) => console.error('Error fetching user bookings:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUserBookings();

    const es = new EventSource('/api/realtime/stream');
    es.addEventListener('booking_confirmed', () => fetchUserBookings());
    es.addEventListener('payment_completed', () => fetchUserBookings());
    es.addEventListener('booking_cancelled', () => fetchUserBookings());
    es.addEventListener('booking_expired', () => fetchUserBookings());

    return () => {
      es.close();
    };
  }, [currentUser.id]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The full amount will be credited back to your SmashZone Wallet.')) {
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Player requested cancellation from dashboard' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('✅ Booking cancelled and refunded to wallet.');
        fetchUserBookings();
        setWalletBalance((prev) => prev + 500);
        setTimeout(() => setActionMessage(''), 4000);
      } else {
        setActionMessage(`❌ ${data.error}`);
      }
    } catch {
      setActionMessage('❌ Failed to cancel booking');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBookingTarget || !newDate || !newSlot) return;

    try {
      const res = await fetch(`/api/bookings/${rescheduleBookingTarget.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_date: newDate, new_time_slot: newSlot }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('✅ Booking successfully rescheduled to ' + newDate + ' ' + newSlot);
        setRescheduleBookingTarget(null);
        fetchUserBookings();
        setTimeout(() => setActionMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to reschedule');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleTopUpWallet = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    setActionMessage(`✅ Added ₱${amount.toLocaleString()} to your SmashZone Wallet.`);
    setTimeout(() => setActionMessage(''), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const upcomingBookings = userBookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT');
  const pastBookings = userBookings.filter((b) => b.status !== 'CONFIRMED' && b.status !== 'PENDING_PAYMENT');

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-lime-400 font-bold uppercase tracking-wider">
                Customer Portal
              </div>
              <h1 className="text-2xl font-black text-white font-heading">
                Welcome back, {currentUser.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-lime-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Wallet Balance</div>
                <div className="text-lg font-black text-white tabular-nums">
                  ₱{walletBalance.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={onBookNewCourt}
              className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-lime-400/20 transition cursor-pointer"
            >
              + Book Court
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-lime-500/40 text-lime-300 text-xs font-semibold">
            {actionMessage}
          </div>
        )}

        {/* Dashboard Layout: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="space-y-1">
            <div className="p-4 bg-[#111827] border border-slate-800 rounded-2xl mb-4">
              <div className="text-xs font-bold text-white">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">Membership:</span>
                <span className="text-lime-400 font-bold">{currentUser.membership_tier} Tier</span>
              </div>
            </div>

            {[
              { id: 'overview', label: 'Account Overview', icon: UserCheck },
              { id: 'bookings', label: 'Court Reservations', icon: Calendar },
              { id: 'wallet', label: 'Wallet & Vouchers', icon: CreditCard },
              { id: 'profile', label: 'Profile & Security', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-lime-400 text-slate-950 font-bold shadow-md shadow-lime-400/10'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
                    <div className="text-xs text-slate-400">Upcoming Games</div>
                    <div className="text-2xl font-black text-white mt-1 tabular-nums font-heading">
                      {upcomingBookings.length}
                    </div>
                    <div className="text-[11px] text-lime-400 mt-1">Confirmed slots</div>
                  </div>

                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
                    <div className="text-xs text-slate-400">Total Hours Played</div>
                    <div className="text-2xl font-black text-white mt-1 tabular-nums font-heading">
                      18 hrs
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Lifetime court time</div>
                  </div>

                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
                    <div className="text-xs text-slate-400">Available Credits</div>
                    <div className="text-2xl font-black text-lime-400 mt-1 tabular-nums font-heading">
                      ₱{walletBalance.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Instant checkout ready</div>
                  </div>
                </div>

                {/* Next Upcoming Booking Alert */}
                <div className="bg-[#111827] border border-lime-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-2">
                    Next Scheduled Match
                  </div>
                  {upcomingBookings.length > 0 ? (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {upcomingBookings[0].court_name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                        <div>
                          Branch: <strong className="text-white">{upcomingBookings[0].branch_name}</strong>
                        </div>
                        <div>
                          Date: <strong className="text-white tabular-nums">{upcomingBookings[0].booking_date}</strong>
                        </div>
                        <div>
                          Slot: <strong className="text-white tabular-nums">{upcomingBookings[0].time_slot}</strong>
                        </div>
                        <div>
                          Ref: <strong className="text-lime-400 font-mono">{upcomingBookings[0].reference_no}</strong>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
                        <button
                          onClick={() => {
                            setRescheduleBookingTarget(upcomingBookings[0]);
                            setNewDate(upcomingBookings[0].booking_date);
                          }}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200"
                        >
                          Reschedule Slot
                        </button>
                        <button
                          onClick={() => handleCancelBooking(upcomingBookings[0].id)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-xs text-slate-400">
                      You have no upcoming court bookings right now. Click "+ Book Court" above to lock in your next rally.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: BOOKINGS */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 font-heading">
                    Upcoming Court Reservations
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Active reservations awaiting your arrival.
                  </p>

                  <div className="space-y-3">
                    {upcomingBookings.map((b) => (
                      <div
                        key={b.id}
                        className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white">{b.court_name}</span>
                            <span className="text-[10px] font-bold uppercase bg-lime-500/20 text-lime-400 px-2 py-0.5 rounded">
                              {b.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {b.branch_name} · <span className="tabular-nums font-semibold text-white">{b.booking_date}</span> ({b.time_slot})
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-1">
                            Ref: {b.reference_no} · Total: ₱{b.total_amount} ({b.payment_method})
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setRescheduleBookingTarget(b);
                              setNewDate(b.booking_date);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-xs font-semibold rounded-lg text-red-300 border border-red-500/30 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}

                    {upcomingBookings.length === 0 && (
                      <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-400">
                        No active upcoming bookings.
                      </div>
                    )}
                  </div>
                </div>

                {/* Past Bookings */}
                <div className="pt-6 border-t border-slate-800">
                  <h3 className="text-base font-bold text-white mb-3 font-heading">
                    Booking History & Cancelled Slots
                  </h3>
                  <div className="space-y-3">
                    {pastBookings.map((b) => (
                      <div
                        key={b.id}
                        className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between opacity-80"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-300">
                            {b.court_name} · {b.branch_name}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {b.booking_date} ({b.time_slot}) · Ref: {b.reference_no}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              b.status === 'CANCELLED'
                                ? 'bg-red-500/20 text-red-400'
                                : b.status === 'EXPIRED'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {b.status}
                          </span>
                          <div className="text-xs font-bold text-slate-400 mt-1 tabular-nums">
                            ₱{b.total_amount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: WALLET & VOUCHERS */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-1 font-heading">
                    SmashZone Athlete Wallet
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Preload funds for 1-click court reservations and zero checkout friction.
                  </p>

                  <div className="flex items-center justify-between p-5 rounded-xl bg-slate-900 border border-slate-800 mb-6">
                    <div>
                      <div className="text-xs text-slate-400">Available Credits</div>
                      <div className="text-3xl font-black text-lime-400 tabular-nums font-heading mt-1">
                        ₱{walletBalance.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTopUpWallet(500)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg border border-slate-700"
                      >
                        + ₱500
                      </button>
                      <button
                        onClick={() => handleTopUpWallet(1000)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg border border-slate-700"
                      >
                        + ₱1,000
                      </button>
                      <button
                        onClick={() => handleTopUpWallet(2000)}
                        className="px-3.5 py-2 bg-lime-400 hover:bg-lime-300 text-xs font-bold text-slate-950 rounded-lg shadow-sm"
                      >
                        + ₱2,000
                      </button>
                    </div>
                  </div>

                  {/* Active Vouchers list */}
                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Active Promo Vouchers You Can Use
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { code: 'SMASHWELCOME', desc: '15% Off First Booking', tag: 'Welcome Bonus' },
                        { code: 'PICKLE20', desc: '20% Off Pickleball Courts', tag: 'Pickleball Special' },
                        { code: 'RACKET10', desc: '10% Off Any Session', tag: 'Community Pass' },
                      ].map((v) => (
                        <div
                          key={v.code}
                          className="p-3.5 rounded-xl bg-slate-900/90 border border-dashed border-slate-700 flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-lime-400 uppercase bg-lime-950/80 px-2 py-0.5 rounded border border-lime-500/30">
                              {v.tag}
                            </span>
                            <div className="text-sm font-black font-mono text-white mt-2">
                              {v.code}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">{v.desc}</div>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(v.code);
                              alert(`Copied voucher code ${v.code} to clipboard!`);
                            }}
                            className="mt-3 text-[11px] text-lime-400 hover:underline font-bold text-left"
                          >
                            Copy Code
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROFILE & SECURITY */}
            {activeTab === 'profile' && (
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-1 font-heading">
                  Profile & Security Settings
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Manage your personal contact info and security credentials.
                </p>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Change Password
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs rounded-lg transition"
                    >
                      {profileSaved ? 'Saved Changes!' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Reschedule */}
        {rescheduleBookingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1 font-heading">
                Reschedule Booking: {rescheduleBookingTarget.reference_no}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Current: {rescheduleBookingTarget.booking_date} ({rescheduleBookingTarget.time_slot})
              </p>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Select New Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Select New Time Slot
                  </label>
                  <select
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                  >
                    <option value="08:00 - 09:00">08:00 - 09:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="14:00 - 15:00">14:00 - 15:00</option>
                    <option value="17:00 - 18:00">17:00 - 18:00</option>
                    <option value="19:00 - 20:00">19:00 - 20:00</option>
                    <option value="20:00 - 21:00">20:00 - 21:00</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRescheduleBookingTarget(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs rounded-lg transition"
                  >
                    Confirm Reschedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
