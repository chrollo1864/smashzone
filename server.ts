import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { db, Booking, Payment } from './server/db.ts';

// Real-Time Event Hub (Server-Sent Events)
interface ClientConnection {
  id: string;
  res: Response;
  branch_id?: string;
  date?: string;
  session_id?: string;
}

const clients: Map<string, ClientConnection> = new Map();

export function broadcastEvent(eventType: string, payload: any, branchId?: string, date?: string) {
  const eventData = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client, clientId) => {
    // If client is subscribed to a specific branch/date, filter accordingly; otherwise receive all
    const branchMatch = !client.branch_id || !branchId || client.branch_id === branchId;
    const dateMatch = !client.date || !date || client.date === date;

    if (branchMatch && dateMatch) {
      try {
        client.res.write(`event: ${eventType}\n`);
        client.res.write(`data: ${eventData}\n\n`);
      } catch (err) {
        clients.delete(clientId);
      }
    }
  });
}

import { initPostgres } from './server/pg.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Connect and verify PostgreSQL
  await initPostgres();

  // --- REAL-TIME SERVER-SENT EVENTS (SSE) STREAM ---
  app.get('/api/realtime/stream', (req: Request, res: Response) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const branchId = req.query.branch_id as string;
    const date = req.query.date as string;
    const sessionId = req.query.session_id as string;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, status: 'connected' })}\n\n`);

    const client: ClientConnection = {
      id: clientId,
      res,
      branch_id: branchId,
      date,
      session_id: sessionId,
    };

    clients.set(clientId, client);

    req.on('close', () => {
      clients.delete(clientId);
    });
  });

  // Background Cleaner: Sweep expired 10-minute holds every 4 seconds
  setInterval(() => {
    const expiredList = db.cleanExpiredHolds();
    if (expiredList.length > 0) {
      expiredList.forEach((b) => {
        broadcastEvent('booking_expired', { booking: b }, b.branch_id, b.booking_date);
        broadcastEvent('availability_updated', {
          branch_id: b.branch_id,
          booking_date: b.booking_date,
          court_id: b.court_id,
          time_slot: b.time_slot,
          status: 'AVAILABLE',
        }, b.branch_id, b.booking_date);
      });
    }
  }, 4000);

  // Keep-alive ping for SSE connections every 15s
  setInterval(() => {
    clients.forEach((client, clientId) => {
      try {
        client.res.write(': keepalive\n\n');
      } catch {
        clients.delete(clientId);
      }
    });
  }, 15000);

  // --- API ROUTES ---

  // Database Live Statistics
  app.get('/api/stats', (_req: Request, res: Response) => {
    const totalBookings = db.bookings.filter((b) => b.status === 'CONFIRMED').length + 1420;
    const registeredMembers = db.users.length + 865;
    const totalCourts = db.courts.length;
    const totalBranches = db.branches.length;
    const totalSessions = db.playSessions.length + 312;
    const totalCoaches = db.coaches.length;

    res.json({
      totalBookings,
      registeredMembers,
      totalCourts,
      totalBranches,
      totalSessions,
      totalCoaches,
    });
  });

  // Authentication
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, password, role = 'customer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      phone: phone || '+63 900 000 0000',
      password,
      role: role as any,
      wallet_balance: 500,
      membership_tier: 'Free' as const,
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    const { password: _, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser });
  });

  // Branches
  app.get('/api/branches', (_req: Request, res: Response) => {
    res.json(db.branches);
  });

  // Courts
  app.get('/api/courts', (req: Request, res: Response) => {
    const { branch_id, sport } = req.query;
    let filtered = db.courts;

    if (branch_id) {
      filtered = filtered.filter((c) => c.branch_id === branch_id);
    }
    if (sport) {
      filtered = filtered.filter((c) => c.sport === sport);
    }

    res.json(filtered);
  });

  // Schedule and court availability matrix with real-time states
  app.get('/api/availability', (req: Request, res: Response) => {
    db.cleanExpiredHolds();

    const { branch_id, date, sport, session_id } = req.query;
    const queryDate = (date as string) || new Date().toISOString().split('T')[0];
    const currentSessionId = (session_id as string) || '';

    let branchCourts = db.courts;
    if (branch_id) {
      branchCourts = branchCourts.filter((c) => c.branch_id === branch_id);
    }
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

    const grid = branchCourts.map((court) => {
      const slots = timeSlots.map((slot) => {
        const booked = db.getBookingForSlot(court.id, queryDate, slot);

        let status = 'Available';
        let detail = '';
        let expiresAt: number | undefined = undefined;
        let isHeldByMe = false;

        if (!court.is_active) {
          status = 'Blocked';
          detail = 'Maintenance';
        } else if (booked) {
          if (booked.status === 'CONFIRMED' || booked.status === 'COMPLETED') {
            status = 'Booked';
            detail = booked.reference_no;
          } else if (booked.status === 'PENDING_PAYMENT') {
            status = 'Awaiting';
            detail = 'Awaiting Payment';
            expiresAt = booked.expires_at;
            if (currentSessionId && booked.held_by_session === currentSessionId) {
              isHeldByMe = true;
            }
          }
        }

        return {
          slot,
          status,
          detail,
          rate: court.hourly_rate,
          expires_at: expiresAt,
          is_held_by_me: isHeldByMe,
          booking_id: booked?.id,
        };
      });

      return {
        court,
        slots,
      };
    });

    res.json({ date: queryDate, grid });
  });

  // Live Availability Summary (Total Available, Booked, Awaiting, Blocked, plus per-court counts)
  app.get('/api/availability/summary', (req: Request, res: Response) => {
    const { branch_id = 'b-valenzuela', date, sport } = req.query;
    const queryDate = (date as string) || new Date().toISOString().split('T')[0];
    const summary = db.getLiveAvailabilitySummary(branch_id as string, queryDate, sport as string);
    res.json(summary);
  });

  // Temporary 10-minute slot reservation
  app.post('/api/bookings/hold', (req: Request, res: Response) => {
    const {
      user_id = 'u-guest',
      user_name = 'Guest Athlete',
      user_email = 'guest@smashzone.ph',
      user_phone = '+63 900 000 0000',
      branch_id,
      court_id,
      sport,
      booking_date,
      time_slot,
      duration_hours = 1,
      equipment_addons = 0,
      voucher_code,
      session_id,
    } = req.body;

    if (!court_id || !booking_date || !time_slot) {
      return res.status(400).json({ error: 'Court, date, and time slot are required' });
    }

    const result = db.createTemporaryHold({
      user_id,
      user_name,
      user_email,
      user_phone,
      branch_id,
      court_id,
      sport,
      booking_date,
      time_slot,
      duration_hours,
      equipment_addons,
      voucher_code,
      session_id,
    });

    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }

    // Broadcast real-time availability update & pending booking to all users!
    broadcastEvent('booking_pending', {
      booking: result.booking,
      court_id,
      time_slot,
      booking_date,
      expires_at: result.booking?.expires_at,
    }, branch_id || result.booking?.branch_id, booking_date);

    broadcastEvent('availability_updated', {
      branch_id: branch_id || result.booking?.branch_id,
      booking_date,
      court_id,
      time_slot,
      status: 'AWAITING_PAYMENT',
      expires_at: result.booking?.expires_at,
    }, branch_id || result.booking?.branch_id, booking_date);

    res.status(201).json({
      success: true,
      booking: result.booking,
      payment: result.payment,
      expires_at: result.booking?.expires_at,
    });
  });

  // Release Temporary Hold
  app.post('/api/bookings/:id/release-hold', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = db.releaseHold(id, reason);
    if (!booking) {
      return res.status(404).json({ error: 'Booking hold not found or already processed' });
    }

    // Broadcast slot release to all users!
    broadcastEvent('booking_expired', { booking }, booking.branch_id, booking.booking_date);
    broadcastEvent('availability_updated', {
      branch_id: booking.branch_id,
      booking_date: booking.booking_date,
      court_id: booking.court_id,
      time_slot: booking.time_slot,
      status: 'AVAILABLE',
    }, booking.branch_id, booking.booking_date);

    res.json({ success: true, message: 'Hold released successfully' });
  });

  // Payment Webhook (PayMongo / GCash / Maya) - Idempotent Server Verification
  app.post('/api/payments/webhook', (req: Request, res: Response) => {
    const { booking_id, payment_provider = 'paymongo_sandbox', payment_reference } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'Missing booking_id in webhook payload' });
    }

    const result = db.confirmPayment(booking_id, payment_provider, payment_reference);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const booking = result.booking!;

    // Broadcast instant real-time synchronization to ALL users across ALL dashboards!
    broadcastEvent('payment_completed', {
      booking_id: booking.id,
      reference_no: booking.reference_no,
      amount: booking.total_amount,
      provider: payment_provider,
    }, booking.branch_id, booking.booking_date);

    broadcastEvent('booking_confirmed', {
      booking,
    }, booking.branch_id, booking.booking_date);

    broadcastEvent('availability_updated', {
      branch_id: booking.branch_id,
      booking_date: booking.booking_date,
      court_id: booking.court_id,
      time_slot: booking.time_slot,
      status: 'BOOKED',
    }, booking.branch_id, booking.booking_date);

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking,
      payment: result.payment,
    });
  });

  // Sandbox One-Click Test Payment
  app.post('/api/payments/sandbox-pay', (req: Request, res: Response) => {
    const { booking_id, payment_provider = 'gcash' } = req.body;
    const paymentRef = `TXN-SANDBOX-${payment_provider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = db.confirmPayment(booking_id, payment_provider, paymentRef);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const booking = result.booking!;

    // Broadcast real-time events immediately
    broadcastEvent('payment_completed', {
      booking_id: booking.id,
      reference_no: booking.reference_no,
      amount: booking.total_amount,
      provider: payment_provider,
    }, booking.branch_id, booking.booking_date);

    broadcastEvent('booking_confirmed', {
      booking,
    }, booking.branch_id, booking.booking_date);

    broadcastEvent('availability_updated', {
      branch_id: booking.branch_id,
      booking_date: booking.booking_date,
      court_id: booking.court_id,
      time_slot: booking.time_slot,
      status: 'BOOKED',
    }, booking.branch_id, booking.booking_date);

    res.json({
      success: true,
      booking,
      payment: result.payment,
    });
  });

  // Bookings - List
  app.get('/api/bookings', (req: Request, res: Response) => {
    const { user_id, branch_id, status } = req.query;
    let list = db.bookings;

    if (user_id) {
      list = list.filter((b) => b.user_id === user_id);
    }
    if (branch_id) {
      list = list.filter((b) => b.branch_id === branch_id);
    }
    if (status) {
      list = list.filter((b) => b.status === status);
    }

    res.json(list);
  });

  // Cancel Booking
  app.post('/api/bookings/:id/cancel', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const branchId = booking.branch_id;
    const bookingDate = booking.booking_date;
    const courtId = booking.court_id;
    const timeSlot = booking.time_slot;

    const result = db.cancelBooking(id, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Broadcast cancellation and availability update to all users
    broadcastEvent('booking_cancelled', { booking_id: id }, branchId, bookingDate);
    broadcastEvent('availability_updated', {
      branch_id: branchId,
      booking_date: bookingDate,
      court_id: courtId,
      time_slot: timeSlot,
      status: 'AVAILABLE',
    }, branchId, bookingDate);

    res.json({ success: true, message: 'Reservation successfully cancelled and refunded.' });
  });

  // Reschedule Booking
  app.post('/api/bookings/:id/reschedule', (req: Request, res: Response) => {
    const { id } = req.params;
    const { new_date, new_time_slot } = req.body;

    const oldBooking = db.bookings.find((b) => b.id === id);
    const oldDate = oldBooking?.booking_date;
    const oldSlot = oldBooking?.time_slot;
    const courtId = oldBooking?.court_id;
    const branchId = oldBooking?.branch_id;

    const result = db.rescheduleBooking(id, new_date, new_time_slot);
    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }

    if (branchId && oldDate && oldSlot && courtId) {
      broadcastEvent('availability_updated', {
        branch_id: branchId,
        booking_date: oldDate,
        court_id: courtId,
        time_slot: oldSlot,
        status: 'AVAILABLE',
      }, branchId, oldDate);

      broadcastEvent('availability_updated', {
        branch_id: branchId,
        booking_date: new_date,
        court_id: courtId,
        time_slot: new_time_slot,
        status: 'BOOKED',
      }, branchId, new_date);
    }

    res.json({ success: true, booking: result.booking });
  });

  // Community Lobby: Open Play & Unli Play
  app.get('/api/sessions', (req: Request, res: Response) => {
    const { sport, branch_id, type } = req.query;
    let list = db.playSessions;

    if (sport && sport !== 'all') {
      list = list.filter((s) => s.sport === sport);
    }
    if (branch_id) {
      list = list.filter((s) => s.branch_id === branch_id);
    }
    if (type) {
      list = list.filter((s) => s.session_type === type);
    }

    res.json(list);
  });

  app.post('/api/sessions/:id/join', (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id = 'u-guest', user_name = 'Visiting Player' } = req.body;

    const result = db.joinPlaySession(id, user_id, user_name);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, session: result.session });
  });

  // Live Queueing System
  app.get('/api/queues', (req: Request, res: Response) => {
    const { branch_id, sport } = req.query;
    let list = db.queueEntries;

    if (branch_id) {
      list = list.filter((q) => q.branch_id === branch_id);
    }
    if (sport) {
      list = list.filter((q) => q.sport === sport);
    }

    res.json(list);
  });

  app.post('/api/queues/join', (req: Request, res: Response) => {
    const { branch_id, sport, player_names, team_name } = req.body;
    const entry = db.joinQueue(branch_id, sport, player_names, team_name);
    res.status(201).json(entry);
  });

  app.post('/api/queues/:id/leave', (req: Request, res: Response) => {
    const { id } = req.params;
    const success = db.leaveQueue(id);
    if (!success) return res.status(404).json({ error: 'Queue entry not found' });
    res.json({ success: true });
  });

  app.post('/api/queues/call-next', (req: Request, res: Response) => {
    const { branch_id, sport, court_name } = req.body;
    const entry = db.callNextQueue(branch_id, sport, court_name || 'Court 1');
    if (!entry) return res.status(404).json({ error: 'No players currently waiting in this queue' });
    res.json({ success: true, entry });
  });

  // Coaching
  app.get('/api/coaches', (req: Request, res: Response) => {
    const { sport } = req.query;
    let list = db.coaches;

    if (sport && sport !== 'all') {
      list = list.filter((c) => c.sports.includes(sport as any));
    }

    res.json(list);
  });

  app.post('/api/coaching/book', (req: Request, res: Response) => {
    const { coach_id, user_name, sport, date, time_slot, notes } = req.body;
    const coach = db.coaches.find((c) => c.id === coach_id);
    if (!coach) return res.status(404).json({ error: 'Coach not found' });

    coach.total_sessions += 1;

    res.json({
      success: true,
      session: {
        id: `cs-${Date.now()}`,
        coach_id,
        coach_name: coach.name,
        user_name,
        sport,
        date,
        time_slot,
        hourly_rate: coach.hourly_rate,
        status: 'CONFIRMED',
        notes,
      },
    });
  });

  // Announcements
  app.get('/api/announcements', (_req: Request, res: Response) => {
    res.json(db.announcements);
  });

  // Voucher validation
  app.post('/api/vouchers/verify', (req: Request, res: Response) => {
    const { code, amount } = req.body;
    const voucher = db.vouchers.find((v) => v.code.toUpperCase() === (code || '').toUpperCase() && v.is_active);

    if (!voucher) {
      return res.status(404).json({ error: 'Invalid or expired voucher code' });
    }

    if (amount && amount < voucher.min_spend) {
      return res.status(400).json({ error: `Minimum spend of ₱${voucher.min_spend} required for this code` });
    }

    const discount = amount ? Math.min((amount * voucher.discount_percent) / 100, voucher.max_discount) : 0;
    res.json({
      valid: true,
      code: voucher.code,
      discount_percent: voucher.discount_percent,
      discount_calculated: discount,
      description: voucher.description,
    });
  });

  // Admin Dashboard Metrics
  app.get('/api/admin/metrics', (_req: Request, res: Response) => {
    const totalRevenue = db.bookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((acc, curr) => acc + curr.total_amount, 0) + 128500;

    const totalBookingsCount = db.bookings.filter((b) => b.status === 'CONFIRMED').length + 480;
    const activeCourtsCount = db.courts.filter((c) => c.is_active).length;
    const pendingCount = db.bookings.filter((b) => b.status === 'PENDING_PAYMENT').length;

    res.json({
      totalRevenue,
      totalBookingsCount,
      activeCourtsCount,
      pendingCount,
      users: db.users,
      courts: db.courts,
      payments: db.payments,
      auditLogs: db.auditLogs.slice(0, 15),
    });
  });

  // Court toggle maintenance
  app.post('/api/admin/courts/:id/toggle', (req: Request, res: Response) => {
    const { id } = req.params;
    const court = db.courts.find((c) => c.id === id);
    if (!court) return res.status(404).json({ error: 'Court not found' });

    court.is_active = !court.is_active;

    broadcastEvent('availability_updated', {
      court_id: court.id,
      status: court.is_active ? 'AVAILABLE' : 'BLOCKED',
    }, court.branch_id);

    res.json({ success: true, court });
  });

  // --- VITE MIDDLEWARE ---
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ SmashZone real-time server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SmashZone server:', err);
});
