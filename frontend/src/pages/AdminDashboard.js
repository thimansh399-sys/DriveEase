import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import '../styles/UnifiedUI.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pendingDrivers = useMemo(
    () => drivers.filter((driver) => String(driver.status || '').toLowerCase() === 'pending'),
    [drivers]
  );

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingsRes, driversRes] = await Promise.all([
        api.getAllBookings(),
        api.getAllDrivers('?status=all'),
      ]);

      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setDrivers(Array.isArray(driversRes) ? driversRes : []);
    } catch {
      setError('Failed to load admin data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveDriver = async (id) => {
    setError('');
    try {
      await api.approveDriver(id);
      fetchData();
    } catch {
      setError('Driver approval failed.');
    }
  };

  const rejectDriver = async (id) => {
    setError('');
    try {
      await api.rejectDriver(id, 'Rejected by admin');
      fetchData();
    } catch {
      setError('Driver rejection failed.');
    }
  };

  return (
    <div className="ux-page ux-admin-page">
      <div className="ux-container">
        <h1 className="ux-admin-title">Admin Panel</h1>
        <p className="ux-admin-subtitle">View bookings, manage drivers, and approve new registrations.</p>

        <div className="ux-tabs">
          {[
            { id: 'bookings', label: 'Bookings' },
            { id: 'drivers', label: 'Manage Drivers' },
            { id: 'approvals', label: `Approve Drivers (${pendingDrivers.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ux-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="ux-alert error">{error}</div>}
        {loading && <div className="ux-muted">Loading...</div>}

        {!loading && activeTab === 'bookings' && (
          <div className="ux-section">
            <h2 className="ux-section-title">Bookings</h2>
            {bookings.length === 0 ? (
              <p className="ux-muted">No bookings found.</p>
            ) : (
              <div className="ux-table-wrap">
                <table className="ux-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Driver</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 30).map((booking) => (
                    <tr key={booking._id}>
                      <td>{booking.bookingId || '-'}</td>
                      <td>{booking.customerId?.name || '-'}</td>
                      <td>{booking.driverId?.name || 'Unassigned'}</td>
                      <td>{booking.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'drivers' && (
        <div className="ux-section">
          <h2 className="ux-section-title">Manage Drivers</h2>
          <div className="ux-admin-grid">
            {drivers.map((driver) => (
              <div key={driver._id} className="ux-admin-card">
                <h3 style={{ margin: '0 0 6px 0' }}>{driver.name || '-'}</h3>
                <p className="ux-line">Phone: {driver.phone || '-'}</p>
                <p className="ux-line">Status: {driver.status || '-'}</p>
                <p className="ux-line">Online: {driver.isOnline ? 'Yes' : 'No'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && activeTab === 'approvals' && (
        <div className="ux-section">
          <h2 className="ux-section-title">Approve Drivers</h2>
          {pendingDrivers.length === 0 ? (
            <p className="ux-muted">No pending drivers.</p>
          ) : (
            <div className="ux-admin-grid">
              {pendingDrivers.map((driver) => (
                <div key={driver._id} className="ux-admin-card">
                  <h3 style={{ margin: '0 0 6px 0' }}>{driver.name || '-'}</h3>
                  <p className="ux-line">Phone: {driver.phone || '-'}</p>
                  <p className="ux-line">City: {driver.personalDetails?.city || '-'}</p>
                  <div className="ux-action-row">
                    <button className="ux-btn primary full" onClick={() => approveDriver(driver._id)}>
                      Approve
                    </button>
                    <button className="ux-btn reject full" onClick={() => rejectDriver(driver._id)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default AdminDashboard;
