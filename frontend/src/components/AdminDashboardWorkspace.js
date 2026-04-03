import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import '../styles/AdminDashboardWorkspace.css';
import { buildApiUrl } from '../utils/network';

const MODULES = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'kyc', label: 'KYC Verify' },
  { key: 'customers', label: 'Customers' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'liveDrivers', label: 'Live Drivers' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'settings', label: 'Settings' },
];

const safeArray = (value) => (Array.isArray(value) ? value : []);

const statusClass = (status = '') => {
  const value = String(status || '').toLowerCase();
  if (['approved', 'confirmed', 'completed', 'verified', 'online', 'resolved', 'active'].includes(value)) return 'good';
  if (['pending', 'open', 'in_progress', 'in progress'].includes(value)) return 'warn';
  if (['rejected', 'cancelled', 'blocked', 'failed', 'offline'].includes(value)) return 'bad';
  return 'neutral';
};

const formatCurrency = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateForFilter = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function AdminDashboardWorkspace() {
  const [activeModule, setActiveModule] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [clock, setClock] = useState(new Date());
  const [allBookings, setAllBookings] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportStats, setSupportStats] = useState(null);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [bookingFilters, setBookingFilters] = useState({
    customer: '',
    driver: '',
    bookingId: '',
    date: '',
  });

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  }), []);

  const fetchJson = useCallback(async (path) => {
    const response = await fetch(buildApiUrl(path), { headers: authHeaders });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || `Request failed for ${path}`);
    }
    return payload;
  }, [authHeaders]);

  const fetchAllData = useCallback(async (manual = false) => {
    try {
      setError('');
      if (manual) setRefreshing(true);
      else setLoading(true);

      const [
        bookingsRes,
        driversRes,
        customersRes,
        supportStatsRes,
        supportTicketsRes,
        liveDriversRes,
        financeRes,
        dashboardRes,
      ] = await Promise.all([
        fetchJson('/admin/bookings'),
        fetchJson('/admin/drivers/registrations?status=all'),
        fetchJson('/admin/customers'),
        fetchJson('/support-tickets/admin/stats'),
        fetchJson('/support-tickets/all?status=open'),
        fetchJson('/admin-dashboard/drivers/live-status'),
        fetchJson('/admin-dashboard/revenue/analytics'),
        fetchJson('/admin-dashboard/stats'),
      ]);

      setAllBookings(safeArray(bookingsRes));
      setAllDrivers(safeArray(driversRes));
      setCustomers(safeArray(customersRes));
      setSupportStats(supportStatsRes || null);
      setSupportTickets(safeArray(supportTicketsRes?.tickets));
      setLiveDrivers(safeArray(liveDriversRes?.drivers));
      setRevenueAnalytics(financeRes?.analytics || null);
      setDashboardData(dashboardRes?.stats || null);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autoSync) return undefined;
    const timer = setInterval(() => fetchAllData(true), 30000);
    return () => clearInterval(timer);
  }, [autoSync, fetchAllData]);

  const computed = useMemo(() => {
    const totalRevenue = allBookings
      .filter((item) => String(item?.paymentStatus || '').toLowerCase() === 'completed')
      .reduce((sum, item) => sum + Number(item?.finalPrice || item?.estimatedPrice || 0), 0);

    return {
      totalBookings: allBookings.length,
      pendingBookings: allBookings.filter((item) => String(item?.status || '').toLowerCase() === 'pending').length,
      confirmedBookings: allBookings.filter((item) => String(item?.status || '').toLowerCase() === 'confirmed').length,
      rejectedBookings: allBookings.filter((item) => ['rejected', 'cancelled'].includes(String(item?.status || '').toLowerCase())).length,
      pendingRegistrations: allDrivers.filter((item) => String(item?.status || '').toLowerCase() === 'pending').length,
      kycPending: allDrivers.filter((item) => String(item?.backgroundVerification?.status || '').toLowerCase() !== 'verified').length,
      liveDrivers: allDrivers.filter((item) => Boolean(item?.isOnline)).length,
      revenue: totalRevenue,
    };
  }, [allBookings, allDrivers]);

  const moduleCounts = useMemo(() => ({
    bookings: computed.totalBookings,
    drivers: allDrivers.length,
    registrations: computed.pendingRegistrations,
    kyc: computed.kycPending,
    customers: customers.length,
    enquiries: supportTickets.length,
    liveDrivers: computed.liveDrivers,
    revenue: Math.round(computed.revenue),
    pricing: 3,
    settings: 0,
  }), [allDrivers.length, computed, customers.length, supportTickets.length]);

  const pendingDrivers = useMemo(
    () => allDrivers.filter((driver) => String(driver?.status || '').toLowerCase() === 'pending'),
    [allDrivers]
  );

  const kycDrivers = useMemo(
    () => allDrivers.filter((driver) => String(driver?.backgroundVerification?.status || '').toLowerCase() !== 'verified'),
    [allDrivers]
  );

  const filteredBookings = useMemo(() => {
    return allBookings.filter((booking) => {
      const customerName = String(booking?.customerId?.name || '').toLowerCase();
      const driverName = String(booking?.driverId?.name || '').toLowerCase();
      const bookingId = String(booking?.bookingId || booking?._id || '').toLowerCase();
      const bookingDate = formatDateForFilter(booking?.createdAt || booking?.updatedAt);

      return customerName.includes(bookingFilters.customer.toLowerCase())
        && driverName.includes(bookingFilters.driver.toLowerCase())
        && bookingId.includes(bookingFilters.bookingId.toLowerCase())
        && (!bookingFilters.date || bookingDate === bookingFilters.date);
    });
  }, [allBookings, bookingFilters]);

  const handleApproveDriver = async (driverId) => {
    try {
      setError('');
      await api.approveDriver(driverId);
      await fetchAllData(true);
    } catch (approveError) {
      setError(approveError?.message || 'Unable to approve driver');
    }
  };

  const handleRejectDriver = async (driverId) => {
    try {
      setError('');
      await api.rejectDriver(driverId, 'Rejected by admin');
      await fetchAllData(true);
    } catch (rejectError) {
      setError(rejectError?.message || 'Unable to reject driver');
    }
  };

  const handleExportBookings = async () => {
    try {
      const blob = await api.exportBookingsToExcel();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `driveease-bookings-${Date.now()}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError?.message || 'Unable to export bookings');
    }
  };

  const renderBookings = () => (
    <section>
      <div className="adminw-stats-grid">
        <article className="adminw-stat-card"><span>Total</span><strong>{computed.totalBookings}</strong></article>
        <article className="adminw-stat-card"><span>Pending</span><strong className="warn-text">{computed.pendingBookings}</strong></article>
        <article className="adminw-stat-card"><span>Confirmed</span><strong className="good-text">{computed.confirmedBookings}</strong></article>
        <article className="adminw-stat-card"><span>Rejected</span><strong className="bad-text">{computed.rejectedBookings}</strong></article>
      </div>

      <div className="adminw-toolbar-row">
        <input type="text" placeholder="Search by customer name or" value={bookingFilters.customer} onChange={(e) => setBookingFilters((prev) => ({ ...prev, customer: e.target.value }))} className="adminw-input" />
        <input type="text" placeholder="Search by driver name..." value={bookingFilters.driver} onChange={(e) => setBookingFilters((prev) => ({ ...prev, driver: e.target.value }))} className="adminw-input" />
        <input type="text" placeholder="Search by booking ID" value={bookingFilters.bookingId} onChange={(e) => setBookingFilters((prev) => ({ ...prev, bookingId: e.target.value }))} className="adminw-input" />
        <input type="text" placeholder="dd-mm-yyyy" value={bookingFilters.date} onChange={(e) => setBookingFilters((prev) => ({ ...prev, date: e.target.value }))} className="adminw-input short" />
        <button type="button" className="adminw-light-btn" onClick={handleExportBookings}>Download CSV</button>
      </div>

      <div className="adminw-panel">
        {filteredBookings.length === 0 ? (
          <div className="adminw-empty">No bookings found</div>
        ) : (
          <div className="adminw-table">
            <div className="adminw-table-head bookings-grid">
              <span>Booking</span>
              <span>Customer</span>
              <span>Driver</span>
              <span>Status</span>
              <span>Amount</span>
              <span>Created</span>
            </div>
            {filteredBookings.slice(0, 150).map((booking) => (
              <div className="adminw-table-row bookings-grid" key={String(booking?._id || booking?.bookingId)}>
                <span>{booking?.bookingId || String(booking?._id || '').slice(-6)}</span>
                <span>{booking?.customerId?.name || 'NA'}</span>
                <span>{booking?.driverId?.name || 'Unassigned'}</span>
                <span className={`adminw-pill ${statusClass(booking?.status)}`}>{booking?.status || 'NA'}</span>
                <span>{formatCurrency(booking?.finalPrice || booking?.estimatedPrice || 0)}</span>
                <span>{formatDateTime(booking?.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const renderDrivers = () => (
    <div className="adminw-panel">
      <div className="adminw-table">
        <div className="adminw-table-head drivers-grid">
          <span>Name</span>
          <span>Phone</span>
          <span>Status</span>
          <span>Online</span>
          <span>City</span>
          <span>Vehicle</span>
        </div>
        {allDrivers.map((driver) => (
          <div className="adminw-table-row drivers-grid" key={String(driver?._id)}>
            <span>{driver?.name || 'NA'}</span>
            <span>{driver?.phone || 'NA'}</span>
            <span className={`adminw-pill ${statusClass(driver?.status)}`}>{driver?.status || 'unknown'}</span>
            <span className={`adminw-pill ${driver?.isOnline ? 'good' : 'neutral'}`}>{driver?.isOnline ? 'Yes' : 'No'}</span>
            <span>{driver?.personalDetails?.city || 'NA'}</span>
            <span>{driver?.vehicle?.model || driver?.vehicle?.registrationNumber || '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRegistrations = () => (
    <div className="adminw-card-grid">
      {pendingDrivers.length === 0 ? <div className="adminw-empty">No pending drivers</div> : pendingDrivers.map((driver) => (
        <article className="adminw-card" key={String(driver?._id)}>
          <div className="adminw-card-head">
            <h3>{driver?.name || 'Driver'}</h3>
            <span className="adminw-pill warn">Pending</span>
          </div>
          <p>Phone: {driver?.phone || 'NA'}</p>
          <p>City: {driver?.personalDetails?.city || 'NA'}</p>
          <p>Payment: {driver?.paymentVerification?.status || 'pending'}</p>
          <p>Selfie: {driver?.documents?.selfie?.file ? 'Uploaded' : 'Missing'}</p>
          <div className="adminw-actions">
            <button type="button" className="adminw-primary-btn" onClick={() => handleApproveDriver(driver._id)}>Approve</button>
            <button type="button" className="adminw-danger-btn" onClick={() => handleRejectDriver(driver._id)}>Reject</button>
          </div>
        </article>
      ))}
    </div>
  );

  const renderKyc = () => (
    <div className="adminw-panel">
      <div className="adminw-table">
        <div className="adminw-table-head kyc-grid">
          <span>Driver</span>
          <span>License</span>
          <span>Aadhaar</span>
          <span>Selfie</span>
          <span>Background</span>
          <span>Action</span>
        </div>
        {kycDrivers.map((driver) => (
          <div className="adminw-table-row kyc-grid" key={String(driver?._id)}>
            <span>{driver?.name || 'NA'}</span>
            <span className={`adminw-pill ${driver?.documents?.drivingLicense?.file ? 'good' : 'bad'}`}>{driver?.documents?.drivingLicense?.file ? 'Uploaded' : 'Missing'}</span>
            <span className={`adminw-pill ${driver?.documents?.aadhar?.file ? 'good' : 'bad'}`}>{driver?.documents?.aadhar?.file ? 'Uploaded' : 'Missing'}</span>
            <span className={`adminw-pill ${driver?.documents?.selfie?.file ? 'good' : 'bad'}`}>{driver?.documents?.selfie?.file ? 'Uploaded' : 'Missing'}</span>
            <span className={`adminw-pill ${statusClass(driver?.backgroundVerification?.status || 'pending')}`}>{driver?.backgroundVerification?.status || 'pending'}</span>
            <button type="button" className="adminw-primary-btn small" onClick={() => handleApproveDriver(driver._id)}>Verify</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="adminw-panel">
      <div className="adminw-table">
        <div className="adminw-table-head customers-grid">
          <span>Name</span>
          <span>Phone</span>
          <span>Email</span>
          <span>Status</span>
        </div>
        {customers.map((customer) => (
          <div className="adminw-table-row customers-grid" key={String(customer?._id)}>
            <span>{customer?.name || 'NA'}</span>
            <span>{customer?.phone || 'NA'}</span>
            <span>{customer?.email || 'NA'}</span>
            <span className={`adminw-pill ${statusClass(customer?.status || 'active')}`}>{customer?.status || 'active'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEnquiries = () => (
    <div className="adminw-panel">
      <div className="adminw-note">Open enquiries: {supportStats?.stats?.openTickets || supportTickets.length || 0}</div>
      <div className="adminw-table">
        <div className="adminw-table-head enquiries-grid">
          <span>Ticket</span>
          <span>User</span>
          <span>Subject</span>
          <span>Status</span>
          <span>Updated</span>
        </div>
        {supportTickets.map((ticket) => (
          <div className="adminw-table-row enquiries-grid" key={String(ticket?._id)}>
            <span>{ticket?.ticketId || String(ticket?._id || '').slice(-6)}</span>
            <span>{ticket?.userId?.name || 'NA'}</span>
            <span>{ticket?.subject || 'General enquiry'}</span>
            <span className={`adminw-pill ${statusClass(ticket?.status || 'open')}`}>{ticket?.status || 'open'}</span>
            <span>{formatDateTime(ticket?.updatedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLiveDrivers = () => {
    const list = safeArray(liveDrivers).length ? safeArray(liveDrivers) : allDrivers.filter((driver) => driver?.isOnline);
    return (
      <div className="adminw-card-grid">
        {list.length === 0 ? <div className="adminw-empty">No live drivers right now</div> : list.map((driver) => (
          <article className="adminw-card" key={String(driver?.driverId || driver?._id)}>
            <div className="adminw-card-head">
              <h3>{driver?.name || 'Driver'}</h3>
              <span className="adminw-pill good">Live</span>
            </div>
            <p>Phone: {driver?.phone || 'NA'}</p>
            <p>Rides: {driver?.totalRides || driver?.experience?.totalRides || 0}</p>
            <p>City: {driver?.location?.city || driver?.personalDetails?.city || 'NA'}</p>
            <p>State: {driver?.location?.state || driver?.personalDetails?.state || 'NA'}</p>
          </article>
        ))}
      </div>
    );
  };

  const renderRevenue = () => {
    const cityRevenue = safeArray(revenueAnalytics?.cityRevenue);
    return (
      <section>
        <div className="adminw-stats-grid">
          <article className="adminw-stat-card"><span>Total Revenue</span><strong>{formatCurrency(computed.revenue)}</strong></article>
          <article className="adminw-stat-card"><span>This Month</span><strong>{formatCurrency(dashboardData?.revenue?.thisMonth || 0)}</strong></article>
          <article className="adminw-stat-card"><span>Live Bookings</span><strong>{dashboardData?.bookings?.live || 0}</strong></article>
          <article className="adminw-stat-card"><span>Top Cities</span><strong>{cityRevenue.length}</strong></article>
        </div>
        <div className="adminw-panel">
          <div className="adminw-table">
            <div className="adminw-table-head revenue-grid">
              <span>City</span>
              <span>Revenue</span>
              <span>Bookings</span>
              <span>Average Ticket</span>
            </div>
            {cityRevenue.map((row) => {
              const revenue = Number(row?.revenue || 0);
              const bookings = Number(row?.bookings || 0);
              const avg = bookings > 0 ? revenue / bookings : 0;
              return (
                <div className="adminw-table-row revenue-grid" key={String(row?._id || 'unknown')}>
                  <span>{row?._id || 'Unknown'}</span>
                  <span>{formatCurrency(revenue)}</span>
                  <span>{bookings}</span>
                  <span>{formatCurrency(avg)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderPricing = () => (
    <div className="adminw-card-grid">
      {[
        { name: 'ZERO', amount: 'Rs 0', note: 'Starter plan for onboarding' },
        { name: 'GROWTH', amount: 'Rs 999', note: 'Mid-tier plan for active drivers' },
        { name: 'ELITE', amount: 'Rs 1999', note: 'Premium plan with priority exposure' },
      ].map((plan) => (
        <article className="adminw-card" key={plan.name}>
          <div className="adminw-card-head">
            <h3>{plan.name}</h3>
            <span className="adminw-pill neutral">Active</span>
          </div>
          <p>{plan.amount}</p>
          <p>{plan.note}</p>
        </article>
      ))}
    </div>
  );

  const renderSettings = () => (
    <div className="adminw-card-grid">
      <article className="adminw-card">
        <div className="adminw-card-head">
          <h3>Sync Settings</h3>
          <span className="adminw-pill neutral">System</span>
        </div>
        <p>Auto-sync every 30 seconds: {autoSync ? 'Enabled' : 'Disabled'}</p>
        <p>Backend status: Live from backend</p>
      </article>
      <article className="adminw-card">
        <div className="adminw-card-head">
          <h3>Admin Session</h3>
          <span className="adminw-pill good">Secure</span>
        </div>
        <p>Current time: {formatDateTime(clock)}</p>
        <p>Use Sync Now to refresh CRM data instantly.</p>
      </article>
    </div>
  );

  const renderActiveModule = () => {
    if (activeModule === 'bookings') return renderBookings();
    if (activeModule === 'drivers') return renderDrivers();
    if (activeModule === 'registrations') return renderRegistrations();
    if (activeModule === 'kyc') return renderKyc();
    if (activeModule === 'customers') return renderCustomers();
    if (activeModule === 'enquiries') return renderEnquiries();
    if (activeModule === 'liveDrivers') return renderLiveDrivers();
    if (activeModule === 'revenue') return renderRevenue();
    if (activeModule === 'pricing') return renderPricing();
    if (activeModule === 'settings') return renderSettings();
    return null;
  };

  return (
    <div className="adminw-shell">
      <aside className="adminw-sidebar">
        <div className="adminw-brand">
          <div className="adminw-brand-mark">DE</div>
          <div>
            <h1>DriveEase Admin</h1>
            <p>CRM Dashboard</p>
          </div>
        </div>

        <nav className="adminw-nav">
          {MODULES.map((module) => (
            <button
              key={module.key}
              type="button"
              className={`adminw-nav-item ${activeModule === module.key ? 'active' : ''}`}
              onClick={() => setActiveModule(module.key)}
            >
              <span>{module.label}</span>
              <span className="adminw-nav-count">{moduleCounts[module.key] || 0}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="adminw-logout"
          onClick={() => {
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('token');
            window.location.href = '/admin-login';
          }}
        >
          Logout
        </button>
      </aside>

      <main className="adminw-main">
        <header className="adminw-header">
          <div>
            <h2>{MODULES.find((module) => module.key === activeModule)?.label || 'Bookings'}</h2>
            <label className="adminw-sync-toggle">
              <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} />
              Auto-sync (30s)
            </label>
          </div>
          <div className="adminw-header-actions">
            <span className="adminw-live-indicator">Live from backend</span>
            <button type="button" className="adminw-sync-btn" onClick={() => fetchAllData(true)} disabled={refreshing}>
              {refreshing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button type="button" className="adminw-mode-btn">Mode</button>
            <span className="adminw-clock">{clock.toLocaleString('en-IN')}</span>
          </div>
        </header>

        {loading ? <section className="adminw-loading">Loading admin data...</section> : null}
        {error ? <section className="adminw-error">{error}</section> : null}
        {!loading && !error ? renderActiveModule() : null}
      </main>
    </div>
  );
}