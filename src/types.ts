export type SportType = 'badminton' | 'pickleball';
export type UserRole = 'customer' | 'coach' | 'manager' | 'admin';

export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
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
  sport: SportType;
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
  sport: SportType;
  booking_date: string;
  time_slot: string;
  duration_hours: number;
  court_fee: number;
  equipment_fee: number;
  discount_amount: number;
  total_amount: number;
  voucher_code?: string;
  payment_method: string;
  payment_status: PaymentStatus;
  status: BookingStatus;
  expires_at?: number; // Epoch timestamp in ms for temporary holds
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

export interface LiveCourtAvailability {
  court_id: string;
  court_name: string;
  sport: SportType;
  available_hours: number;
  booked_hours: number;
  pending_hours: number;
  blocked_hours: number;
}

export interface LiveAvailabilitySummary {
  date: string;
  branch_id: string;
  total_available: number;
  total_booked: number;
  total_pending_payment: number;
  total_cancelled: number;
  total_blocked: number;
  courts_summary: LiveCourtAvailability[];
}

export interface PlaySession {
  id: string;
  branch_id: string;
  branch_name: string;
  sport: SportType;
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
  sport: SportType;
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
  sports: SportType[];
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

export interface DatabaseStats {
  totalBookings: number;
  registeredMembers: number;
  totalCourts: number;
  totalBranches: number;
  totalSessions: number;
  totalCoaches: number;
}
