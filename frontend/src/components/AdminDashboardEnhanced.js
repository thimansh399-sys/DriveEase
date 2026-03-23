import React, { useState, useEffect, useRef } from 'react';
import '../styles/AdminDashboardEnhanced.css';

export default function AdminDashboardEnhanced() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [liveBookings, setLiveBookings] = useState([]);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const audioRef = useRef(new Audio('/notification.mp3'));
  const refreshIntervalRef = useRef(null);

  // Fetch dashboard stats (no auto-refresh, manual only)
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setDashboardData(data.stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
    }
  };

  // Fetch pending registrations
  const fetchPendingRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/registrations/pending`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setPendingRegistrations(data.registrations);
      
      // Play notification if new pending registrations
      if (data.registrations.length > 0 && soundEnabled) {
        playNotificationSound();
      }
    } catch (error) {
      console.error('Registrations error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch live bookings
  const fetchLiveBookings = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/bookings/live`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setLiveBookings(data.bookings);
    } catch (error) {
      console.error('Live bookings error:', error);
    }
  };

  // Fetch live driver locations
  const fetchLiveDrivers = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/drivers/live-status`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setLiveDrivers(data.drivers);
    } catch (error) {
      console.error('Live drivers error:', error);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      audioRef.current.play();
    } catch (error) {
      console.error('Audio play error:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardStats();
    fetchPendingRegistrations();
    fetchLiveBookings();
    fetchLiveDrivers();
  }, []);

  // Setup manual refresh based on tab (no auto-refresh, user triggered)
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleApprovePayment = async (driverId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/drivers/${driverId}/payment/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ adminNotes: 'Approved by admin' })
        }
      );

      if (response.ok) {
        fetchPendingRegistrations();
        setSelectedRegistration(null);
        playNotificationSound();
      }
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  const handleRejectPayment = async (driverId, reason) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/drivers/${driverId}/payment/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );

      if (response.ok) {
        fetchPendingRegistrations();
        setSelectedRegistration(null);
      }
    } catch (error) {
      console.error('Rejection error:', error);
    }
  };

  // Update dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.style.setProperty('--background-color', '#121212');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      root.style.setProperty('--background-color', '#ffffff');
      root.style.setProperty('--text-color', '#000000');
    }
  }, [darkMode]);

  return (
    <div className={`admin-dashboard-enhanced ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1>DriveEase Admin Dashboard</h1>
          <p>Live operations management system</p>
        </div>
        <div className="header-right">
          <button
            className={`btn-settings ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle notification sounds"
          >
            🔔
          </button>
          <button
            className={`btn-settings ${darkMode ? 'active' : ''}`}
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle dark mode"
          >
            🌙
          </button>
          <button
            className="btn-refresh"
            onClick={() => {
              fetchDashboardStats();
              fetchPendingRegistrations();
              fetchLiveBookings();
              fetchLiveDrivers();
            }}
            title="Manual refresh - No auto-refresh to prevent interruption"
          >
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => { setActiveTab('registrations'); fetchPendingRegistrations(); }}
        >
          👤 Registrations {pendingRegistrations.length > 0 && <span className="badge">{pendingRegistrations.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('bookings'); fetchLiveBookings(); }}
        >
          🚗 Live Bookings
        </button>
        <button
          className={`tab ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('drivers'); fetchLiveDrivers(); }}
        >
          📍 Driver Tracking
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="dashboard-grid">
            {/* Stats Cards */}
            <div className="stats-row">
              <div className="stat-card drivers">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-label">Total Drivers</div>
                  <div className="stat-value">{dashboardData.drivers.total}</div>
                  <div className="stat-detail">
                    {dashboardData.drivers.approved} approved, {dashboardData.drivers.pending} pending
                  </div>
                </div>
              </div>

              <div className="stat-card online">
                <div className="stat-icon">🟢</div>
                <div className="stat-content">
                  <div className="stat-label">Online Now</div>
                  <div className="stat-value">{dashboardData.drivers.online}</div>
                  <div className="stat-detail">{dashboardData.drivers.offline} offline</div>
                </div>
              </div>

              <div className="stat-card bookings">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-label">Active Bookings</div>
                  <div className="stat-value">{dashboardData.bookings.pending}</div>
                  <div className="stat-detail">{dashboardData.bookings.completed} completed</div>
                </div>
              </div>

              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">This Month Revenue</div>
                  <div className="stat-value">₹{dashboardData.revenue.thisMonth.toLocaleString()}</div>
                  <div className="stat-detail">Total: ₹{dashboardData.revenue.total.toLocaleString()}</div>
                </div>
              </div>

              <div className="stat-card customers">
                <div className="stat-icon">👨‍💼</div>
                <div className="stat-content">
                  <div className="stat-label">Total Customers</div>
                  <div className="stat-value">{dashboardData.customers.total}</div>
                  <div className="stat-detail">Active users</div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="dashboard-info">
              <div className="info-box">
                <h3>📌 Quick Summary</h3>
                <ul>
                  <li>✓ System Status: <strong className="status-online">Online</strong></li>
                  <li>✓ Database Sync: <strong className="status-online">Active</strong></li>
                  <li>✓ Pending Approvals: <strong>{pendingRegistrations.length}</strong></li>
                  <li>✓ Active Rides: <strong>{liveBookings.filter(b => b.status === 'in_progress').length}</strong></li>
                </ul>
              </div>

              <div className="info-box">
                <h3>🔧 Settings</h3>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                  <span>Sound Notifications</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                  <span>Dark Mode</span>
                </label>
                <label className="setting-item info">
                  <span>💡 Manual refresh enabled - No auto-refresh to prevent interruption</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div className="registrations-view">
            <div className="view-header">
              <h2>Payment Verification Pending</h2>
              <p>{pendingRegistrations.length} drivers awaiting approval</p>
            </div>

            {pendingRegistrations.length === 0 ? (
              <div className="empty-state">
                <p>✓ No pending registrations</p>
              </div>
            ) : (
              <div className="registrations-table">
                {pendingRegistrations.map(reg => (
                  <div key={reg.driverId} className="registration-row">
                    <div className="reg-info">
                      <h4>{reg.name}</h4>
                      <p>{reg.phone} • {reg.email}</p>
                      <p className="timestamp">Submitted: {reg.submittedAt}</p>
                      <p className="wait-time">⏱️ {reg.waitTime}</p>
                    </div>

                    <div className="reg-screenshot">
                      <img src={reg.screenshotUrl} alt="Payment proof" />
                      <p className="screenshot-label">Payment Screenshot</p>
                    </div>

                    <div className="reg-vehicle">
                      <p><strong>Vehicle:</strong> {reg.vehicle?.model}</p>
                      <p><strong>Reg #:</strong> {reg.vehicle?.registrationNumber}</p>
                    </div>

                    <div className="reg-actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleApprovePayment(reg.driverId)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleRejectPayment(reg.driverId, 'Invalid screenshot')}
                      >
                        ✗ Reject
                      </button>
                      <button
                        className="btn-details"
                        onClick={() => setSelectedRegistration(reg)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-view">
            <div className="view-header">
              <h2>Live Bookings</h2>
              <p>{liveBookings.length} active bookings</p>
            </div>

            <div className="bookings-table">
              <div className="table-header">
                <div className="col-id">Booking ID</div>
                <div className="col-customer">Customer</div>
                <div className="col-driver">Driver</div>
                <div className="col-status">Status</div>
                <div className="col-price">Price</div>
                <div className="col-otp">OTP</div>
              </div>

              {liveBookings.map(booking => (
                <div key={booking.bookingId} className="table-row">
                  <div className="col-id">{booking.rideId.substring(0, 8)}</div>
                  <div className="col-customer">
                    {booking.customer}
                    <span className="city">{booking.pickupCity}</span>
                  </div>
                  <div className="col-driver">{booking.driver}</div>
                  <div className={`col-status status-${booking.status}`}>
                    {booking.status}
                  </div>
                  <div className="col-price">₹{booking.estimatedPrice}</div>
                  <div className={`col-otp ${booking.otpVerified ? 'verified' : ''}`}>
                    {booking.otpVerified ? '✓ Verified' : '⏳ Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver Tracking Tab */}
        {activeTab === 'drivers' && (
          <div className="drivers-view">
            <div className="view-header">
              <h2>Live Driver Tracking</h2>
              <p>{liveDrivers.filter(d => d.isOnline).length} drivers online</p>
            </div>

            <div className="drivers-list">
              {liveDrivers.map(driver => (
                <div key={driver.driverId} className={`driver-item ${driver.isOnline ? 'online' : 'offline'}`}>
                  <div className="driver-status-indicator"></div>
                  <div className="driver-info">
                    <h4>{driver.name}</h4>
                    <p>{driver.phone}</p>
                  </div>
                  <div className="driver-stats">
                    <span>Rides: {driver.totalRides}</span>
                    <span>Online: {driver.onlineHours.toFixed(1)}h</span>
                  </div>
                  <div className="driver-location">
                    📍 {driver.location?.city || 'Unknown'}, {driver.location?.state || ''}
                  </div>
                  <div className="driver-last-update">
                    Last update: {driver.lastLocationUpdate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRegistration && (
        <div className="modal-overlay" onClick={() => setSelectedRegistration(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedRegistration(null)}>×</button>
            <h3>{selectedRegistration.name} - Registration Details</h3>
            {/* Add detailed view content here */}
          </div>
        </div>
      )}
    </div>
  );
}
