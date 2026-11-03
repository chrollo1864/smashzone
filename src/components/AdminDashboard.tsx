import React, { useState, useEffect } from 'react';
import { User, Court, Booking } from '../types';
import { ArrowLeft, ShieldCheck, DollarSign, Calendar, Users, AlertCircle, RefreshCw, CheckCircle2, Wrench, FileText, Check } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onBackToHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'courts' | 'bookings' | 'users' | 'audit'>('analytics');
  const [metrics, setMetrics] = useState<any>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState('');

  const fetchMetrics = () => {
    setIsLoading(true);
    fetch('/api/admin/metrics')
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error('Error fetching admin metrics:', err))
      .finally(() => setIsLoading(false));

    fetch('/api/bookings')
      .then((res) => res.json())
      .then((data) => setAllBookings(data))
      .catch((err) => console.error('Error fetching bookings:', err));
  };

  useEffect(() => {
    fetchMetrics();

    const es = new EventSource('/api/realtime/stream');
    es.addEventListener('booking_confirmed', () => fetchMetrics());
    es.addEventListener('payment_completed', () => fetchMetrics());
    es.addEventListener('booking_cancelled', () => fetchMetrics());
    es.addEventListener('booking_expired', () => fetchMetrics());
    es.addEventListener('booking_pending', () => fetchMetrics());

    return () => {
      es.close();
    };
  }, []);

  const handleToggleCourtMaintenance = async (courtId: string) => {
    try {
      const res = await fetch(`/api/admin/courts/${courtId}/toggle`, { method: 'POST' });
      if (res.ok) {
        setActionNotice('Court maintenance status updated.');
        fetchMetrics();
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch {
      setActionNotice('Failed to update court status');
    }
  };

  const filteredBookings = allBookings.filter(
    (b) => statusFilter === 'all' || b.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
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
              <div className="text-xs text-lime-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Executive Command Center</span>
              </div>
              <h1 className="text-2xl font-black text-white font-heading">
                SmashZone Facility Administration
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetrics}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-lime-400' : ''}`} />
            </button>
            <div className="bg-lime-950/80 border border-lime-500/30 text-lime-300 px-3 py-1.5 rounded-lg text-xs font-semibold">
              Admin Session: {currentUser.name}
            </div>
          </div>
        </div>

        {actionNotice && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-lime-500/40 text-lime-300 text-xs font-semibold">
            {actionNotice}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'analytics', label: 'Reports & Revenue' },
            { id: 'courts', label: 'Court Management' },
            { id: 'bookings', label: 'Master Bookings List' },
            { id: 'users', label: 'User Directory' },
            { id: 'audit', label: 'System Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ANALYTICS & REVENUE */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 font-medium">Total Gross Revenue</div>
                <div className="text-3xl font-black text-lime-400 mt-1 tabular-nums font-heading">
                  ₱{metrics?.totalRevenue?.toLocaleString() || '131,250'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">+14.2% month-over-month</div>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 font-medium">Total Bookings Completed</div>
                <div className="text-3xl font-black text-white mt-1 tabular-nums font-heading">
                  {metrics?.totalBookingsCount?.toLocaleString() || '482'}
                </div>
                <div className="text-[11px] text-lime-400 mt-1">98.4% fulfillment rate</div>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 font-medium">Active Operational Courts</div>
                <div className="text-3xl font-black text-white mt-1 tabular-nums font-heading">
                  {metrics?.activeCourtsCount || '28'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Across 4 facility hubs</div>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 font-medium">Pending Approvals</div>
                <div className="text-3xl font-black text-amber-400 mt-1 tabular-nums font-heading">
                  {metrics?.pendingCount || '0'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">All auto-confirmed</div>
              </div>
            </div>

            {/* Simulated Clean CSS Bar Chart of Booking Volume & Hub Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Booking Density Chart */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-1 font-heading">
                  Daily Court Hours Reserved (Last 7 Days)
                </h3>
                <p className="text-xs text-slate-400 mb-6">Peak hours: 18:00 to 22:00 weekdays</p>

                <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-800">
                  {[
                    { day: 'Mon', hours: 42, pct: 65 },
                    { day: 'Tue', hours: 48, pct: 75 },
                    { day: 'Wed', hours: 54, pct: 84 },
                    { day: 'Thu', hours: 50, pct: 78 },
                    { day: 'Fri', hours: 64, pct: 100 },
                    { day: 'Sat', hours: 62, pct: 96 },
                    { day: 'Sun', hours: 58, pct: 90 },
                  ].map((bar) => (
                    <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] text-slate-400 group-hover:text-lime-400 font-bold tabular-nums">
                        {bar.hours}h
                      </div>
                      <div
                        className="w-full bg-slate-800 group-hover:bg-lime-400 rounded-t-md transition-all duration-300"
                        style={{ height: `${bar.pct}%` }}
                      ></div>
                      <div className="text-xs text-slate-500 font-semibold">{bar.day}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue by Hub */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-1 font-heading">
                  Revenue Share by Facility Hub
                </h3>
                <p className="text-xs text-slate-400 mb-6">Valenzuela and BGC lead overall court receipts</p>

                <div className="space-y-4">
                  {[
                    { name: 'SmashZone Valenzuela Main Hub', rev: 48500, share: 38 },
                    { name: 'SmashZone BGC Central Arena', rev: 41200, share: 32 },
                    { name: 'SmashZone QC Araneta Hub', rev: 23800, share: 18 },
                    { name: 'SmashZone Makati Performance', rev: 17750, share: 12 },
                  ].map((hub) => (
                    <div key={hub.name}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-white">{hub.name}</span>
                        <span className="text-lime-400 tabular-nums">₱{hub.rev.toLocaleString()} ({hub.share}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-lime-400 h-full rounded-full"
                          style={{ width: `${hub.share}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COURT MANAGEMENT */}
        {activeTab === 'courts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Facility Courts Directory</h3>
                <p className="text-xs text-slate-400">
                  Toggle maintenance lockouts to prevent user bookings on specific courts.
                </p>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Court Name</th>
                    <th className="p-3.5">Sport</th>
                    <th className="p-3.5">Surface Specification</th>
                    <th className="p-3.5">Hourly Rate</th>
                    <th className="p-3.5">Operational Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {metrics?.courts?.map((court: Court) => (
                    <tr key={court.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-white">{court.court_name}</td>
                      <td className="p-3.5 capitalize text-slate-300">{court.sport}</td>
                      <td className="p-3.5 text-slate-400">{court.surface}</td>
                      <td className="p-3.5 font-bold text-white tabular-nums">₱{court.hourly_rate}/hr</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            court.is_active
                              ? 'bg-lime-500/20 text-lime-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {court.is_active ? 'OPERATIONAL' : 'MAINTENANCE LOCKED'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleCourtMaintenance(court.id)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold rounded-lg border border-slate-700 text-slate-200 transition"
                        >
                          {court.is_active ? 'Set Maintenance' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MASTER BOOKINGS LIST */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Master Bookings Log</h3>
                <p className="text-xs text-slate-400">Real-time log of customer court bookings.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-lime-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING_PAYMENT">Awaiting Payment</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Ref No.</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Court & Hub</th>
                    <th className="p-3.5">Schedule</th>
                    <th className="p-3.5">Total Paid</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-mono text-lime-400 font-bold">{b.reference_no}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{b.user_name}</div>
                        <div className="text-[10px] text-slate-500">{b.user_phone}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{b.court_name}</div>
                        <div className="text-[10px] text-slate-500">{b.branch_name}</div>
                      </td>
                      <td className="p-3.5 tabular-nums">
                        <div>{b.booking_date}</div>
                        <div className="text-[10px] text-slate-500">{b.time_slot}</div>
                      </td>
                      <td className="p-3.5 font-black text-white tabular-nums">₱{b.total_amount}</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.status === 'CONFIRMED'
                              ? 'bg-lime-500/20 text-lime-400'
                              : b.status === 'CANCELLED'
                              ? 'bg-red-500/20 text-red-400'
                              : b.status === 'PENDING_PAYMENT'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-heading">Registered Accounts</h3>
            <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Membership</th>
                    <th className="p-3.5">Wallet Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {metrics?.users?.map((u: User) => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-white">{u.name}</td>
                      <td className="p-3.5 text-slate-300">{u.email}</td>
                      <td className="p-3.5">
                        <span className="capitalize font-semibold text-lime-400">{u.role}</span>
                      </td>
                      <td className="p-3.5">{u.membership_tier} Tier</td>
                      <td className="p-3.5 font-bold tabular-nums text-white">₱{u.wallet_balance?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-heading">System Audit Logs</h3>
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-2">
              {metrics?.auditLogs?.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-lime-400 uppercase font-bold">
                        [{log.action}]
                      </span>
                      <span className="font-bold text-white">{log.user_name}</span>
                    </div>
                    <div className="text-slate-400">{log.details}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
