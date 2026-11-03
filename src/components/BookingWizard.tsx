import React, { useState, useEffect } from 'react';
import { SportType, Branch, Court, Booking, User } from '../types';
import { Calendar, Clock, MapPin, Tag, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';

interface BookingWizardProps {
  branches: Branch[];
  currentUser: User | null;
  onBookingSuccess: (booking: Booking) => void;
  preselectedBranchId?: string;
  preselectedSport?: SportType;
  preselectedSlot?: { courtId: string; date: string; slot: string };
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  branches,
  currentUser,
  onBookingSuccess,
  preselectedBranchId,
  preselectedSport,
  preselectedSlot,
}) => {
  const [step, setStep] = useState<number>(1);
  const [sport, setSport] = useState<SportType>(preselectedSport || 'badminton');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(preselectedBranchId || branches[0]?.id || 'b-valenzuela');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; status: string; detail: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(1);

  // Customer info & equipment
  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState<string>(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '+63 9');
  const [equipmentAddons, setEquipmentAddons] = useState<{ rackets: number; shuttlecocks: number }>({ rackets: 0, shuttlecocks: 0 });
  const [notes, setNotes] = useState<string>('');

  // Voucher
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [voucherMessage, setVoucherMessage] = useState<string>('');
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Sync user if changed
  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name);
      if (!customerEmail) setCustomerEmail(currentUser.email);
      if (currentUser.phone && customerPhone === '+63 9') setCustomerPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Load courts for branch & sport
  useEffect(() => {
    if (!selectedBranchId) return;
    fetch(`/api/courts?branch_id=${selectedBranchId}&sport=${sport}`)
      .then((res) => res.json())
      .then((data: Court[]) => {
        setCourts(data);
        if (data.length > 0) {
          if (preselectedSlot?.courtId) {
            const found = data.find((c) => c.id === preselectedSlot.courtId);
            setSelectedCourt(found || data[0]);
          } else {
            setSelectedCourt(data[0]);
          }
        }
      })
      .catch((err) => console.error('Error fetching courts:', err));
  }, [selectedBranchId, sport]);

  // Load availability slots for selected court & date
  useEffect(() => {
    if (!selectedBranchId || !selectedCourt) return;
    fetch(`/api/availability?branch_id=${selectedBranchId}&date=${selectedDate}&sport=${sport}`)
      .then((res) => res.json())
      .then((data) => {
        const courtData = data.grid?.find((g: any) => g.court.id === selectedCourt.id);
        if (courtData) {
          setAvailableSlots(courtData.slots);
          if (preselectedSlot?.slot) {
            setSelectedSlot(preselectedSlot.slot);
          }
        }
      })
      .catch((err) => console.error('Error loading slots:', err));
  }, [selectedCourt, selectedDate, selectedBranchId, sport]);

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Pricing calculations
  const hourlyRate = selectedCourt?.hourly_rate || (sport === 'badminton' ? activeBranch?.badminton_rate : activeBranch?.pickleball_rate) || 500;
  const courtFee = hourlyRate * durationHours;
  const equipmentFee = equipmentAddons.rackets * 100 + equipmentAddons.shuttlecocks * 350;
  const subtotal = courtFee + equipmentFee;
  const totalAmount = Math.max(0, subtotal - voucherDiscount);

  // Apply Voucher
  const handleVerifyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsVerifyingVoucher(true);
    setVoucherMessage('');
    try {
      const res = await fetch('/api/vouchers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim(), amount: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoucherMessage(`❌ ${data.error || 'Invalid code'}`);
        setVoucherDiscount(0);
      } else {
        setVoucherDiscount(data.discount_calculated);
        setVoucherMessage(`✅ Applied: ${data.description} (-₱${data.discount_calculated})`);
      }
    } catch {
      setVoucherMessage('❌ Failed to verify code');
    } finally {
      setIsVerifyingVoucher(false);
    }
  };

  // Submit Booking
  const handleConfirmReservation = async () => {
    if (!selectedCourt || !selectedSlot) {
      setErrorMsg('Please select a court and time slot.');
      return;
    }
    if (!customerName || !customerEmail || !customerPhone) {
      setErrorMsg('Please complete all contact details.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/bookings', {
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
          time_slot: selectedSlot,
          duration_hours: durationHours,
          equipment_addons: equipmentFee,
          voucher_code: voucherDiscount > 0 ? voucherCode : undefined,
          payment_method: 'GCash / Credit Card Online',
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Reservation failed. Slot may have been reserved.');
      } else {
        setConfirmedBooking(data);
        onBookingSuccess(data);
        setStep(8);
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset booking form
  const handleReset = () => {
    setConfirmedBooking(null);
    setSelectedSlot('');
    setVoucherCode('');
    setVoucherDiscount(0);
    setVoucherMessage('');
    setStep(1);
  };

  return (
    <section id="booking-section" className="py-16 bg-[#0d121c] border-y border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
            Real-Time Reservation Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase font-heading">
            Book Your Sports Court
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Guaranteed slot locking with instant reference generation. No double bookings.
          </p>
        </div>

        {/* Progress Tracker (Steps 1 to 8) */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2 overflow-x-auto pb-2">
            {[
              '1. Sport',
              '2. Branch',
              '3. Date',
              '4. Court',
              '5. Slot',
              '6. Details',
              '7. Summary',
              '8. Confirmed',
            ].map((label, idx) => (
              <div
                key={label}
                className={`whitespace-nowrap px-2 py-1 rounded text-center transition ${
                  step === idx + 1
                    ? 'text-lime-400 font-bold bg-lime-500/10'
                    : step > idx + 1
                    ? 'text-slate-300'
                    : 'text-slate-600'
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-lime-400 h-full transition-all duration-300"
              style={{ width: `${(step / 8) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* STEP 1: Select Sport */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white font-heading">Step 1: Choose Your Sport</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSport('badminton')}
                  className={`p-6 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    sport === 'badminton'
                      ? 'bg-lime-500/15 border-lime-400 text-white shadow-lg shadow-lime-400/10'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold">Badminton</span>
                      {sport === 'badminton' && <CheckCircle2 className="w-5 h-5 text-lime-400" />}
                    </div>
                    <p className="text-xs text-slate-400">
                      High-impact BWF tournament Taraflex and Cushion Pro courts. Single & doubles line markings with anti-glare overhead lighting.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-lime-400 font-semibold">
                    From ₱500 / hr
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSport('pickleball')}
                  className={`p-6 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    sport === 'pickleball'
                      ? 'bg-lime-500/15 border-lime-400 text-white shadow-lg shadow-lime-400/10'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold">Pickleball</span>
                      {sport === 'pickleball' && <CheckCircle2 className="w-5 h-5 text-lime-400" />}
                    </div>
                    <p className="text-xs text-slate-400">
                      Standard regulation outdoor and indoor courts with high-grip textured Acrytech surfaces. Regulation net heights and kitchen lines.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-lime-400 font-semibold">
                    From ₱650 / hr
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-sm rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Select Branch</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Branch */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white font-heading">Step 2: Select Facility Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`p-5 rounded-xl border text-left transition cursor-pointer ${
                      selectedBranchId === b.id
                        ? 'bg-lime-500/15 border-lime-400 text-white shadow-lg shadow-lime-400/10'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-base">{b.name}</div>
                      {selectedBranchId === b.id && <CheckCircle2 className="w-5 h-5 text-lime-400" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{b.city}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                      <span className="text-slate-400">{b.total_courts} Total Courts</span>
                      <span className="text-lime-400 font-semibold">
                        ₱{sport === 'badminton' ? b.badminton_rate : b.pickleball_rate} / hr
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2 text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-sm rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Pick Date</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Date */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white font-heading">Step 3: Select Booking Date</h3>

              {/* Quick Date Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Today', date: new Date().toISOString().split('T')[0] },
                  { label: 'Tomorrow', date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
                  { label: 'Day After', date: new Date(Date.now() + 172800000).toISOString().split('T')[0] },
                  { label: 'In 3 Days', date: new Date(Date.now() + 259200000).toISOString().split('T')[0] },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSelectedDate(item.date)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      selectedDate === item.date
                        ? 'bg-lime-400 text-slate-950 border-lime-400 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {item.label} ({item.date.slice(5)})
                  </button>
                ))}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                  Or Choose Specific Date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2 text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-sm rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Select Court</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Select Court */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white font-heading">
                Step 4: Select Court at {activeBranch.name}
              </h3>
              <p className="text-xs text-slate-400">
                All courts feature anti-glare lighting and tournament shock-absorption flooring.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courts.map((court) => (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setSelectedCourt(court)}
                    disabled={!court.is_active}
                    className={`p-5 rounded-xl border text-left transition cursor-pointer ${
                      !court.is_active
                        ? 'opacity-40 bg-slate-950 border-slate-800 cursor-not-allowed'
                        : selectedCourt?.id === court.id
                        ? 'bg-lime-500/15 border-lime-400 text-white shadow-lg shadow-lime-400/10'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-base">{court.court_name}</div>
                      {selectedCourt?.id === court.id && <CheckCircle2 className="w-5 h-5 text-lime-400" />}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Surface: {court.surface}</div>
                    <div className="text-xs text-slate-400">Lighting: {court.lighting}</div>
                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                      <span className={court.is_active ? 'text-lime-400' : 'text-red-400'}>
                        {court.is_active ? 'Active & Ready' : 'Maintenance'}
                      </span>
                      <span className="font-bold text-white tabular-nums">₱{court.hourly_rate}/hr</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2 text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(5)}
                  disabled={!selectedCourt}
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Select Time Slot</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Select Available Time Slot */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">
                    Step 5: Available Time Slots
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedCourt?.court_name} · {selectedDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Duration: </span>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1 font-semibold"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {availableSlots.map((item) => {
                  const isAvailable = item.status === 'Available';
                  const isSelected = selectedSlot === item.slot;

                  return (
                    <button
                      key={item.slot}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(item.slot)}
                      className={`p-3 rounded-lg border text-center transition cursor-pointer text-xs font-semibold ${
                        !isAvailable
                          ? 'bg-slate-950/60 border-slate-800 text-slate-500 cursor-not-allowed'
                          : isSelected
                          ? 'bg-lime-400 text-slate-950 border-lime-400 font-bold shadow-md shadow-lime-400/20'
                          : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-lime-500/50'
                      }`}
                    >
                      <div className="tabular-nums">{item.slot}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          !isAvailable
                            ? 'text-red-400'
                            : isSelected
                            ? 'text-slate-900'
                            : 'text-lime-400'
                        }`}
                      >
                        {isAvailable ? 'Available' : item.status}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(4)}
                  className="px-5 py-2 text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(6)}
                  disabled={!selectedSlot}
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Customer Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Customer Details & Addons */}
          {step === 6 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white font-heading">Step 6: Customer & Equipment Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-lime-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-lime-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+63 917 000 0000"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-lime-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Equipment Addons */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                  <ShoppingBag className="w-4 h-4 text-lime-400" />
                  <span>Pro Equipment Add-ons (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {sport === 'badminton' ? 'Yonex Demo Rackets' : 'Carbon Pickleball Paddles'}
                      </div>
                      <div className="text-[11px] text-slate-400">₱100 / piece per session</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEquipmentAddons((prev) => ({
                            ...prev,
                            rackets: Math.max(0, prev.rackets - 1),
                          }))
                        }
                        className="w-7 h-7 bg-slate-800 rounded text-slate-300 font-bold hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-white w-5 text-center">
                        {equipmentAddons.rackets}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEquipmentAddons((prev) => ({
                            ...prev,
                            rackets: prev.rackets + 1,
                          }))
                        }
                        className="w-7 h-7 bg-slate-800 rounded text-slate-300 font-bold hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {sport === 'badminton' ? 'Feather Shuttlecocks Tube (12 pcs)' : 'Franklin X-40 Balls (3 pcs)'}
                      </div>
                      <div className="text-[11px] text-slate-400">₱350 / tube</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEquipmentAddons((prev) => ({
                            ...prev,
                            shuttlecocks: Math.max(0, prev.shuttlecocks - 1),
                          }))
                        }
                        className="w-7 h-7 bg-slate-800 rounded text-slate-300 font-bold hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-white w-5 text-center">
                        {equipmentAddons.shuttlecocks}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEquipmentAddons((prev) => ({
                            ...prev,
                            shuttlecocks: prev.shuttlecocks + 1,
                          }))
                        }
                        className="w-7 h-7 bg-slate-800 rounded text-slate-300 font-bold hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Special Notes / Group Name (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Mixed doubles scrimmage, need restringing pickup"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-lime-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(5)}
                  className="px-5 py-2 text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(7)}
                  disabled={!customerName || !customerEmail || !customerPhone}
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Review Summary</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Review Booking Summary */}
          {step === 7 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white font-heading">Step 7: Review & Confirm Reservation</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-lime-400 border-b border-slate-800 pb-2">
                    Reservation Details
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="text-slate-500">Sport:</span>
                    <span className="font-semibold uppercase">{sport}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="text-slate-500">Facility Branch:</span>
                    <span className="font-semibold">{activeBranch.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="text-slate-500">Selected Court:</span>
                    <span className="font-semibold">{selectedCourt?.court_name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="text-slate-500">Date & Slot:</span>
                    <span className="font-semibold tabular-nums">
                      {selectedDate} · {selectedSlot} ({durationHours}h)
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="text-slate-500">Primary Player:</span>
                    <span className="font-semibold">{customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="text-slate-500">Contact:</span>
                    <span className="font-semibold">{customerPhone}</span>
                  </div>
                </div>

                {/* Price Ledger & Voucher */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-lime-400 border-b border-slate-800 pb-2">
                    Payment Breakdown
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Court Fee ({durationHours}h @ ₱{hourlyRate}/h):</span>
                    <span className="font-bold tabular-nums">₱{courtFee}</span>
                  </div>
                  {equipmentFee > 0 && (
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Equipment Rental:</span>
                      <span className="font-bold tabular-nums">₱{equipmentFee}</span>
                    </div>
                  )}

                  {/* Voucher Input */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Promo Voucher Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SMASHWELCOME, PICKLE20"
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white uppercase focus:border-lime-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyVoucher}
                        disabled={isVerifyingVoucher}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-lime-400 font-bold rounded border border-slate-700 transition"
                      >
                        {isVerifyingVoucher ? 'Verifying...' : 'Apply'}
                      </button>
                    </div>
                    {voucherMessage && (
                      <div className="text-[11px] mt-1 text-slate-300">{voucherMessage}</div>
                    )}
                  </div>

                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-xs text-lime-400 font-semibold">
                      <span>Voucher Discount:</span>
                      <span className="tabular-nums">-₱{voucherDiscount}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Total Amount:</span>
                    <span className="text-2xl font-black text-lime-400 tabular-nums font-heading">
                      ₱{totalAmount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(6)}
                  className="px-5 py-2 text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleConfirmReservation}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-extrabold text-sm uppercase tracking-wide rounded-xl shadow-xl shadow-lime-400/25 flex items-center gap-2 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Confirming...' : 'Confirm Reservation'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: Booking Confirmed */}
          {step === 8 && confirmedBooking && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-lime-400/20 text-lime-400 rounded-full flex items-center justify-center mx-auto border border-lime-400/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
                  Reservation Confirmed
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
                  Your Court is Reserved!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  A confirmation SMS & email have been queued. Present your reference number upon court entry.
                </p>
              </div>

              {/* Reference Ticket Card */}
              <div className="max-w-md mx-auto bg-slate-900 border border-lime-500/30 rounded-2xl p-6 text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-lime-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg">
                  CONFIRMED
                </div>
                <div className="text-xs text-slate-400">Booking Reference Number</div>
                <div className="text-2xl font-black text-white tracking-wider tabular-nums font-mono mt-0.5 text-lime-400">
                  {confirmedBooking.reference_no}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Court:</span>
                    <span className="font-semibold text-white">{confirmedBooking.court_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branch:</span>
                    <span className="font-semibold text-white">{confirmedBooking.branch_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Schedule:</span>
                    <span className="font-semibold text-white tabular-nums">
                      {confirmedBooking.booking_date} · {confirmedBooking.time_slot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guest:</span>
                    <span className="font-semibold text-white">{confirmedBooking.user_name}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                    <span className="text-white">Amount Paid:</span>
                    <span className="text-lime-400 tabular-nums">₱{confirmedBooking.total_amount}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg border border-slate-700 transition cursor-pointer"
                >
                  Book Another Court
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('availability-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Check Live Availability Grid
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
