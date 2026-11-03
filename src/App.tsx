import React, { useState, useEffect } from 'react';
import { User, Branch, Court, Booking, PlaySession, DatabaseStats, SportType } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { WhyChooseUs } from './components/WhyChooseUs';
import { BookingWizard } from './components/BookingWizard';
import { LiveBookingSection } from './components/LiveBookingSection';
import { AvailabilityGrid } from './components/AvailabilityGrid';
import { CommunityLobby } from './components/CommunityLobby';
import { QueueingBoard } from './components/QueueingBoard';
import { CoachingSection } from './components/CoachingSection';
import { LocationsSection } from './components/LocationsSection';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { ServicesSection } from './components/ServicesSection';
import { PartnershipSection } from './components/PartnershipSection';
import { MembershipSection } from './components/MembershipSection';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'admin' | 'booking' | 'queue'>('home');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  // Booking pre-selection states
  const [preselectedBranchId, setPreselectedBranchId] = useState<string>('b-valenzuela');
  const [preselectedSport, setPreselectedSport] = useState<SportType>('badminton');
  const [preselectedSlot, setPreselectedSlot] = useState<{ courtId: string; date: string; slot: string } | undefined>(undefined);
  const [bookingMode, setBookingMode] = useState<'realtime' | 'wizard'>('realtime');

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Global toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  useEffect(() => {
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data: Branch[]) => {
        setBranches(data);
        if (data.length > 0) setPreselectedBranchId(data[0].id);
      })
      .catch((err) => console.error('Error fetching branches:', err));

    const loadStats = () => {
      fetch('/api/stats')
        .then((res) => res.json())
        .then((data: DatabaseStats) => setStats(data))
        .catch((err) => console.error('Error fetching stats:', err));
    };

    loadStats();

    // Real-time synchronization for stats
    const es = new EventSource('/api/realtime/stream');
    es.addEventListener('booking_confirmed', () => loadStats());
    es.addEventListener('payment_completed', () => loadStats());
    es.addEventListener('booking_cancelled', () => loadStats());

    return () => {
      es.close();
    };
  }, []);

  const handleBookingSuccess = (booking: Booking) => {
    showToast(`🎉 Court reserved! Ref: ${booking.reference_no}`);
    // Refresh stats
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data));
  };

  const handleSelectSlotFromGrid = (court: Court, date: string, slot: string) => {
    setPreselectedBranchId(court.branch_id);
    setPreselectedSport(court.sport);
    setPreselectedSlot({ courtId: court.id, date, slot });

    const el = document.getElementById('booking-section');
    el?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Selected ${court.court_name} for ${date} (${slot})`);
  };

  const handleSelectBranchForBooking = (branchId: string) => {
    setPreselectedBranchId(branchId);
    const el = document.getElementById('booking-section');
    el?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Selected branch for booking.`);
  };

  const handleSelectService = (serviceKey: string) => {
    if (serviceKey === 'badminton' || serviceKey === 'pickleball') {
      setPreselectedSport(serviceKey);
      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (serviceKey === 'open_play' || serviceKey === 'unli_play') {
      document.getElementById('lobby-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (serviceKey === 'queueing') {
      document.getElementById('queue-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (serviceKey === 'coaching') {
      document.getElementById('coaching-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (serviceKey === 'membership') {
      document.getElementById('membership-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('locations-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-lime-400 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-lime-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <span className="w-2 h-2 rounded-full bg-lime-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Signed out of session');
          setCurrentView('home');
        }}
        onNavigateView={(view) => setCurrentView(view as any)}
        currentView={currentView}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'dashboard' && currentUser ? (
          <CustomerDashboard
            currentUser={currentUser}
            onBackToHome={() => setCurrentView('home')}
            onBookNewCourt={() => {
              setCurrentView('home');
              setTimeout(() => {
                document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          />
        ) : currentView === 'admin' && currentUser ? (
          <AdminDashboard
            currentUser={currentUser}
            onBackToHome={() => setCurrentView('home')}
          />
        ) : (
          /* HOME LANDING EXPERIENCE */
          <>
            {/* Hero Section */}
            <Hero
              stats={stats}
              onBookClick={() => {
                document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onLobbyClick={() => {
                document.getElementById('lobby-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Why Choose Us */}
            <WhyChooseUs />

            {/* Booking Experience Selector */}
            <div className="bg-[#0b0f17] pt-6 pb-2 border-t border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Reservation Interface Mode:
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setBookingMode('realtime')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      bookingMode === 'realtime'
                        ? 'bg-lime-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Real Time Slot Grid
                  </button>
                  <button
                    onClick={() => setBookingMode('wizard')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      bookingMode === 'wizard'
                        ? 'bg-lime-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    8-Step Guided Wizard
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time booking section or 8-step wizard */}
            {bookingMode === 'realtime' ? (
              <LiveBookingSection
                branches={branches}
                currentUser={currentUser}
                onBookingSuccess={handleBookingSuccess}
                preselectedBranchId={preselectedBranchId}
                preselectedSport={preselectedSport}
              />
            ) : (
              <BookingWizard
                branches={branches}
                currentUser={currentUser}
                onBookingSuccess={handleBookingSuccess}
                preselectedBranchId={preselectedBranchId}
                preselectedSport={preselectedSport}
                preselectedSlot={preselectedSlot}
              />
            )}

            {/* Interactive Availability Matrix */}
            <AvailabilityGrid
              branches={branches}
              onSelectSlotToBook={handleSelectSlotFromGrid}
            />

            {/* Community Lobby: Open Play & Unli Play */}
            <CommunityLobby
              branches={branches}
              currentUser={currentUser}
              onSessionJoined={(session) => {
                showToast(`Joined ${session.title}!`);
              }}
            />

            {/* Digital Paddle Rack: Live Queueing Board */}
            <QueueingBoard
              branches={branches}
              currentUser={currentUser}
            />

            {/* Certified Coaches Directory */}
            <CoachingSection currentUser={currentUser} />

            {/* Explore All Services */}
            <ServicesSection onSelectService={handleSelectService} />

            {/* Facility Locations & Rates */}
            <LocationsSection
              branches={branches}
              onSelectBranchForBooking={handleSelectBranchForBooking}
            />

            {/* Announcements & Tournaments */}
            <AnnouncementsSection />

            {/* Business & Franchise Partnership */}
            <PartnershipSection />

            {/* Membership Tiers */}
            <MembershipSection
              onSignUp={() => {
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
              onLogin={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.name}!`);
        }}
      />
    </div>
  );
}
