import React, { useState, useEffect, useRef } from 'react';
import { Branch, Court, SportType, User, Booking, LiveAvailabilitySummary } from '../types';
import {
  Calendar, Clock, MapPin, ShieldCheck, CheckCircle2, AlertCircle,
  CreditCard, Sparkles, RefreshCw, X, Play, Tag, Radio, Zap, ChevronRight
} from 'lucide-react';

interface LiveBookingSectionProps {
  branches: Branch[];
  currentUser: User | null;
  onBookingSuccess: (booking: Booking) => void;
  preselectedBranchId?: string;
  preselectedSport?: SportType;
}

export const LiveBookingSection: React.FC<LiveBookingSectionProps> = ({
  branches,
  currentUser,
  onBookingSuccess,
  preselectedBranchId,
  preselectedSport,
}) => {
  // Session ID for multi-user collision & hold identification
  const [sessionId] = useState<string>(() => `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  // Filter selections
  const [sport, setSport] = useState<SportType>(preselectedSport || 'badminton');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(preselectedBranchId || branches[0]?.id || 'b-valenzuela');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Matrix and court data
  const [gridData, setGridData] = useState<{ court: Court; slots: any[] }[]>([]);
  const [liveSummary, setLiveSummary] = useState<LiveAvailabilitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Selected slot for reservation (Blue state)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);

  // Active Hold State (Yellow state with countdown)
  const [activeHoldBooking, setActiveHoldBooking] = useState<Booking | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [timeRemainingSecs, setTimeRemainingSecs] = useState<number>(600); // 10 minutes

  // Checkout modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'gcash' | 'maya' | 'card' | 'wallet'>('gcash');
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Alex Rivera');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'alex@smashzone.ph');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '+63 917 555 1234');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmationModalBooking, setConfirmationModalBooking] = useState<Booking | null>(null);

  // Multi-user simulation notice banner
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Real-time EventSource connection
  const sseRef = useRef<EventSource | null>(null);

  const fetchScheduleAndSummary = () => {
    setIsLoading(true);
    fetch(`/api/availability?branch_id=${selectedBranchId}&date=${selectedDate}&sport=${sport}&session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setGridData(data.grid || []);
      })
      .catch((err) => console.error('Error fetching availability:', err))
      .finally(() => setIsLoading(false));

    fetch(`/api/availability/summary?branch_id=${selectedBranchId}&date=${selectedDate}&sport=${sport}`)
      .then((res) => res.json())
      .then((data) => setLiveSummary(data))
      .catch((err) => console.error('Error fetching summary:', err));
  };

  // Connect SSE for Real-Time Synchronization across all users
  useEffect(() => {
    fetchScheduleAndSummary();

    const sseUrl = `/api/realtime/stream?branch_id=${selectedBranchId}&date=${selectedDate}&session_id=${sessionId}`;
    const es = new EventSource(sseUrl);
    sseRef.current = es;

    es.addEventListener('availability_updated', (e) => {
      fetchScheduleAndSummary();
    });

    es.addEventListener('booking_confirmed', (e) => {
      fetchScheduleAndSummary();
    });

    es.addEventListener('booking_expired', (e) => {
      fetchScheduleAndSummary();
    });

    es.addEventListener('booking_pending', (e) => {
      fetchScheduleAndSummary();
    });

    return () => {
      es.close();
    };
  }, [selectedBranchId, selectedDate, sport]);

  // Countdown Timer for Temporary Hold
  useEffect(() => {
    if (!holdExpiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
      setTimeRemainingSecs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleHoldExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const handleHoldExpired = () => {
    setActiveHoldBooking(null);
    setHoldExpiresAt(null);
    setCheckoutModalOpen(false);
    setSelectedSlotTime(null);
    setSelectedCourt(null);
    setSimulationNotice('⚠️ Your 10-minute reservation hold has expired. The court slot is now released for other players.');
    fetchScheduleAndSummary();
    setTimeout(() => setSimulationNotice(null), 5000);
  };

  // User clicks a slot in the real-time grid
  const handleSlotClick = (court: Court, slotItem: any) => {
    // If booked or blocked, do nothing
    if (slotItem.status === 'Booked' || slotItem.status === 'Blocked') {
      return;
    }

    // If awaiting payment by someone else
    if (slotItem.status === 'Awaiting' && !slotItem.is_held_by_me) {
      alert('This court slot is temporarily reserved by another customer awaiting payment. Please select another slot or check back in a few minutes.');
      return;
    }

    // Select this slot (Blue state)
    setSelectedCourt(court);
    setSelectedSlotTime(slotItem.slot);
  };

  // Proceed to a temporary hold (transitions the slot to awaiting payment)
  const handleProceedToHold = async () => {
    if (!selectedCourt || !selectedSlotTime) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 'u-guest',
          user_name: customerName,
          user_email: customerEmail,
          user_phone: customerPhone,
          branch_id: selectedBranchId,
          court_id: selectedCourt.id,
          sport,
          booking_date: selectedDate,
          time_slot: selectedSlotTime,
          duration_hours: 1,
          voucher_code: voucherCode || undefined,
          session_id: sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to hold slot');
        fetchScheduleAndSummary();
      } else {
        setActiveHoldBooking(data.booking);
        setHoldExpiresAt(data.expires_at);
        setTimeRemainingSecs(600);
        setCheckoutModalOpen(true);
        fetchScheduleAndSummary();
      }
    } catch {
      alert('Network error while holding slot');
    } finally {
      setIsLoading(false);
    }
  };

  // Release Hold (User clicks Cancel or leaves checkout)
  const handleCancelHold = async () => {
    if (!activeHoldBooking) return;
    try {
      await fetch(`/api/bookings/${activeHoldBooking.id}/release-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User voluntarily cancelled hold in checkout' }),
      });
      setActiveHoldBooking(null);
      setHoldExpiresAt(null);
      setCheckoutModalOpen(false);
      setSelectedSlotTime(null);
      setSelectedCourt(null);
      fetchScheduleAndSummary();
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Payment (Simulates instant verified payment webhook)
  const handleCompletePayment = async () => {
    if (!activeHoldBooking) return;
    setIsProcessingPayment(true);

    try {
      const res = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: activeHoldBooking.id,
          payment_provider: paymentProvider,
          payment_reference: `PAY-${paymentProvider.toUpperCase()}-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Payment failed');
      } else {
        setCheckoutModalOpen(false);
        setConfirmationModalBooking(data.booking);
        setActiveHoldBooking(null);
        setHoldExpiresAt(null);
        setSelectedSlotTime(null);
        setSelectedCourt(null);
        onBookingSuccess(data.booking);
        fetchScheduleAndSummary();
      }
    } catch {
      alert('Payment processing error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Multi-User Acceptance Test Simulator Actions
  const handleSimulateCustomerBAction = async (action: 'hold' | 'pay' | 'release') => {
    const targetCourt = gridData[0]?.court;
    if (!targetCourt) return;
    const testSlot = '14:00 - 15:00';

    if (action === 'hold') {
      setSimulationNotice(`Simulating Customer B in another browser holding ${targetCourt.court_name} (${testSlot})...`);
      await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'u-customer-b',
          user_name: 'Customer B (External User)',
          user_email: 'customer.b@test.ph',
          user_phone: '+63 999 888 7777',
          branch_id: selectedBranchId,
          court_id: targetCourt.id,
          sport,
          booking_date: selectedDate,
          time_slot: testSlot,
          session_id: 'external-session-b',
        }),
      });
    } else if (action === 'pay') {
      setSimulationNotice(`Simulating Customer B completing payment via GCash webhook...`);
      // Find the booking for Customer B
      const res = await fetch('/api/bookings');
      const all = await res.json();
      const bBooking = all.find((b: any) => b.user_id === 'u-customer-b' && b.status === 'PENDING_PAYMENT');
      if (bBooking) {
        await fetch('/api/payments/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: bBooking.id,
            payment_provider: 'gcash',
            payment_reference: `TXN-GCASH-SIMULATED`,
          }),
        });
      }
    } else {
      setSimulationNotice(`Simulating Customer B timer expiry / release...`);
      const res = await fetch('/api/bookings');
      const all = await res.json();
      const bBooking = all.find((b: any) => b.user_id === 'u-customer-b' && (b.status === 'PENDING_PAYMENT' || b.status === 'CONFIRMED'));
      if (bBooking) {
        await fetch(`/api/bookings/${bBooking.id}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Simulated customer cancellation' }),
        });
      }
    }

    setTimeout(() => setSimulationNotice(null), 4000);
  };

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section id="booking-section" className="py-16 bg-[#0d121c] border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-lime-400" />
              <span>Real-Time Court Reservation</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase font-heading">
              Select Your Court & Time Slot
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Live court reservation with automatic synchronization across all active players.
            </p>
          </div>

          {/* Real-time availability color legend */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-lime-500/20 border border-lime-400 shadow-sm shadow-lime-400/20"></span>
              <span className="text-slate-300 font-medium">Available (Green)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-blue-500 border border-blue-400 shadow-sm shadow-blue-400/30"></span>
              <span className="text-slate-300 font-medium">Selected (Blue)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500/25 border border-amber-400 shadow-sm shadow-amber-400/20"></span>
              <span className="text-slate-300 font-medium">Awaiting Payment (Yellow)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-red-500/20 border border-red-500/40"></span>
              <span className="text-slate-300 font-medium">Booked (Red)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></span>
              <span className="text-slate-300 font-medium">Unavailable (Gray)</span>
            </div>
          </div>
        </div>

        {/* Live Multi-User Synchronization Test Bar */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900/90 border border-lime-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Live Real-Time Sync Engine:
            </span>
            <span className="text-xs text-slate-400">
              Test simultaneous multi-user reservation & payment synchronization:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSimulateCustomerBAction('hold')}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              1. Sim Customer B Hold (Turns Yellow)
            </button>
            <button
              onClick={() => handleSimulateCustomerBAction('pay')}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              2. Sim Customer B Pay (Turns Red)
            </button>
            <button
              onClick={() => handleSimulateCustomerBAction('release')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              3. Sim Release / Cancel
            </button>
          </div>
        </div>

        {simulationNotice && (
          <div className="mb-6 p-3 rounded-lg bg-lime-950/70 border border-lime-500/40 text-lime-300 text-xs font-semibold animate-pulse">
            {simulationNotice}
          </div>
        )}

        {/* Active Hold Banner if current user has a pending hold */}
        {activeHoldBooking && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/70 border border-amber-400/60 flex items-center justify-between gap-4 text-amber-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Temporary Reservation Held (10-Minute Lock)
                </div>
                <div className="text-xs text-amber-100">
                  You are holding <strong>{activeHoldBooking.court_name}</strong> for{' '}
                  <strong>{activeHoldBooking.booking_date} ({activeHoldBooking.time_slot})</strong>.
                  Other customers cannot select this slot.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] text-amber-300 uppercase font-semibold">Payment Countdown</div>
                <div className="text-2xl font-black font-mono tracking-wider tabular-nums text-amber-400">
                  {formatTimer(timeRemainingSecs)}
                </div>
              </div>

              <button
                onClick={() => setCheckoutModalOpen(true)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase rounded-lg shadow-md transition"
              >
                Proceed to Pay
              </button>
              <button
                onClick={handleCancelHold}
                className="text-xs text-amber-300 hover:underline"
              >
                Cancel Hold
              </button>
            </div>
          </div>
        )}

        {/* Controls Bar: Branch, Sport, Date */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Select Branch Location
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 font-semibold focus:border-lime-400 focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          {/* Sport */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Select Sport
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSport('badminton')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  sport === 'badminton'
                    ? 'bg-lime-400 text-slate-950 border-lime-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                Badminton
              </button>
              <button
                type="button"
                onClick={() => setSport('pickleball')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  sport === 'pickleball'
                    ? 'bg-lime-400 text-slate-950 border-lime-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                Pickleball
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Select Booking Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 font-semibold focus:border-lime-400 focus:outline-none"
            />
          </div>
        </div>

        {/* LIVE AVAILABILITY INDICATOR WIDGET */}
        {liveSummary && (
          <div className="mb-8 p-5 bg-[#111827] border border-slate-800 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
                  LIVE COURT AVAILABILITY
                </span>
                <div className="text-sm font-bold text-white mt-0.5">
                  Real-time court capacity on {selectedDate}
                </div>
              </div>

              {/* Aggregated Totals */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-lime-400 font-bold tabular-nums">
                  ● {liveSummary.total_available} Available Hours
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-red-400 font-bold tabular-nums">
                  ● {liveSummary.total_booked} Booked Hours
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-400 font-bold tabular-nums">
                  ● {liveSummary.total_pending_payment} Awaiting Payment Hours
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400 font-bold tabular-nums">
                  ● {liveSummary.total_cancelled} Cancelled
                </span>
              </div>
            </div>

            {/* Per-court breakdown pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {liveSummary.courts_summary.map((cs) => (
                <div key={cs.court_id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[11px] font-bold text-white truncate">{cs.court_name}</div>
                  <div className="text-xs font-black text-lime-400 tabular-nums mt-0.5">
                    {cs.available_hours} Open
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {cs.booked_hours} Booked {cs.pending_hours > 0 ? `· ${cs.pending_hours} Hold` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time court availability matrix */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Real Time Slot Grid</span>
            <span className="text-[11px] text-slate-500">Click any green slot to select</span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Synchronizing real-time availability...
            </div>
          ) : gridData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No courts found for this branch and sport.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <th className="p-3 sticky left-0 bg-slate-900 z-10 min-w-[150px] font-bold">
                      Court
                    </th>
                    {gridData[0]?.slots.map((s) => (
                      <th
                        key={s.slot}
                        className="p-2.5 text-center font-bold tracking-tight whitespace-nowrap min-w-[95px] border-l border-slate-800/60"
                      >
                        {s.slot.split(' - ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {gridData.map(({ court, slots }) => (
                    <tr key={court.id} className="hover:bg-slate-800/30">
                      <td className="p-3 sticky left-0 bg-[#111827] z-10 border-r border-slate-800 font-bold text-white whitespace-nowrap">
                        <div className="text-xs">{court.court_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          ₱{court.hourly_rate}/hr
                        </div>
                      </td>

                      {slots.map((slotItem: any) => {
                        const isSelectedByMe =
                          selectedCourt?.id === court.id && selectedSlotTime === slotItem.slot;
                        const isHeldByMe = slotItem.is_held_by_me;
                        const isAwaiting = slotItem.status === 'Awaiting';
                        const isBooked = slotItem.status === 'Booked';
                        const isBlocked = slotItem.status === 'Blocked';
                        const isAvailable = slotItem.status === 'Available';

                        // Real-time availability colors
                        let cellStyle = 'bg-lime-500/10 border-lime-500/40 text-lime-400 hover:bg-lime-500/20 cursor-pointer';
                        let label = 'AVAILABLE';

                        if (isBlocked) {
                          cellStyle = 'bg-slate-800/60 border-slate-700/40 text-slate-500 cursor-not-allowed';
                          label = 'MAINT';
                        } else if (isBooked) {
                          cellStyle = 'bg-red-500/15 border-red-500/40 text-red-400 cursor-not-allowed';
                          label = 'BOOKED';
                        } else if (isSelectedByMe) {
                          cellStyle = 'bg-blue-600 border-blue-400 text-white font-bold shadow-lg shadow-blue-500/30 cursor-pointer scale-95';
                          label = 'SELECTED';
                        } else if (isAwaiting) {
                          cellStyle = 'bg-amber-500/25 border-amber-400/60 text-amber-300 animate-pulse cursor-not-allowed';
                          label = isHeldByMe ? 'YOUR HOLD' : 'HELD (10m)';
                        }

                        return (
                          <td
                            key={slotItem.slot}
                            onClick={() => handleSlotClick(court, slotItem)}
                            className={`p-2 text-center border-l border-slate-800/60 transition ${cellStyle}`}
                            title={`${court.court_name} · ${slotItem.slot} (${label})`}
                          >
                            <div className="text-[10px] font-bold tracking-wider">{label}</div>
                            <div className="text-[9px] opacity-80 tabular-nums">
                              {isAvailable || isSelectedByMe ? `₱${court.hourly_rate}` : slotItem.detail || '-'}
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

          {/* Action Bar when a slot is Selected (Blue) */}
          {selectedCourt && selectedSlotTime && !activeHoldBooking && (
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-400">Selected Court & Slot</span>
                <div className="text-sm font-bold text-white">
                  {selectedCourt.court_name} · <span className="tabular-nums">{selectedDate} ({selectedSlotTime})</span>
                </div>
                <div className="text-xs text-slate-400">
                  Rate: ₱{selectedCourt.hourly_rate} / hr · Total: <strong>₱{selectedCourt.hourly_rate}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedCourt(null);
                    setSelectedSlotTime(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Deselect
                </button>
                <button
                  onClick={handleProceedToHold}
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime-400/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Proceed to Payment (10m Hold)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHECKOUT & PAYMENT MODAL (Step 8 & 9) */}
        {checkoutModalOpen && activeHoldBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
              <button
                onClick={handleCancelHold}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                title="Cancel hold and release court"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-500/30">
                  SLOT HELD · AWAITING PAYMENT
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                  ⏱️ {formatTimer(timeRemainingSecs)} left
                </span>
              </div>

              <h3 className="text-xl font-bold text-white font-heading">
                Confirm & Pay Reservation
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Your court slot is locked. Complete payment before the timer expires to permanently secure your booking.
              </p>

              {/* Booking Summary Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Court:</span>
                  <span className="font-bold text-white">{activeHoldBooking.court_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Schedule:</span>
                  <span className="font-bold text-white tabular-nums">
                    {activeHoldBooking.booking_date} · {activeHoldBooking.time_slot}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{customerName} ({customerPhone})</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
                  <span>Amount to Pay:</span>
                  <span className="text-lime-400 font-heading tabular-nums text-lg">
                    ₱{activeHoldBooking.total_amount}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  Select Payment Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'gcash', label: 'GCash e-Wallet', desc: 'Scan QR or Mobile' },
                    { id: 'maya', label: 'Maya Wallet', desc: 'Instant QR / Card' },
                    { id: 'card', label: 'Credit / Debit Card', desc: 'Visa / Mastercard' },
                    { id: 'wallet', label: 'SmashZone Wallet', desc: 'Account Credits' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaymentProvider(p.id as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        paymentProvider === p.id
                          ? 'bg-lime-500/15 border-lime-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{p.label}</div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Actions */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={isProcessingPayment}
                  className="w-full py-3 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime-400/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isProcessingPayment
                      ? 'Verifying Server Webhook...'
                      : `Pay ₱${activeHoldBooking.total_amount} via ${paymentProvider.toUpperCase()} (Sandbox)`}
                  </span>
                </button>

                <div className="text-[10px] text-center text-slate-500">
                  🔒 Server-side webhook verified. Payments are processed idempotently with strict double-booking locks.
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleCancelHold}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Release Slot and Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING CONFIRMED MODAL */}
        {confirmationModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-lime-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center mx-auto border border-lime-400/50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
                  Payment Verified · Booking Confirmed
                </span>
                <h3 className="text-2xl font-black text-white font-heading mt-1">
                  Court Reserved Successfully!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your payment has been verified by the server webhook. The slot is now marked as BOOKED (Red) across all customer screens.
                </p>
              </div>

              {/* Reference Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-2">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Booking Reference</div>
                <div className="text-xl font-black text-lime-400 font-mono">
                  {confirmationModalBooking.reference_no}
                </div>
                <div className="pt-2 border-t border-slate-800 text-slate-300 space-y-1">
                  <div>Court: <strong>{confirmationModalBooking.court_name}</strong></div>
                  <div>Schedule: <strong>{confirmationModalBooking.booking_date} ({confirmationModalBooking.time_slot})</strong></div>
                  <div>Payment Status: <strong className="text-lime-400">PAID ({confirmationModalBooking.payment_method})</strong></div>
                </div>
              </div>

              <button
                onClick={() => setConfirmationModalBooking(null)}
                className="w-full py-2.5 bg-lime-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Close & Return to Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
