/**
 * SmashZone Normalized Relational Store & Concurrency Engine
 * Real-time court booking, temporary holds, and payment synchronization.
 */

export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'coach' | 'manager' | 'admin';
  wallet_balance: number;
  membership_tier: 'Free' | 'Silver' | 'Gold';
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  opening_hours: string;
  badminton_rate: number;
  pickleball_rate: number;
  total_courts: number;
  image_url: string;
  amenities: string[];
}

export interface Court {
  id: string;
  branch_id: string;
  court_number: number;
  court_name: string;
  sport: 'badminton' | 'pickleball';
  surface: string;
  lighting: string;
  hourly_rate: number;
  is_active: boolean;
}

export interface Booking {
  id: string;
  reference_no: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  branch_id: string;
  branch_name: string;
  court_id: string;
  court_name: string;
  sport: 'badminton' | 'pickleball';
  booking_date: string; // YYYY-MM-DD
  time_slot: string; // e.g. "14:00 - 15:00"
  duration_hours: number;
  court_fee: number;
  equipment_fee: number;
  discount_amount: number;
  total_amount: number;
  voucher_code?: string;
  payment_method: string;
  payment_status: PaymentStatus;
  status: BookingStatus;
  expires_at?: number; // Epoch timestamp in ms for 10-minute holds
  held_by_session?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  booking_reference: string;
  payment_reference: string;
  payment_provider: 'gcash' | 'maya' | 'card' | 'wallet' | 'paymongo_sandbox';
  amount: number;
  payment_status: PaymentStatus;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaySession {
  id: string;
  branch_id: string;
  branch_name: string;
  sport: 'badminton' | 'pickleball';
  session_type: 'open_play' | 'unli_play';
  title: string;
  host_name: string;
  skill_level: 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced';
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  fee_per_head: number;
  status: 'Open' | 'Full' | 'Ongoing' | 'Completed';
  participants: { id: string; name: string; joined_at: string }[];
}

export interface QueueEntry {
  id: string;
  branch_id: string;
  sport: 'badminton' | 'pickleball';
  court_id?: string;
  court_name?: string;
  player_names: string[];
  team_name?: string;
  position: number;
  status: 'waiting' | 'on_court' | 'completed' | 'called';
  court_assigned?: string;
  joined_at: string;
  estimated_wait_mins: number;
}

export interface Coach {
  id: string;
  user_id: string;
  name: string;
  title: string;
  bio: string;
  sports: ('badminton' | 'pickleball')[];
  experience_years: number;
  hourly_rate: number;
  rating: number;
  total_sessions: number;
  avatar_url: string;
  certifications: string[];
  available_days: string[];
  is_verified: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'Tournament' | 'Facility' | 'Promotion' | 'Community';
  summary: string;
  content: string;
  image_url: string;
  published_at: string;
  pinned: boolean;
}

export interface Voucher {
  code: string;
  discount_percent: number;
  max_discount: number;
  min_spend: number;
  description: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  action: string;
  details: string;
}

function getTimeRange(timeSlot: string, durationHours?: number): { start: number; end: number } | null {
  const match = timeSlot.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const start = Number(match[1]) * 60 + Number(match[2]);
  const slotEnd = Number(match[3]) * 60 + Number(match[4]);
  const duration = durationHours ?? (slotEnd - start) / 60;
  if (duration <= 0) return null;

  return { start, end: start + duration * 60 };
}

// Database Store
class DatabaseStore {
  users: User[] = [
    {
      id: 'u-admin',
      name: 'Marcus Tan',
      email: 'admin@smashzone.ph',
      phone: '+63 917 888 9999',
      password: 'admin123',
      role: 'admin',
      wallet_balance: 5000,
      membership_tier: 'Gold',
      created_at: '2026-01-15T08:00:00Z',
    },
    {
      id: 'u-manager',
      name: 'Elena Bautista',
      email: 'manager.valenzuela@smashzone.ph',
      phone: '+63 917 555 3344',
      password: 'manager123',
      role: 'manager',
      wallet_balance: 2000,
      membership_tier: 'Silver',
      created_at: '2026-02-01T08:00:00Z',
    },
    {
      id: 'u-coach-1',
      name: 'Kenji Sato',
      email: 'coach.ken@smashzone.ph',
      phone: '+63 918 444 5678',
      password: 'coach123',
      role: 'coach',
      wallet_balance: 3200,
      membership_tier: 'Gold',
      created_at: '2026-01-20T08:00:00Z',
    },
    {
      id: 'u-customer',
      name: 'Alex Rivera',
      email: 'alex@smashzone.ph',
      phone: '+63 917 555 1234',
      password: 'customer123',
      role: 'customer',
      wallet_balance: 1850,
      membership_tier: 'Silver',
      created_at: '2026-03-01T08:00:00Z',
    },
  ];

  branches: Branch[] = [
    {
      id: 'b-valenzuela',
      name: 'SmashZone Valenzuela Hub',
      slug: 'valenzuela',
      address: '7A Doneza St., Brgy. Malinta',
      city: 'Valenzuela City, Metro Manila',
      phone: '+63 915 662 8412',
      opening_hours: '06:00 AM – 12:00 Midnight',
      badminton_rate: 500,
      pickleball_rate: 650,
      total_courts: 8,
      image_url: '/src/assets/images/hero_badminton_court_1793346018863.jpg',
      amenities: ['Air-Conditioned Lounge', 'BWF Mats', 'Pro Shop Restringing', 'Shower Rooms', 'Free Parking', 'Cafe'],
    },
    {
      id: 'b-qc',
      name: 'SmashZone QC Araneta Hub',
      slug: 'qc-araneta',
      address: '1619 Gregorio Araneta Avenue',
      city: 'Quezon City, Metro Manila',
      phone: '+63 917 332 9901',
      opening_hours: '06:00 AM – 11:00 PM',
      badminton_rate: 550,
      pickleball_rate: 700,
      total_courts: 6,
      image_url: '/src/assets/images/badminton_action_match_1793346020045.jpg',
      amenities: ['Tournament Lighting', 'Locker Facilities', 'Cold Brew Bar', 'WiFi 6', 'Paddle Rentals'],
    },
    {
      id: 'b-bgc',
      name: 'SmashZone BGC Central Arena',
      slug: 'bgc-central',
      address: '9th Avenue cor. 34th Street',
      city: 'Bonifacio Global City, Taguig',
      phone: '+63 919 444 8822',
      opening_hours: '05:00 AM – 01:00 AM',
      badminton_rate: 750,
      pickleball_rate: 850,
      total_courts: 8,
      image_url: '/src/assets/images/pickleball_action_match_1793346020184.jpg',
      amenities: ['VIP Stadium Seating', 'Live Stream Cameras', 'Valet Parking', 'Recovery Cryo-Lounge'],
    },
    {
      id: 'b-makati',
      name: 'SmashZone Makati Performance',
      slug: 'makati-performance',
      address: '2230 Chino Roces Ave Extension',
      city: 'Makati City, Metro Manila',
      phone: '+63 917 220 7711',
      opening_hours: '06:00 AM – 12:00 Midnight',
      badminton_rate: 650,
      pickleball_rate: 750,
      total_courts: 6,
      image_url: '/src/assets/images/sports_facility_lounge_1793346020065.jpg',
      amenities: ['Cushion Pro Flooring', 'Pro Gear Shop', 'Personal Training Studio', 'Coaching Academy'],
    },
  ];

  courts: Court[] = [];

  bookings: Booking[] = [];

  payments: Payment[] = [];

  playSessions: PlaySession[] = [
    {
      id: 'ps-1',
      branch_id: 'b-valenzuela',
      branch_name: 'SmashZone Valenzuela Hub',
      sport: 'badminton',
      session_type: 'open_play',
      title: 'Friday Night Racket Social Smash',
      host_name: 'SmashZone Community Club',
      skill_level: 'All Levels',
      date: new Date().toISOString().split('T')[0],
      start_time: '19:00',
      end_time: '22:00',
      max_participants: 24,
      current_participants: 18,
      fee_per_head: 250,
      status: 'Open',
      participants: [
        { id: 'u-p1', name: 'Marco S.', joined_at: '14:20' },
        { id: 'u-p2', name: 'Katrina D.', joined_at: '15:10' },
        { id: 'u-p3', name: 'Jerome P.', joined_at: '16:05' },
      ],
    },
    {
      id: 'ps-2',
      branch_id: 'b-qc',
      branch_name: 'SmashZone QC Araneta Hub',
      sport: 'pickleball',
      session_type: 'open_play',
      title: 'Saturday Pickleball Dinking & Round Robin',
      host_name: 'Coach Kenji & QC Ralliers',
      skill_level: 'Intermediate',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '11:00',
      max_participants: 16,
      current_participants: 13,
      fee_per_head: 300,
      status: 'Open',
      participants: [
        { id: 'u-p4', name: 'Bea Santos', joined_at: '09:00' },
        { id: 'u-p5', name: 'Carlos Ramos', joined_at: '10:30' },
      ],
    },
    {
      id: 'ps-3',
      branch_id: 'b-bgc',
      branch_name: 'SmashZone BGC Central Arena',
      sport: 'badminton',
      session_type: 'unli_play',
      title: 'Sunday Morning Unli-Play Pass: Early Bird Smash',
      host_name: 'SmashZone BGC Operations',
      skill_level: 'All Levels',
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      start_time: '06:00',
      end_time: '12:00',
      max_participants: 30,
      current_participants: 22,
      fee_per_head: 600,
      status: 'Open',
      participants: [
        { id: 'u-p6', name: 'Daniel Lim', joined_at: '11:00' },
        { id: 'u-p7', name: 'Patricia Tan', joined_at: '12:15' },
      ],
    },
    {
      id: 'ps-4',
      branch_id: 'b-makati',
      branch_name: 'SmashZone Makati Performance',
      sport: 'pickleball',
      session_type: 'open_play',
      title: 'Lunch Break Fast-Paced Pickleball Matchups',
      host_name: 'Makati Dinking Guild',
      skill_level: 'Intermediate',
      date: new Date().toISOString().split('T')[0],
      start_time: '12:00',
      end_time: '14:00',
      max_participants: 12,
      current_participants: 12,
      fee_per_head: 200,
      status: 'Full',
      participants: [],
    },
  ];

  queueEntries: QueueEntry[] = [
    {
      id: 'qe-1',
      branch_id: 'b-valenzuela',
      sport: 'badminton',
      player_names: ['David & Sarah (Team Smash)', 'Paolo & Mark (The Lobbers)'],
      team_name: 'Court 1 Match (Doubles 21-pt)',
      position: 0,
      status: 'on_court',
      court_assigned: 'Court 1 (BWF Mat)',
      joined_at: '18:10',
      estimated_wait_mins: 0,
    },
    {
      id: 'qe-2',
      branch_id: 'b-valenzuela',
      sport: 'badminton',
      player_names: ['Kenji & Coach Elena', 'Mike & Gabriel'],
      team_name: 'Court 2 Match (Doubles 21-pt)',
      position: 0,
      status: 'on_court',
      court_assigned: 'Court 2 (BWF Mat)',
      joined_at: '18:15',
      estimated_wait_mins: 0,
    },
    {
      id: 'qe-3',
      branch_id: 'b-valenzuela',
      sport: 'badminton',
      player_names: ['Carlo Mendoza', 'Justin Reyes'],
      team_name: 'Team Velocity (Next Up)',
      position: 1,
      status: 'waiting',
      joined_at: '18:22',
      estimated_wait_mins: 8,
    },
  ];

  coaches: Coach[] = [
    {
      id: 'c-1',
      user_id: 'u-coach-1',
      name: 'Kenji Sato',
      title: 'BWF Certified Level 2 Coach & Former National Squad',
      bio: 'Over 12 years of competitive badminton experience. Specializes in deceptive wristwork, rapid footwork mechanics, and tournament tactical strategy.',
      sports: ['badminton'],
      experience_years: 12,
      hourly_rate: 1000,
      rating: 4.95,
      total_sessions: 420,
      avatar_url: '/src/assets/images/badminton_action_match_1793346020045.jpg',
      certifications: ['BWF Level 2 High Performance', 'Philippine National Team Alum (2018-2022)'],
      available_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      is_verified: true,
    },
    {
      id: 'c-2',
      user_id: 'u-coach-2',
      name: 'Alyssa "The Dinker" Mendez',
      title: 'PPR Certified Pickleball Touring Pro',
      bio: 'Gold medalist in SEA Pickleball Open 2025. Master of the 3rd-shot drop, kitchen dominance, and reset mechanics for competitive players.',
      sports: ['pickleball'],
      experience_years: 6,
      hourly_rate: 950,
      rating: 4.92,
      total_sessions: 310,
      avatar_url: '/src/assets/images/pickleball_action_match_1793346020184.jpg',
      certifications: ['PPR Certified Professional', 'PPA Tour Qualifier'],
      available_days: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
      is_verified: true,
    },
    {
      id: 'c-3',
      user_id: 'u-coach-3',
      name: 'Ramon "Power Smash" De Castro',
      title: 'Senior Badminton Technique & Youth Academy Director',
      bio: 'Coached over 80 UAAP/NCAA collegiate varsity athletes. Patient, disciplined coaching tailored for beginner fundamentals to advanced jump smashes.',
      sports: ['badminton'],
      experience_years: 15,
      hourly_rate: 1200,
      rating: 4.88,
      total_sessions: 680,
      avatar_url: '/src/assets/images/hero_badminton_court_1793346018863.jpg',
      certifications: ['National Sports Commission Master Trainer', 'Sports Biomechanics Specialist'],
      available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      is_verified: true,
    },
    {
      id: 'c-4',
      user_id: 'u-coach-4',
      name: 'Samantha Yu',
      title: 'Dual Racket Specialist (Badminton & Pickleball)',
      bio: 'Passionate about introducing newcomers to racket sports with zero intimidation. Focus on court awareness, injury prevention, and fun drills.',
      sports: ['badminton', 'pickleball'],
      experience_years: 7,
      hourly_rate: 850,
      rating: 4.97,
      total_sessions: 245,
      avatar_url: '/src/assets/images/sports_facility_lounge_1793346020065.jpg',
      certifications: ['IPTPA Level 1', 'BWF Level 1 Coach'],
      available_days: ['Wednesday', 'Thursday', 'Saturday', 'Sunday'],
      is_verified: true,
    },
  ];

  announcements: Announcement[] = [
    {
      id: 'a-1',
      title: 'SmashZone Metro Championship 2026: Open Registration',
      category: 'Tournament',
      summary: 'Registration is now officially open for our flagship 2026 Badminton & Pickleball Invitational across all 4 hubs.',
      content: 'Gear up for the biggest racket showdown in Metro Manila! Cash prize pool of ₱250,000.',
      image_url: '/src/assets/images/badminton_action_match_1793346020045.jpg',
      published_at: '2026-10-25',
      pinned: true,
    },
    {
      id: 'a-2',
      title: 'Valenzuela Main Hub Upgrades to BWF-Grade Taraflex Mats',
      category: 'Facility',
      summary: 'All 4 badminton courts have been refitted with Olympic-standard shock absorption surfaces.',
      content: 'Olympic-standard shock absorption surfaces to minimize joint strain.',
      image_url: '/src/assets/images/hero_badminton_court_1793346018863.jpg',
      published_at: '2026-10-20',
      pinned: true,
    },
  ];

  vouchers: Voucher[] = [
    {
      code: 'SMASHWELCOME',
      discount_percent: 15,
      max_discount: 200,
      min_spend: 500,
      description: '15% off your first court reservation',
      is_active: true,
    },
    {
      code: 'PICKLE20',
      discount_percent: 20,
      max_discount: 250,
      min_spend: 600,
      description: '20% off all Pickleball court slots',
      is_active: true,
    },
    {
      code: 'RACKET10',
      discount_percent: 10,
      max_discount: 100,
      min_spend: 400,
      description: '10% discount on any booking',
      is_active: true,
    },
  ];

  auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: '2026-10-30T07:15:00Z',
      user_name: 'Marcus Tan (Admin)',
      action: 'SYSTEM_INIT',
      details: 'Initialized court pricing, seed branches, and live queue controller.',
    },
  ];

  constructor() {
    this.seedCourts();
  }

  private seedCourts() {
    this.branches.forEach((b) => {
      const badmintonCount = Math.floor(b.total_courts / 2);
      const pickleballCount = b.total_courts - badmintonCount;

      for (let i = 1; i <= badmintonCount; i++) {
        this.courts.push({
          id: `crt-${b.slug}-bad-${i}`,
          branch_id: b.id,
          court_number: i,
          court_name: `Badminton Court ${i}`,
          sport: 'badminton',
          surface: i === 1 ? 'BWF Taraflex Tournament' : 'Cushion Pro 7mm Mat',
          lighting: '1000 Lux Anti-Glare LED',
          hourly_rate: b.badminton_rate,
          is_active: true,
        });
      }

      for (let j = 1; j <= pickleballCount; j++) {
        this.courts.push({
          id: `crt-${b.slug}-pck-${j}`,
          branch_id: b.id,
          court_number: badmintonCount + j,
          court_name: `Pickleball Court ${j}`,
          sport: 'pickleball',
          surface: 'Acrytech Non-Slip Pro Texture',
          lighting: '850 Lux Wide Beam LED',
          hourly_rate: b.pickleball_rate,
          is_active: true,
        });
      }
    });
  }

  // Check if slot is available (not booked and not actively held)
  checkSlotAvailable(
    courtId: string,
    date: string,
    timeSlot: string,
    currentSessionId?: string,
    durationHours = 1
  ): { available: boolean; reason?: string; booking?: Booking } {
    // Clean expired holds first
    this.cleanExpiredHolds();

    const requestedRange = getTimeRange(timeSlot, durationHours);
    const existing = requestedRange && this.bookings.find((booking) => {
      if (
        booking.court_id !== courtId ||
        booking.booking_date !== date ||
        booking.status === 'CANCELLED' ||
        booking.status === 'EXPIRED'
      ) {
        return false;
      }

      const bookingRange = getTimeRange(booking.time_slot, booking.duration_hours);
      return bookingRange !== null &&
        requestedRange.start < bookingRange.end &&
        bookingRange.start < requestedRange.end;
    });

    if (!existing) {
      return { available: true };
    }

    if (existing.status === 'CONFIRMED' || existing.status === 'COMPLETED') {
      return { available: false, reason: 'BOOKED', booking: existing };
    }

    if (existing.status === 'PENDING_PAYMENT') {
      // If held by the same user session, treat as available to them
      if (currentSessionId && existing.held_by_session === currentSessionId) {
        return { available: true, booking: existing };
      }
      return { available: false, reason: 'AWAITING_PAYMENT', booking: existing };
    }

    return { available: true };
  }

  getBookingForSlot(courtId: string, date: string, timeSlot: string): Booking | undefined {
    const slotRange = getTimeRange(timeSlot);
    if (!slotRange) return undefined;

    return this.bookings.find((booking) => {
      if (
        booking.court_id !== courtId ||
        booking.booking_date !== date ||
        booking.status === 'CANCELLED' ||
        booking.status === 'EXPIRED'
      ) {
        return false;
      }

      const bookingRange = getTimeRange(booking.time_slot, booking.duration_hours);
      return bookingRange !== null &&
        slotRange.start < bookingRange.end &&
        bookingRange.start < slotRange.end;
    });
  }

  // Temporary slot hold (10-minute expiry)
  createTemporaryHold(bookingData: {
    user_id: string;
    user_name: string;
    user_email: string;
    user_phone: string;
    branch_id: string;
    court_id: string;
    sport: 'badminton' | 'pickleball';
    booking_date: string;
    time_slot: string;
    duration_hours?: number;
    equipment_addons?: number;
    voucher_code?: string;
    session_id?: string;
  }): { success: boolean; booking?: Booking; payment?: Payment; error?: string } {
    this.cleanExpiredHolds();

    const duration = bookingData.duration_hours || 1;
    const check = this.checkSlotAvailable(
      bookingData.court_id,
      bookingData.booking_date,
      bookingData.time_slot,
      bookingData.session_id,
      duration
    );
    if (!check.available) {
      if (check.reason === 'AWAITING_PAYMENT') {
        return { success: false, error: 'This court and time slot is currently temporarily reserved by another customer awaiting payment. Please select another slot.' };
      }
      return { success: false, error: 'This court and time slot is already booked. Please select another available schedule.' };
    }

    const court = this.courts.find((c) => c.id === bookingData.court_id);
    if (!court) return { success: false, error: 'Court not found' };

    const branch = this.branches.find((b) => b.id === (bookingData.branch_id || court.branch_id));
    const branchName = branch ? branch.name : 'SmashZone Hub';

    const courtFee = court.hourly_rate * duration;
    let discount = 0;

    if (bookingData.voucher_code) {
      const v = this.vouchers.find((voc) => voc.code.toUpperCase() === bookingData.voucher_code?.toUpperCase() && voc.is_active);
      if (v) {
        discount = Math.min((courtFee * v.discount_percent) / 100, v.max_discount);
      }
    }

    const total = Math.max(0, courtFee + (bookingData.equipment_addons || 0) - discount);
    const refNumber = `SZ-${bookingData.booking_date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // If existing hold by same session, update it
    if (check.booking && check.booking.status === 'PENDING_PAYMENT' && check.booking.held_by_session === bookingData.session_id) {
      check.booking.expires_at = expiresAt;
      check.booking.total_amount = total;
      return { success: true, booking: check.booking };
    }

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      reference_no: refNumber,
      user_id: bookingData.user_id,
      user_name: bookingData.user_name,
      user_email: bookingData.user_email,
      user_phone: bookingData.user_phone,
      branch_id: court.branch_id,
      branch_name: branchName,
      court_id: court.id,
      court_name: court.court_name,
      sport: bookingData.sport,
      booking_date: bookingData.booking_date,
      time_slot: bookingData.time_slot,
      duration_hours: duration,
      court_fee: courtFee,
      equipment_fee: bookingData.equipment_addons || 0,
      discount_amount: discount,
      total_amount: total,
      voucher_code: bookingData.voucher_code,
      payment_method: 'Awaiting Selection',
      payment_status: 'PENDING',
      status: 'PENDING_PAYMENT',
      expires_at: expiresAt,
      held_by_session: bookingData.session_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      booking_id: newBooking.id,
      booking_reference: refNumber,
      payment_reference: `PAY-INIT-${Math.floor(100000 + Math.random() * 900000)}`,
      payment_provider: 'paymongo_sandbox',
      amount: total,
      payment_status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.bookings.unshift(newBooking);
    this.payments.unshift(newPayment);

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_name: bookingData.user_name,
      action: 'SLOT_HELD_AWAITING_PAYMENT',
      details: `Held ${court.court_name} on ${bookingData.booking_date} (${bookingData.time_slot}) for 10 minutes. Ref: ${refNumber}`,
    });

    return { success: true, booking: newBooking, payment: newPayment };
  }

  // Release temporary hold immediately
  releaseHold(bookingId: string, reason = 'User cancelled checkout'): Booking | null {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return null;

    if (booking.status === 'PENDING_PAYMENT') {
      booking.status = 'EXPIRED';
      booking.payment_status = 'FAILED';
      booking.updated_at = new Date().toISOString();

      this.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user_name: booking.user_name,
        action: 'HOLD_RELEASED',
        details: `Released hold for ${booking.court_name} on ${booking.booking_date} (${booking.time_slot}). Reason: ${reason}`,
      });
      return booking;
    }
    return null;
  }

  // Clean all expired holds automatically
  cleanExpiredHolds(): Booking[] {
    const now = Date.now();
    const expiredList: Booking[] = [];

    this.bookings.forEach((b) => {
      if (b.status === 'PENDING_PAYMENT' && b.expires_at && b.expires_at <= now) {
        b.status = 'EXPIRED';
        b.payment_status = 'FAILED';
        b.updated_at = new Date().toISOString();
        expiredList.push(b);

        this.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user_name: b.user_name,
          action: 'HOLD_EXPIRED',
          details: `10-minute payment timer expired for ${b.court_name} (${b.booking_date} ${b.time_slot}). Slot released.`,
        });
      }
    });

    return expiredList;
  }

  // Payment Verification & Booking Confirmation (Atomic & Idempotent)
  confirmPayment(bookingId: string, paymentProvider: Payment['payment_provider'], paymentRef?: string): { success: boolean; booking?: Booking; payment?: Payment; error?: string } {
    this.cleanExpiredHolds();

    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Booking reservation not found.' };
    }

    if (booking.status === 'CONFIRMED') {
      // Idempotent: already confirmed
      const payment = this.payments.find((p) => p.booking_id === booking.id);
      return { success: true, booking, payment };
    }

    if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') {
      return { success: false, error: 'The reservation hold has expired or was cancelled. Please re-select your court.' };
    }

    // Atomic double check on court availability
    const conflicting = this.bookings.find(
      (b) =>
        b.id !== booking.id &&
        b.court_id === booking.court_id &&
        b.booking_date === booking.booking_date &&
        b.time_slot === booking.time_slot &&
        b.status === 'CONFIRMED'
    );

    if (conflicting) {
      return { success: false, error: 'Conflict: Slot was confirmed by another transaction.' };
    }

    const paidAt = new Date().toISOString();
    booking.status = 'CONFIRMED';
    booking.payment_status = 'PAID';
    booking.payment_method = paymentProvider.toUpperCase();
    booking.updated_at = paidAt;

    let payment = this.payments.find((p) => p.booking_id === booking.id);
    if (!payment) {
      payment = {
        id: `pay-${Date.now()}`,
        booking_id: booking.id,
        booking_reference: booking.reference_no,
        payment_reference: paymentRef || `TXN-${paymentProvider.toUpperCase()}-${Date.now()}`,
        payment_provider: paymentProvider,
        amount: booking.total_amount,
        payment_status: 'PAID',
        paid_at: paidAt,
        created_at: paidAt,
        updated_at: paidAt,
      };
      this.payments.unshift(payment);
    } else {
      payment.payment_status = 'PAID';
      payment.payment_provider = paymentProvider;
      payment.payment_reference = paymentRef || payment.payment_reference;
      payment.paid_at = paidAt;
      payment.updated_at = paidAt;
    }

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: paidAt,
      user_name: booking.user_name,
      action: 'PAYMENT_VERIFIED_BOOKING_CONFIRMED',
      details: `Payment verified via ${paymentProvider.toUpperCase()}. Reference: ${booking.reference_no}. Amount: ₱${booking.total_amount}`,
    });

    return { success: true, booking, payment };
  }

  // Cancel confirmed booking
  cancelBooking(bookingId: string, reason?: string): { success: boolean; error?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.status = 'CANCELLED';
    booking.payment_status = 'REFUNDED';
    booking.updated_at = new Date().toISOString();

    const payment = this.payments.find((p) => p.booking_id === booking.id);
    if (payment) {
      payment.payment_status = 'REFUNDED';
      payment.updated_at = new Date().toISOString();
    }

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_name: booking.user_name,
      action: 'BOOKING_CANCELLED',
      details: `Cancelled reservation ${booking.reference_no} (${booking.court_name}). Reason: ${reason || 'User requested cancellation'}`,
    });

    return { success: true };
  }

  // Reschedule booking
  rescheduleBooking(bookingId: string, newDate: string, newTimeSlot: string): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const check = this.checkSlotAvailable(
      booking.court_id,
      newDate,
      newTimeSlot,
      undefined,
      booking.duration_hours
    );
    if (!check.available) {
      return { success: false, error: 'The requested new slot is not available.' };
    }

    const prevDate = booking.booking_date;
    const prevSlot = booking.time_slot;

    booking.booking_date = newDate;
    booking.time_slot = newTimeSlot;
    booking.updated_at = new Date().toISOString();

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_name: booking.user_name,
      action: 'BOOKING_RESCHEDULED',
      details: `Rescheduled ${booking.reference_no} from ${prevDate} ${prevSlot} to ${newDate} ${newTimeSlot}`,
    });

    return { success: true, booking };
  }

  // Live Availability Summary (for live dashboard bar)
  getLiveAvailabilitySummary(branchId: string, date: string, sport?: string) {
    this.cleanExpiredHolds();

    let branchCourts = this.courts.filter((c) => c.branch_id === branchId);
    if (sport && sport !== 'all') {
      branchCourts = branchCourts.filter((c) => c.sport === sport);
    }

    const timeSlots = [
      '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
      '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00',
      '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00',
      '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00',
      '22:00 - 23:00',
    ];

    let totalAvailable = 0;
    let totalBooked = 0;
    let totalPending = 0;
    const courtIds = new Set(branchCourts.map((court) => court.id));
    const totalCancelled = this.bookings.filter(
      (booking) =>
        booking.booking_date === date &&
        booking.status === 'CANCELLED' &&
        courtIds.has(booking.court_id)
    ).length;
    let totalBlocked = 0;

    const courtsSummary = branchCourts.map((court) => {
      let avail = 0;
      let booked = 0;
      let pending = 0;
      let blocked = 0;

      if (!court.is_active) {
        blocked = timeSlots.length;
      } else {
        timeSlots.forEach((slot) => {
          const check = this.checkSlotAvailable(court.id, date, slot);
          if (check.available) {
            avail++;
          } else if (check.reason === 'AWAITING_PAYMENT') {
            pending++;
          } else {
            booked++;
          }
        });
      }

      totalAvailable += avail;
      totalBooked += booked;
      totalPending += pending;
      totalBlocked += blocked;

      return {
        court_id: court.id,
        court_name: court.court_name,
        sport: court.sport,
        available_hours: avail,
        booked_hours: booked,
        pending_hours: pending,
        blocked_hours: blocked,
      };
    });

    return {
      date,
      branch_id: branchId,
      total_available: totalAvailable,
      total_booked: totalBooked,
      total_pending_payment: totalPending,
      total_cancelled: totalCancelled,
      total_blocked: totalBlocked,
      courts_summary: courtsSummary,
    };
  }

  // Queue Operations
  joinQueue(branchId: string, sport: 'badminton' | 'pickleball', playerNames: string[], teamName?: string): QueueEntry {
    const branchQueues = this.queueEntries.filter((q) => q.branch_id === branchId && q.sport === sport && q.status === 'waiting');
    const newPos = branchQueues.length + 1;

    const entry: QueueEntry = {
      id: `qe-${Date.now()}`,
      branch_id: branchId,
      sport,
      player_names: playerNames,
      team_name: teamName || `Queue Team #${newPos}`,
      position: newPos,
      status: 'waiting',
      joined_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimated_wait_mins: newPos * 15,
    };

    this.queueEntries.push(entry);
    return entry;
  }

  callNextQueue(branchId: string, sport: 'badminton' | 'pickleball', courtName: string): QueueEntry | null {
    const nextInLine = this.queueEntries.find((q) => q.branch_id === branchId && q.sport === sport && q.status === 'waiting');
    if (!nextInLine) return null;

    nextInLine.status = 'on_court';
    nextInLine.court_assigned = courtName;
    nextInLine.position = 0;

    let pos = 1;
    this.queueEntries.forEach((q) => {
      if (q.branch_id === branchId && q.sport === sport && q.status === 'waiting') {
        q.position = pos;
        q.estimated_wait_mins = pos * 15;
        pos++;
      }
    });

    return nextInLine;
  }

  leaveQueue(entryId: string): boolean {
    const idx = this.queueEntries.findIndex((q) => q.id === entryId);
    if (idx === -1) return false;

    const entry = this.queueEntries[idx];
    this.queueEntries.splice(idx, 1);

    let pos = 1;
    this.queueEntries.forEach((q) => {
      if (q.branch_id === entry.branch_id && q.sport === entry.sport && q.status === 'waiting') {
        q.position = pos;
        q.estimated_wait_mins = pos * 15;
        pos++;
      }
    });

    return true;
  }

  joinPlaySession(sessionId: string, userId: string, userName: string): { success: boolean; session?: PlaySession; error?: string } {
    const session = this.playSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    if (session.current_participants >= session.max_participants) {
      return { success: false, error: 'Session is currently full.' };
    }

    if (session.participants.some((p) => p.id === userId || p.name === userName)) {
      return { success: false, error: 'You are already registered for this session.' };
    }

    session.participants.push({
      id: userId,
      name: userName,
      joined_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    session.current_participants = session.participants.length;
    if (session.current_participants >= session.max_participants) {
      session.status = 'Full';
    }

    return { success: true, session };
  }
}

export const db = new DatabaseStore();
