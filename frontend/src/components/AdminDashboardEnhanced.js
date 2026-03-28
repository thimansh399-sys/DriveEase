import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/AdminDashboardEnhanced.css';
import { buildApiUrl } from '../utils/network';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: '▣' },
  { key: 'bookings', label: 'Bookings', icon: '◎' },
  { key: 'drivers', label: 'Drivers', icon: '◉' },
  { key: 'customers', label: 'Customers', icon: '◌' },
  { key: 'support', label: 'Support', icon: '◇' },
  { key: 'finance', label: 'Finance', icon: '△' },
  { key: 'live', label: 'Live Tracking', icon: '◈' },
];

const statusColorClass = (status = '') => {
  const value = String(status).toLowerCase();
  if (value === 'completed' || value === 'resolved' || value === 'online') return 'good';
  if (value === 'pending' || value === 'open' || value === 'confirmed') return 'warn';
  if (value === 'cancelled' || value === 'rejected' || value === 'failed') return 'bad';
  return 'neutral';
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

export default function AdminDashboardEnhanced() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [dashboardData, setDashboardData] = useState(null);
  const [liveBookings, setLiveBookings] = useState([]);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportStats, setSupportStats] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  };

  const fetchJson = async (path) => {
    const response = await fetch(buildApiUrl(path), { headers: authHeaders });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || `Request failed for ${path}`);
    }
    return payload;
  };

  const fetchAllData = useCallback(async (isManual = false) => {
    try {
      setError('');
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [
        dashboardRes,
        liveBookingsRes,
        liveDriversRes,
        allBookingsRes,
        allDriversRes,
        customersRes,
        supportStatsRes,
        supportTicketsRes,
        financeRes,
      ] = await Promise.all([
        fetchJson('/admin-dashboard/stats'),
        fetchJson('/admin-dashboard/bookings/live'),
        fetchJson('/admin-dashboard/drivers/live-status'),
        fetchJson('/admin/bookings'),
        fetchJson('/admin/drivers/registrations?status=all'),
        fetchJson('/admin/customers'),
        fetchJson('/support-tickets/admin/stats'),
        fetchJson('/support-tickets/all?status=open'),
        fetchJson('/admin-dashboard/revenue/analytics'),
      ]);

      setDashboardData(dashboardRes?.stats || null);
      setLiveBookings(safeArray(liveBookingsRes?.bookings));
      setLiveDrivers(safeArray(liveDriversRes?.drivers));
      setAllBookings(safeArray(allBookingsRes));
      setAllDrivers(safeArray(allDriversRes));
      setCustomers(safeArray(customersRes));
      setSupportStats(supportStatsRes || null);
      setSupportTickets(safeArray(supportTicketsRes?.tickets));
      setRevenueAnalytics(financeRes?.analytics || null);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load CRM data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  const computed = useMemo(() => {
    const pendingBookings = allBookings.filter((b) => String(b?.status || '').toLowerCase() === 'pending').length;
    const confirmedBookings = allBookings.filter((b) => String(b?.status || '').toLowerCase() === 'confirmed').length;
    const activeDrivers = allDrivers.filter((d) => Boolean(d?.isOnline)).length;
    const pendingDrivers = allDrivers.filter((d) => String(d?.status || '').toLowerCase() === 'pending').length;
    const totalFinance = safeArray(allBookings)
      .filter((b) => String(b?.paymentStatus || '').toLowerCase() === 'completed')
      .reduce((sum, b) => sum + Number(b?.finalPrice || 0), 0);

    return {
      pendingBookings,
      confirmedBookings,
      activeDrivers,
      pendingDrivers,
      totalFinance,
    };
  }, [allBookings, allDrivers]);

  const renderDashboard = () => {
    const stats = dashboardData || {};
    return (
      <div className="crm-grid">
        <div className="crm-kpi-row">
          <article className="crm-kpi-card accent-a">
            <span>Total Bookings</span>
            <strong>{stats?.bookings?.total || allBookings.length || 0}</strong>
            <small>{computed.pendingBookings} pending, {computed.confirmedBookings} confirmed</small>
          </article>
          <article className="crm-kpi-card accent-b">
            <span>Drivers</span>
            <strong>{stats?.drivers?.total || allDrivers.length || 0}</strong>
            <small>{computed.activeDrivers} online, {computed.pendingDrivers} pending approval</small>
          </article>
          <article className="crm-kpi-card accent-c">
            <span>Customers</span>
            <strong>{stats?.customers?.total || customers.length || 0}</strong>
            <small>Live CRM audience</small>
          </article>
          <article className="crm-kpi-card accent-d">
            <span>Revenue</span>
            <strong>Rs {Math.round(stats?.revenue?.total || computed.totalFinance).toLocaleString('en-IN')}</strong>
            <small>This month: Rs {Math.round(stats?.revenue?.thisMonth || 0).toLocaleString('en-IN')}</small>
          </article>
        </div>

        <section className="crm-panel">
          <header className="crm-panel-head">
            <h3>Operational Snapshot</h3>
          </header>
          <div className="crm-badges">
            <span className="chip good">Live bookings: {liveBookings.length}</span>
            <span className="chip warn">Open support tickets: {supportTickets.length}</span>
            <span className="chip neutral">Online drivers: {safeArray(liveDrivers).filter((d) => d.isOnline).length}</span>
            <span className="chip good">Pending registrations: {computed.pendingDrivers}</span>
          </div>
        </section>
      </div>
    );
  };

  const renderBookings = () => (
    <section className="crm-panel">
      <header className="crm-panel-head">
        <h3>Bookings Module</h3>
      </header>
      <div className="crm-table">
        <div className="crm-thead">
          <span>ID</span>
          <span>Customer</span>
          <span>Driver</span>
          <span>Status</span>
          <span>Amount</span>
        </div>
        {allBookings.slice(0, 120).map((booking) => (
          <div className="crm-trow" key={String(booking?._id || booking?.bookingId)}>
            <span>{booking?.bookingId || String(booking?._id || '').slice(-6)}</span>
            <span>{booking?.customerId?.name || 'NA'}</span>
            <span>{booking?.driverId?.name || 'Unassigned'}</span>
            <span className={`status-tag ${statusColorClass(booking?.status)}`}>{booking?.status || 'NA'}</span>
            <span>Rs {Math.round(Number(booking?.finalPrice || booking?.estimatedPrice || 0)).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderDrivers = () => (
    <section className="crm-panel">
      <header className="crm-panel-head">
        <h3>Drivers Module</h3>
      </header>
      <div className="crm-cards-grid">
        {allDrivers.slice(0, 100).map((driver) => (
          <article className="mini-card" key={String(driver?._id)}>
            <h4>{driver?.name || 'Driver'}</h4>
            <p>{driver?.phone || 'NA'}</p>
            <div className="mini-row">
              <span className={`status-tag ${statusColorClass(driver?.status)}`}>{driver?.status || 'unknown'}</span>
              <span className={`status-tag ${driver?.isOnline ? 'good' : 'neutral'}`}>{driver?.isOnline ? 'online' : 'offline'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const renderCustomers = () => (
    <section className="crm-panel">
      <header className="crm-panel-head">
        <h3>Customers Module</h3>
      </header>
      <div className="crm-table">
        <div className="crm-thead">
          <span>Name</span>
          <span>Phone</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>
        {customers.slice(0, 200).map((customer) => (
          <div className="crm-trow" key={String(customer?._id)}>
            <span>{customer?.name || 'NA'}</span>
            <span>{customer?.phone || 'NA'}</span>
            <span>{customer?.email || 'NA'}</span>
            <span>{customer?.role || 'customer'}</span>
            <span className={`status-tag ${statusColorClass(customer?.status || 'active')}`}>{customer?.status || 'active'}</span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSupport = () => {
    const counts = supportStats?.stats || {};
    return (
      <div className="crm-grid">
        <div className="crm-kpi-row">
          <article className="crm-kpi-card accent-b"><span>Open</span><strong>{counts.openTickets || 0}</strong></article>
          <article className="crm-kpi-card accent-c"><span>In Progress</span><strong>{counts.inProgressTickets || 0}</strong></article>
          <article className="crm-kpi-card accent-d"><span>Resolved</span><strong>{counts.resolvedTickets || 0}</strong></article>
        </div>

        <section className="crm-panel">
          <header className="crm-panel-head">
            <h3>Support Module</h3>
          </header>
          <div className="crm-table">
            <div className="crm-thead">
              <span>Ticket</span>
              <span>User</span>
              <span>Issue</span>
              <span>Status</span>
              <span>Updated</span>
            </div>
            {supportTickets.slice(0, 80).map((ticket) => (
              <div className="crm-trow" key={String(ticket?._id)}>
                <span>{ticket?.ticketId || String(ticket?._id || '').slice(-6)}</span>
                <span>{ticket?.userId?.name || 'NA'}</span>
                <span>{ticket?.subject || 'General issue'}</span>
                <span className={`status-tag ${statusColorClass(ticket?.status)}`}>{ticket?.status || 'open'}</span>
                <span>{ticket?.updatedAt ? new Date(ticket.updatedAt).toLocaleString('en-IN') : 'NA'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderFinance = () => {
    const cityRevenue = safeArray(revenueAnalytics?.cityRevenue);
    const dailyRevenue = safeArray(revenueAnalytics?.dailyRevenue);
    return (
      <div className="crm-grid">
        <section className="crm-panel">
          <header className="crm-panel-head">
            <h3>Finance Module</h3>
          </header>
          <div className="crm-kpi-row compact">
            <article className="crm-kpi-card accent-a">
              <span>Gross Collected</span>
              <strong>Rs {Math.round(computed.totalFinance).toLocaleString('en-IN')}</strong>
            </article>
            <article className="crm-kpi-card accent-c">
              <span>Revenue Days</span>
              <strong>{dailyRevenue.length}</strong>
            </article>
            <article className="crm-kpi-card accent-d">
              <span>Top Cities</span>
              <strong>{cityRevenue.length}</strong>
            </article>
          </div>
        </section>

        <section className="crm-panel">
          <header className="crm-panel-head">
            <h3>Top Revenue Cities</h3>
          </header>
          <div className="crm-table">
            <div className="crm-thead">
              <span>City</span>
              <span>Revenue</span>
              <span>Bookings</span>
              <span>Avg Ticket</span>
            </div>
            {cityRevenue.map((cityRow) => {
              const revenue = Number(cityRow?.revenue || 0);
              const bookings = Number(cityRow?.bookings || 0);
              const avg = bookings > 0 ? revenue / bookings : 0;
              return (
                <div className="crm-trow" key={String(cityRow?._id || 'unknown')}>
                  <span>{cityRow?._id || 'Unknown'}</span>
                  <span>Rs {Math.round(revenue).toLocaleString('en-IN')}</span>
                  <span>{bookings}</span>
                  <span>Rs {Math.round(avg).toLocaleString('en-IN')}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  const renderLive = () => (
    <div className="crm-grid two-col">
      <section className="crm-panel">
        <header className="crm-panel-head">
          <h3>Live Bookings</h3>
        </header>
        <div className="crm-table">
          <div className="crm-thead">
            <span>Ride ID</span>
            <span>Customer</span>
            <span>Driver</span>
            <span>Status</span>
            <span>OTP</span>
          </div>
          {liveBookings.slice(0, 80).map((ride) => (
            <div className="crm-trow" key={String(ride?.bookingId)}>
              <span>{ride?.rideId || String(ride?.bookingId || '').slice(-6)}</span>
              <span>{ride?.customer || 'NA'}</span>
              <span>{ride?.driver || 'NA'}</span>
              <span className={`status-tag ${statusColorClass(ride?.status)}`}>{ride?.status || 'pending'}</span>
              <span className={`status-tag ${ride?.otpVerified ? 'good' : 'warn'}`}>{ride?.otpVerified ? 'verified' : 'pending'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="crm-panel">
        <header className="crm-panel-head">
          <h3>Driver Live Tracking</h3>
        </header>
        <div className="crm-cards-grid">
          {liveDrivers.slice(0, 120).map((driver) => (
            <article className="mini-card" key={String(driver?.driverId)}>
              <h4>{driver?.name || 'Driver'}</h4>
              <p>{driver?.phone || 'NA'}</p>
              <div className="mini-row">
                <span className={`status-tag ${driver?.isOnline ? 'good' : 'neutral'}`}>{driver?.isOnline ? 'online' : 'offline'}</span>
                <span>{driver?.totalRides || 0} rides</span>
              </div>
              <small>
                {driver?.location?.city || 'Unknown city'} {driver?.location?.state ? `, ${driver.location.state}` : ''}
              </small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderModule = () => {
    if (activeModule === 'dashboard') return renderDashboard();
    if (activeModule === 'bookings') return renderBookings();
    if (activeModule === 'drivers') return renderDrivers();
    if (activeModule === 'customers') return renderCustomers();
    if (activeModule === 'support') return renderSupport();
    if (activeModule === 'finance') return renderFinance();
    if (activeModule === 'live') return renderLive();
    return null;
  };

  return (
    <div className="crm-shell">
      <aside className="crm-sidebar">
        <div className="crm-brand">
          <h1>DriveEase CRM</h1>
          <p>Ops Control Portal</p>
        </div>
        <nav className="crm-nav">
          {MODULES.map((module) => (
            <button
              key={module.key}
              type="button"
              className={`crm-nav-item ${activeModule === module.key ? 'active' : ''}`}
              onClick={() => setActiveModule(module.key)}
            >
              <span>{module.icon}</span>
              <span>{module.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="crm-main">
        <header className="crm-header">
          <div>
            <h2>{MODULES.find((module) => module.key === activeModule)?.label || 'Dashboard'}</h2>
            <p>Screenshot-style full CRM portal with real operational metrics</p>
          </div>
          <button
            type="button"
            className="crm-refresh"
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        {loading ? (
          <section className="crm-loader">Loading CRM data...</section>
        ) : error ? (
          <section className="crm-error">{error}</section>
        ) : (
          renderModule()
        )}
      </main>
    </div>
  );
}
