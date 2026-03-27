import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import '../styles/DriverDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SOUND_PRESETS = {
  soft: { sequence: [740, 880], peakVolume: 0.07, stepGap: 0.16, toneDuration: 0.12 },
  loud: { sequence: [880, 1046, 1318], peakVolume: 0.18, stepGap: 0.12, toneDuration: 0.11 },
};

const DEFAULT_BOOKING_SOUND_MODE = 'soft';

const playBookingNotificationSound = (mode = 'soft') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const preset = SOUND_PRESETS[mode] || SOUND_PRESETS.soft;
    const now = ctx.currentTime;

    preset.sequence.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + index * preset.stepGap);
      gain.gain.exponentialRampToValueAtTime(preset.peakVolume, now + index * preset.stepGap + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * preset.stepGap + preset.toneDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * preset.stepGap);
      osc.stop(now + index * preset.stepGap + preset.toneDuration + 0.01);
    });

    setTimeout(() => {
      if (ctx.state !== 'closed') ctx.close();
    }, 700);
  } catch (error) {
    console.error('Notification sound blocked:', error);
  }
};

function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [earnings, setEarnings] = useState({});
  const [loading, setLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [newBookingCount, setNewBookingCount] = useState(0);
  const [bookingAlert, setBookingAlert] = useState('');
  const [otpByBooking, setOtpByBooking] = useState({});
  const [rideActionLoading, setRideActionLoading] = useState('');
  const previousPendingCountRef = useRef(0);
  const hasInitialFetchRef = useRef(false);

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'earnings') {
      fetchDriverData();
    }
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  // Poll for new bookings every 3 seconds for near real-time updates
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchDriverProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const driver = await api.getDriverById(userId);
        if (driver && !driver.error) {
          setDriverInfo(driver);
          setOnlineStatus(driver.isOnline || false);
        }
      }
    } catch (error) {
      console.error('Error fetching driver profile:', error);
    }
  };

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      const response = await api.getDriverEarnings();
      if (response && !response.error) {
        setEarnings(response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.getDriverBookings();
      const list = response?.bookings || (Array.isArray(response) ? response : []);
      const pending = list.filter(b => b.status === 'pending').length;

      // Trigger alert only for delta after first successful fetch.
      if (hasInitialFetchRef.current && pending > previousPendingCountRef.current) {
        const added = pending - previousPendingCountRef.current;
        const message = `${added} new booking request${added > 1 ? 's' : ''} received`;
        setBookingAlert(message);
        setTimeout(() => setBookingAlert(''), 5000);
        playBookingNotificationSound(DEFAULT_BOOKING_SOUND_MODE);
      }

      previousPendingCountRef.current = pending;
      hasInitialFetchRef.current = true;
      setNewBookingCount(pending);
      setBookings(list);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      const response = await api.respondToBooking(bookingId, action);
      if (response && !response.error) {
        alert(`Booking ${action}ed successfully!`);
        fetchBookings();
      } else {
        alert(response?.error || `Failed to ${action} booking`);
      }
    } catch (error) {
      alert(`Failed to ${action} booking`);
    }
  };

  const handleStartRide = async (bookingId) => {
    const otp = String(otpByBooking[bookingId] || '').trim();
    if (!otp) {
      alert('Enter the customer OTP to start the ride.');
      return;
    }

    try {
      setRideActionLoading(`start-${bookingId}`);
      const response = await api.startRideWithOTP(bookingId, otp);
      if (response?.success) {
        alert('Ride started successfully.');
        setOtpByBooking((prev) => ({ ...prev, [bookingId]: '' }));
        fetchBookings();
      } else {
        alert(response?.error || 'Unable to start ride.');
      }
    } catch (error) {
      alert(error?.message || 'Unable to start ride.');
    } finally {
      setRideActionLoading('');
    }
  };

  const handleCompleteRide = async (bookingId) => {
    try {
      setRideActionLoading(`complete-${bookingId}`);
      const response = await api.completeRide(bookingId);
      if (response?.success) {
        alert('Ride completed successfully.');
        fetchBookings();
      } else {
        alert(response?.error || 'Unable to complete ride.');
      }
    } catch (error) {
      alert(error?.message || 'Unable to complete ride.');
    } finally {
      setRideActionLoading('');
    }
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !onlineStatus;
    try {
      const response = await api.updateDriverStatus({ isOnline: newStatus });
      if (response && !response.error) {
        setOnlineStatus(newStatus);
        if (response.driver) setDriverInfo(response.driver);
      } else {
        alert(response?.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#16a34a';
      case 'cancelled': return '#ef4444';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#666';
    }
  };

  return (
    <div className="section">
      <div className="dd-header-row">
        <h1 style={{ marginBottom: '0' }}>🚗 Driver Dashboard</h1>
      </div>

      {bookingAlert && (
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
          <strong style={{ color: '#fcd34d' }}>🔔 {bookingAlert}</strong>
        </div>
      )}

      {/* Online Status Toggle */}
      <div className="card" style={{ marginBottom: '30px', backgroundColor: onlineStatus ? '#dcfce7' : '#f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0' }}>Your Status</h3>
            <p style={{ margin: '0', color: '#666' }}>Currently <strong>{onlineStatus ? '🟢 Online' : '🔘 Offline'}</strong></p>
          </div>
          <button
            onClick={toggleOnlineStatus}
            className="btn"
            style={{
              backgroundColor: onlineStatus ? '#ef4444' : '#16a34a',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {onlineStatus ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dd-tabs">
        {['dashboard', 'earnings', 'bookings', 'profile'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`dd-tab-btn ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'bookings' && newBookingCount > 0 && (
              <span className="dd-tab-badge">
                {newBookingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-4">
          <div className="card" style={{ backgroundColor: '#1a2332', borderLeft: '4px solid #16a34a' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>Today's Earnings</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₹0</p>
          </div>
          <div className="card" style={{ backgroundColor: '#1a2e1a', borderLeft: '4px solid #10b981' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Total Earnings</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₹{earnings.totalEarnings || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#2e2a1a', borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>Total Rides</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{earnings.totalRides || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>Online Hours</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>0 hrs</p>
          </div>
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="card">
          <h3>Earnings & Withdrawals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div style={{ padding: '20px', backgroundColor: '#1a2332', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 10px 0', color: '#666' }}>Available Balance</p>
              <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>
                ₹{earnings.totalEarnings || 0}
              </p>
            </div>
            <div>
              <button className="btn btn-primary" style={{ width: '100%' }}>
                Request Withdrawal
              </button>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Minimum withdrawal: ₹100
              </p>
            </div>
          </div>

          <h4>Payment Methods</h4>
          <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p><strong>Bank Account:</strong> {earnings.bankDetails?.accountNumber || 'Not added'}</p>
            <p><strong>UPI:</strong> {earnings.upiId || 'Not added'}</p>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          {/* New Booking Requests */}
          {bookings.filter(b => b.status === 'pending').length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h3 className="dd-section-title">🔔 New Booking Requests</h3>
              {bookings.filter(b => b.status === 'pending').map(booking => (
                <div key={booking._id} className="dd-request-card">
                  <div className="dd-request-top">
                    <span className="dd-request-id">#{booking.bookingId || booking._id?.slice(-6)}</span>
                    <span className="dd-request-price">₹{booking.estimatedPrice || booking.finalPrice || 0}</span>
                  </div>
                  <div className="dd-request-customer">
                    <span>👤</span>
                    <div>
                      <strong>{booking.customer?.name || booking.customerId?.name || 'Customer'}</strong>
                      <span className="dd-phone">{booking.customer?.phone || booking.customerId?.phone || ''}</span>
                    </div>
                  </div>
                  <div className="dd-request-route">
                    <div className="dd-route-point"><span className="dd-dot pickup"></span><span>{booking.pickupLocation?.address || 'N/A'}</span></div>
                    <div className="dd-route-line"></div>
                    <div className="dd-route-point"><span className="dd-dot drop"></span><span>{booking.dropLocation?.address || 'N/A'}</span></div>
                  </div>
                  <div className="dd-request-meta">
                    <span>📅 {booking.startDate ? new Date(booking.startDate).toLocaleString('en-IN') : 'N/A'}</span>
                    <span>🚗 {booking.bookingType} • {booking.numberOfDays || 1} day(s)</span>
                  </div>
                  {booking.notes && <p className="dd-request-notes">📝 {booking.notes}</p>}
                  <div className="dd-request-actions">
                    <button className="dd-btn accept" onClick={() => handleBookingAction(booking._id, 'accept')}>✅ Accept</button>
                    <button className="dd-btn reject" onClick={() => handleBookingAction(booking._id, 'reject')}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rides History */}
          <h3 className="dd-section-title">📋 All Rides</h3>
          {bookings.length === 0 ? (
            <div className="dd-empty">
              <span>🚗</span>
              <p>No bookings yet. Go online to receive rides!</p>
            </div>
          ) : (
            <div className="dd-rides-list">
              {bookings.map(booking => {
                const earning = booking.rideFlow?.driverEarning || booking.finalPrice || booking.estimatedPrice || 0;
                const statusLabel = booking.status?.replace(/_/g, ' ').toUpperCase();
                return (
                  <div key={booking._id} className={`dd-ride-card ${booking.status === 'in_progress' || booking.status === 'driver_arrived' || booking.status === 'otp_verified' ? 'active' : ''}`}>
                    <div className="dd-ride-top">
                      <div className="dd-ride-id-group">
                        <span className="dd-ride-id">#{booking.bookingId || booking._id?.slice(-6)}</span>
                        <span className="dd-ride-date">{booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-IN') : ''}</span>
                      </div>
                      <div className="dd-ride-right">
                        {booking.insurance?.opted && <span className="dd-insurance-badge">🛡️</span>}
                        {booking.rideFlow?.isPeakRide && <span className="dd-peak-badge">🔥 Peak</span>}
                        <span className={`dd-ride-status ${booking.status?.replace(/_/g, '-')}`}>{statusLabel}</span>
                      </div>
                    </div>
                    <div className="dd-ride-customer">
                      <span className="dd-ride-avatar">👤</span>
                      <div>
                        <span className="dd-customer-name">{booking.customer?.name || booking.customerId?.name || 'Customer'}</span>
                        <span className="dd-customer-phone">{booking.customer?.phone || booking.customerId?.phone || ''}</span>
                      </div>
                    </div>
                    <div className="dd-ride-route">
                      <div className="dd-route-point"><span className="dd-dot pickup"></span><span>{booking.pickupLocation?.address || 'N/A'}</span></div>
                      <div className="dd-route-line"></div>
                      <div className="dd-route-point"><span className="dd-dot drop"></span><span>{booking.dropLocation?.address || 'N/A'}</span></div>
                    </div>
                    <div className="dd-ride-footer">
                      <div className="dd-ride-meta">
                        <span>{booking.bookingType}</span>
                        {booking.rideFlow?.commissionRate && <span>Commission: {booking.rideFlow.commissionRate}%</span>}
                      </div>
                      <span className="dd-ride-earning">₹{earning}</span>
                    </div>
                    {booking.status === 'confirmed' && (
                      <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="Enter customer OTP"
                          value={otpByBooking[booking._id] || ''}
                          onChange={(event) => setOtpByBooking((prev) => ({ ...prev, [booking._id]: event.target.value.replace(/\D/g, '').slice(0, 4) }))}
                          style={{
                            flex: '1 1 170px',
                            minWidth: '170px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(147, 197, 253, 0.3)',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            color: '#fff'
                          }}
                        />
                        <button
                          className="dd-btn accept"
                          onClick={() => handleStartRide(booking._id)}
                          disabled={rideActionLoading === `start-${booking._id}`}
                        >
                          {rideActionLoading === `start-${booking._id}` ? 'Starting...' : 'Start Ride'}
                        </button>
                      </div>
                    )}
                    {booking.status === 'in_progress' && (
                      <div style={{ marginTop: '14px' }}>
                        <button
                          className="dd-btn accept"
                          onClick={() => handleCompleteRide(booking._id)}
                          disabled={rideActionLoading === `complete-${booking._id}`}
                        >
                          {rideActionLoading === `complete-${booking._id}` ? 'Completing...' : 'Complete Ride'}
                        </button>
                      </div>
                    )}
                    {booking.feedback?.rating && (
                      <div className="dd-ride-feedback">⭐ {booking.feedback.rating}/5 {booking.feedback.comment && `— "${booking.feedback.comment}"`}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3>Driver Profile</h3>
          
          {/* Profile Picture */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={driverInfo?.profilePicture 
                  ? `http://localhost:5000/${driverInfo.profilePicture}` 
                  : 'https://randomuser.me/api/portraits/men/31.jpg'}
                alt="Profile"
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #16a34a' }}
              />
              <label style={{
                position: 'absolute', bottom: '0', right: '0',
                backgroundColor: '#16a34a', color: '#fff', borderRadius: '50%',
                width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '18px', border: '2px solid #fff'
              }}>
                📷
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB allowed'); return; }
                    try {
                      const res = await api.updateProfilePicture(file);
                      if (res.profilePicture) {
                        setDriverInfo(prev => ({ ...prev, profilePicture: res.profilePicture }));
                        alert('Profile picture updated!');
                      } else {
                        alert(res.error || 'Upload failed');
                      }
                    } catch { alert('Upload failed'); }
                  }}
                />
              </label>
            </div>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>Click 📷 to change photo</p>
          </div>

          {/* Driver Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Name</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.name || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Phone</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.phone || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Email</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.email || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Status</p>
              <p style={{ margin: 0, fontWeight: 'bold', color: driverInfo?.status === 'approved' ? '#16a34a' : '#f59e0b' }}>
                {driverInfo?.status?.toUpperCase() || 'PENDING'}
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Current Location</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                {driverInfo?.currentLocation?.city || '-'}
                {driverInfo?.currentLocation?.state ? `, ${driverInfo.currentLocation.state}` : ''}
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Pincode</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.currentLocation?.pincode || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Coordinates</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                {driverInfo?.currentLocation?.latitude && driverInfo?.currentLocation?.longitude
                  ? `${Number(driverInfo.currentLocation.latitude).toFixed(4)}, ${Number(driverInfo.currentLocation.longitude).toFixed(4)}`
                  : '-'}
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Aadhaar</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.aadhaarNumber || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>License</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.licenseNumber || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
