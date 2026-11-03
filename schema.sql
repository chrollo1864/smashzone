-- =============================================================================
-- SMASHZONE POSTGRESQL DATABASE SCHEMA & SEED DATA
-- Run this script in PostgreSQL (psql, pgAdmin, Supabase, Neon, RDS, or Cloud SQL)
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'coach', 'manager', 'admin')),
    wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
    membership_tier VARCHAR(32) NOT NULL DEFAULT 'Free' CHECK (membership_tier IN ('Free', 'Silver', 'Gold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BRANCHES
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    opening_hours VARCHAR(100) NOT NULL,
    badminton_rate NUMERIC(10, 2) NOT NULL,
    pickleball_rate NUMERIC(10, 2) NOT NULL,
    total_courts INT NOT NULL DEFAULT 8,
    image_url TEXT,
    amenities TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. COURTS
CREATE TABLE IF NOT EXISTS courts (
    id VARCHAR(64) PRIMARY KEY,
    branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE CASCADE,
    court_number INT NOT NULL,
    court_name VARCHAR(100) NOT NULL,
    sport VARCHAR(32) NOT NULL CHECK (sport IN ('badminton', 'pickleball')),
    surface VARCHAR(100) NOT NULL,
    lighting VARCHAR(100) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_court UNIQUE (branch_id, court_number)
);

-- 4. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    reference_no VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    court_id VARCHAR(64) REFERENCES courts(id) ON DELETE CASCADE,
    court_name VARCHAR(255) NOT NULL,
    sport VARCHAR(32) NOT NULL CHECK (sport IN ('badminton', 'pickleball')),
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    duration_hours INT NOT NULL DEFAULT 1,
    court_fee NUMERIC(10, 2) NOT NULL,
    equipment_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    voucher_code VARCHAR(50),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Awaiting Selection',
    payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED')),
    expires_at BIGINT, -- Milliseconds epoch timestamp for 10-minute hold
    held_by_session VARCHAR(128),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint ensuring no two confirmed bookings on same court/date/slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_court_date_slot 
ON bookings (court_id, booking_date, time_slot) 
WHERE status = 'CONFIRMED';

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE CASCADE,
    booking_reference VARCHAR(64) NOT NULL,
    payment_reference VARCHAR(128) UNIQUE NOT NULL,
    payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('gcash', 'maya', 'card', 'wallet', 'paymongo_sandbox')),
    amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PLAY SESSIONS (Open Play & Unli Play)
CREATE TABLE IF NOT EXISTS play_sessions (
    id VARCHAR(64) PRIMARY KEY,
    branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    sport VARCHAR(32) NOT NULL CHECK (sport IN ('badminton', 'pickleball')),
    session_type VARCHAR(32) NOT NULL CHECK (session_type IN ('open_play', 'unli_play')),
    title VARCHAR(255) NOT NULL,
    host_name VARCHAR(255) NOT NULL,
    skill_level VARCHAR(50) NOT NULL DEFAULT 'All Levels',
    session_date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    max_participants INT NOT NULL DEFAULT 24,
    current_participants INT NOT NULL DEFAULT 0,
    fee_per_head NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Full', 'Ongoing', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. SESSION PARTICIPANTS
CREATE TABLE IF NOT EXISTS session_participants (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES play_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_participant UNIQUE (session_id, user_id)
);

-- 8. QUEUE ENTRIES
CREATE TABLE IF NOT EXISTS queue_entries (
    id VARCHAR(64) PRIMARY KEY,
    branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE CASCADE,
    sport VARCHAR(32) NOT NULL CHECK (sport IN ('badminton', 'pickleball')),
    court_id VARCHAR(64) REFERENCES courts(id) ON DELETE SET NULL,
    court_name VARCHAR(100),
    player_names TEXT[] NOT NULL,
    team_name VARCHAR(100),
    position INT NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'on_court', 'completed', 'called')),
    court_assigned VARCHAR(100),
    estimated_wait_mins INT NOT NULL DEFAULT 15,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. COACHES
CREATE TABLE IF NOT EXISTS coaches (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    bio TEXT NOT NULL,
    sports TEXT[] NOT NULL,
    experience_years INT NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_sessions INT NOT NULL DEFAULT 0,
    avatar_url TEXT,
    certifications TEXT[] DEFAULT '{}',
    available_days TEXT[] DEFAULT '{}',
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    published_at DATE NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. VOUCHERS
CREATE TABLE IF NOT EXISTS vouchers (
    code VARCHAR(50) PRIMARY KEY,
    discount_percent INT NOT NULL,
    max_discount NUMERIC(10, 2) NOT NULL,
    min_spend NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL
);

-- =============================================================================
-- SEED INITIAL DATA
-- =============================================================================

INSERT INTO users (id, name, email, phone, password_hash, role, wallet_balance, membership_tier)
VALUES
  ('u-admin', 'Marcus Tan', 'admin@smashzone.ph', '+63 917 888 9999', 'admin123', 'admin', 5000.00, 'Gold'),
  ('u-manager', 'Elena Bautista', 'manager.valenzuela@smashzone.ph', '+63 917 555 3344', 'manager123', 'manager', 2000.00, 'Silver'),
  ('u-coach-1', 'Kenji Sato', 'coach.ken@smashzone.ph', '+63 918 444 5678', 'coach123', 'coach', 3200.00, 'Gold'),
  ('u-customer', 'Alex Rivera', 'alex@smashzone.ph', '+63 917 555 1234', 'customer123', 'customer', 1850.00, 'Silver')
ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, name, slug, address, city, phone, opening_hours, badminton_rate, pickleball_rate, total_courts, amenities)
VALUES
  ('b-valenzuela', 'SmashZone Valenzuela Hub', 'valenzuela', '7A Doneza St., Brgy. Malinta', 'Valenzuela City, Metro Manila', '+63 915 662 8412', '06:00 AM – 12:00 Midnight', 500.00, 650.00, 8, ARRAY['Air-Conditioned Lounge', 'BWF Mats', 'Pro Shop', 'Showers', 'Free Parking']),
  ('b-qc', 'SmashZone QC Araneta Hub', 'qc-araneta', '1619 Gregorio Araneta Avenue', 'Quezon City, Metro Manila', '+63 917 332 9901', '06:00 AM – 11:00 PM', 550.00, 700.00, 6, ARRAY['Tournament Lighting', 'Locker Facilities', 'Cold Brew Bar', 'WiFi 6']),
  ('b-bgc', 'SmashZone BGC Central Arena', 'bgc-central', '9th Avenue cor. 34th Street', 'Bonifacio Global City, Taguig', '+63 919 444 8822', '05:00 AM – 01:00 AM', 750.00, 850.00, 8, ARRAY['VIP Stadium Seating', 'Live Stream Cameras', 'Valet Parking', 'Recovery Cryo-Lounge']),
  ('b-makati', 'SmashZone Makati Performance', 'makati-performance', '2230 Chino Roces Ave Extension', 'Makati City, Metro Manila', '+63 917 220 7711', '06:00 AM – 12:00 Midnight', 650.00, 750.00, 6, ARRAY['Cushion Pro Flooring', 'Pro Gear Shop', 'Personal Training Studio'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO vouchers (code, discount_percent, max_discount, min_spend, description, is_active)
VALUES
  ('SMASHWELCOME', 15, 200.00, 500.00, '15% off your first court reservation', TRUE),
  ('PICKLE20', 20, 250.00, 600.00, '20% off all Pickleball court slots', TRUE),
  ('RACKET10', 10, 100.00, 400.00, '10% discount on any booking', TRUE)
ON CONFLICT (code) DO NOTHING;
