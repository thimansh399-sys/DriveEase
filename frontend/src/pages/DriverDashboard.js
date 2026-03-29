import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/api';
import { downloadInvoice } from '../utils/invoiceUtils';
import { STATE_OPTIONS } from '../utils/locationData';
import '../styles/DriverDashboard.css';

const SOUND_PRESETS = {
  soft: { sequence: [740, 880], peakVolume: 0.07, stepGap: 0.16, toneDuration: 0.12 },
  loud: { sequence: [880, 1046, 1318], peakVolume: 0.18, stepGap: 0.12, toneDuration: 0.11 }
};

const ACTIVE_RIDE_STATUSES = ['confirmed', 'driver_assigned', 'driver_arrived', 'otp_verified', 'in_progress'];

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

const groupByDay = (rides) => {
  return rides.reduce((acc, ride) => {
    const key = new Date(ride.updatedAt || ride.endDate || ride.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    if (!acc[key]) acc[key] = [];
    acc[key].push(ride);
    return acc;
  }, {});
};

function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [driverInfo, setDriverInfo] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState({});
  const [newBookingCount, setNewBookingCount] = useState(0);
  const [bookingAlert, setBookingAlert] = useState('');
  const [otpByBooking, setOtpByBooking] = useState({});
  const [rideActionLoading, setRideActionLoading] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [mapToggleByRide, setMapToggleByRide] = useState({});
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    bloodGroup: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const previousPendingCountRef = useRef(0);
  const hasInitialFetchRef = useRef(false);

  useEffect(() => {
    fetchDriverProfile();
    fetchDriverData();
    fetchBookings();

    const interval = setInterval(fetchBookings, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchDriverProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      const driver = await api.getDriverById(userId);
      if (driver && !driver.error) {
        setDriverInfo(driver);
        setOnlineStatus(Boolean(driver.isOnline));
        setProfileForm({
          name: driver.name || '',
          email: driver.email || '',
          bloodGroup: driver.personalDetails?.bloodGroup || '',
          address: driver.personalDetails?.address || '',
          city: driver.personalDetails?.city || driver.currentLocation?.city || '',
          state: driver.personalDetails?.state || driver.currentLocation?.state || '',
          pincode: driver.personalDetails?.pincode || driver.currentLocation?.pincode || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      const response = await api.updateDriverProfile(profileForm);
      if (response?.error) {
        throw new Error(response.error);
      }
      await fetchDriverProfile();
      alert('Profile updated successfully.');
    } catch (error) {
      alert(error?.message || 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const fetchDriverData = async () => {
    try {
      const response = await api.getDriverEarnings();
      if (response && !response.error) {
        setEarnings(response);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.getDriverBookings();
      const list = response?.bookings || (Array.isArray(response) ? response : []);
      const pending = list.filter((item) => item.status === 'pending').length;

      if (hasInitialFetchRef.current && pending > previousPendingCountRef.current) {
        const added = pending - previousPendingCountRef.current;
        setBookingAlert(`${added} new booking request${added > 1 ? 's' : ''} received`);
        setTimeout(() => setBookingAlert(''), 5000);
        playBookingNotificationSound('soft');
      }

      previousPendingCountRef.current = pending;
      hasInitialFetchRef.current = true;
      setNewBookingCount(pending);
      setBookings(list);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const pendingRequests = useMemo(() => bookings.filter((item) => item.status === 'pending'), [bookings]);
  const activeRides = useMemo(() => bookings.filter((item) => ACTIVE_RIDE_STATUSES.includes(item.status)), [bookings]);
  const completedRides = useMemo(
    () => bookings.filter((item) => item.status === 'completed').sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
    [bookings]
  );

  const completedGrouped = useMemo(() => groupByDay(completedRides), [completedRides]);

  const handleBookingAction = async (bookingId, action) => {
    try {
      const response = await api.respondToBooking(bookingId, action);
      if (response && !response.error) {
        fetchBookings();
      } else {
        alert(response?.error || `Failed to ${action} booking`);
      }
    } catch (error) {
      alert(`Failed to ${action} booking`);
    }
  };

  const handleMarkArrived = async (bookingId) => {
    try {
      setRideActionLoading(`arrived-${bookingId}`);
      const response = await api.markDriverArrived(bookingId);
      if (response?.success) {
        fetchBookings();
      } else {
        alert(response?.error || 'Unable to mark arrival.');
      }
    } catch (error) {
      alert(error?.message || 'Unable to mark arrival.');
    } finally {
      setRideActionLoading('');
    }
  };

  const handleStartRide = async (bookingId) => {
    const otp = String(otpByBooking[bookingId] || '').trim();
    if (!otp) {
      alert('Enter customer OTP first.');
      return;
    }

    try {
      setRideActionLoading(`start-${bookingId}`);
      const response = await api.startRideWithOTP(bookingId, otp);
      if (response?.success) {
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
      } else {
        alert(response?.error || 'Failed to update status');
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleWithdrawRequest = () => {
    const requestedAmount = Number(withdrawAmount);
    if (!Number.isFinite(requestedAmount) || requestedAmount < 100) {
      alert('Minimum withdrawal amount is 100 INR.');
      return;
    }

    setWithdrawHistory((prev) => [
      {
        id: `WD-${Date.now()}`,
        amount: requestedAmount,
        status: 'Pending',
        requestedAt: new Date().toISOString()
      },
      ...prev
    ]);
    setWithdrawAmount('');
  };

  const renderRideCard = (ride, includeActions = true) => {
    const earning = Number(ride.rideFlow?.driverEarning || ride.finalPrice || ride.estimatedPrice || 0);
    const statusLabel = String(ride.status || '').replace(/_/g, ' ').toUpperCase();

    return (
      <div key={ride._id} className={`dd-ride-card ${ride.status === 'in_progress' ? 'active' : ''}`}>
        <div className="dd-ride-top">
          <div className="dd-ride-id-group">
            <span className="dd-ride-id">#{ride.bookingId || ride._id?.slice(-6)}</span>
            <span className="dd-ride-date">{ride.startDate ? new Date(ride.startDate).toLocaleString('en-IN') : ''}</span>
          </div>
          <div className="dd-ride-right">
            <span className={`dd-ride-status ${ride.status?.replace(/_/g, '-')}`}>{statusLabel}</span>
          </div>
        </div>

        <div className="dd-ride-route">
          <div className="dd-route-point"><span className="dd-dot pickup"></span><span>{ride.pickupLocation?.address || 'Pickup'}</span></div>
          <div className="dd-route-line"></div>
          <div className="dd-route-point"><span className="dd-dot drop"></span><span>{ride.dropLocation?.address || 'Drop'}</span></div>
        </div>

        <div className="dd-ride-footer">
          <div className="dd-ride-meta">
            <span>{ride.bookingType || 'daily'}</span>
            <span>Customer: {ride.customer?.name || ride.customerId?.name || '-'}</span>
          </div>
          <span className="dd-ride-earning">INR {earning}</span>
        </div>

        {includeActions && ride.status === 'confirmed' && (
          <div style={{ marginTop: '12px' }}>
            <button className="dd-btn accept" onClick={() => handleMarkArrived(ride._id)} disabled={rideActionLoading === `arrived-${ride._id}`}>
              {rideActionLoading === `arrived-${ride._id}` ? 'Updating...' : 'Mark Arrived'}
            </button>
          </div>
        )}

        {includeActions && ride.status === 'driver_arrived' && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter customer OTP"
              value={otpByBooking[ride._id] || ''}
              onChange={(event) => setOtpByBooking((prev) => ({ ...prev, [ride._id]: event.target.value.replace(/\D/g, '').slice(0, 4) }))}
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
            <button className="dd-btn accept" onClick={() => handleStartRide(ride._id)} disabled={rideActionLoading === `start-${ride._id}`}>
              {rideActionLoading === `start-${ride._id}` ? 'Starting...' : 'Start Ride'}
            </button>
          </div>
        )}

        {includeActions && ride.status === 'in_progress' && (
          <div style={{ marginTop: '12px' }}>
            <button className="dd-btn accept" onClick={() => handleCompleteRide(ride._id)} disabled={rideActionLoading === `complete-${ride._id}`}>
              {rideActionLoading === `complete-${ride._id}` ? 'Completing...' : 'Complete Ride'}
            </button>
          </div>
        )}

        {ride.status === 'completed' && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="dd-btn accept" onClick={() => downloadInvoice(ride, 'driver')}>Download Invoice</button>
            <button
              className="dd-btn"
              onClick={() => setMapToggleByRide((prev) => ({ ...prev, [ride._id]: !prev[ride._id] }))}
            >
              {mapToggleByRide[ride._id] ? 'Hide Route Map' : 'View Route Map'}
            </button>
          </div>
        )}

        {mapToggleByRide[ride._id] && (
          <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(148,163,184,0.2)' }}>
            <p style={{ margin: '0 0 8px', color: '#cbd5e1', fontSize: '12px' }}>Route map preview:</p>
            <p style={{ margin: '0 0 4px', color: '#e2e8f0', fontSize: '13px' }}>From: {ride.pickupLocation?.address || 'Pickup'}</p>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13px' }}>To: {ride.dropLocation?.address || 'Drop'}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="section">
      <div className="dd-header-row">
        <h1 style={{ marginBottom: '0' }}>Driver Portal</h1>
      </div>

      {bookingAlert && (
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
          <strong style={{ color: '#fcd34d' }}>Notice: {bookingAlert}</strong>
        </div>
      )}

      <div className="card" style={{ marginBottom: '22px', backgroundColor: onlineStatus ? '#dcfce7' : '#f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0' }}>Welcome {driverInfo?.name || 'Driver'} </h3>
            <p style={{ margin: 0, color: '#334155' }}>
              Status: <strong>{onlineStatus ? 'Online' : 'Offline'}</strong>
            </p>
          </div>
          <button onClick={toggleOnlineStatus} className="btn" style={{ backgroundColor: onlineStatus ? '#ef4444' : '#16a34a', color: '#fff', fontWeight: 700 }}>
            {onlineStatus ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      <div className="dd-tabs">
        {['dashboard', 'history', 'withdrawals', 'profile'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`dd-tab-btn ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'dashboard' && 'Dashboard'}
            {tab === 'history' && 'Ride History'}
            {tab === 'withdrawals' && 'Withdrawals'}
            {tab === 'profile' && 'Profile'}
            {tab === 'dashboard' && newBookingCount > 0 && <span className="dd-tab-badge">{newBookingCount}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div>
          <div className="grid grid-4" style={{ marginBottom: '20px' }}>
            <div className="card"><h4>Active Rides</h4><p style={{ fontSize: '28px', fontWeight: 800 }}>{activeRides.length}</p></div>
            <div className="card"><h4>Pending Requests</h4><p style={{ fontSize: '28px', fontWeight: 800 }}>{pendingRequests.length}</p></div>
            <div className="card"><h4>Total Earnings</h4><p style={{ fontSize: '28px', fontWeight: 800 }}>INR {earnings.totalEarnings || 0}</p></div>
            <div className="card"><h4>Total Rides</h4><p style={{ fontSize: '28px', fontWeight: 800 }}>{earnings.totalRides || 0}</p></div>
          </div>

          {pendingRequests.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 className="dd-section-title">New Booking Requests</h3>
              {pendingRequests.map((request) => (
                <div key={request._id} className="dd-request-card">
                  <div className="dd-request-top">
                    <span className="dd-request-id">#{request.bookingId || request._id?.slice(-6)}</span>
                    <span className="dd-request-price">INR {request.estimatedPrice || request.finalPrice || 0}</span>
                  </div>
                  <div className="dd-request-route">
                    <div className="dd-route-point"><span className="dd-dot pickup"></span><span>{request.pickupLocation?.address || 'Pickup'}</span></div>
                    <div className="dd-route-line"></div>
                    <div className="dd-route-point"><span className="dd-dot drop"></span><span>{request.dropLocation?.address || 'Drop'}</span></div>
                  </div>
                  <div className="dd-request-actions">
                    <button className="dd-btn accept" onClick={() => handleBookingAction(request._id, 'accept')}>Accept</button>
                    <button className="dd-btn reject" onClick={() => handleBookingAction(request._id, 'reject')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="dd-section-title">Active Rides</h3>
          {activeRides.length === 0 ? <div className="dd-empty"><p>No active rides right now.</p></div> : activeRides.map((ride) => renderRideCard(ride, true))}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h3 className="dd-section-title">Completed Rides (Grouped by Day)</h3>
          {Object.keys(completedGrouped).length === 0 && (
            <div className="dd-empty"><p>No completed rides yet.</p></div>
          )}

          {Object.entries(completedGrouped).map(([dateLabel, rides]) => {
            const dayTotal = rides.reduce((sum, ride) => sum + Number(ride.rideFlow?.driverEarning || ride.finalPrice || ride.estimatedPrice || 0), 0);
            return (
              <div key={dateLabel} className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: 0 }}>{dateLabel}</h4>
                  <strong style={{ color: '#4ade80' }}>Daily Earnings: INR {dayTotal.toFixed(0)}</strong>
                </div>
                {rides.map((ride) => renderRideCard(ride, false))}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="card">
          <h3>Withdrawals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(30,41,59,0.7)' }}>
              <p style={{ margin: '0 0 8px', color: '#94a3b8' }}>Available Balance</p>
              <strong style={{ fontSize: '26px', color: '#22c55e' }}>INR {earnings.totalEarnings || 0}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                min="100"
                className="form-input"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
              />
              <button className="btn btn-primary" onClick={handleWithdrawRequest}>Request</button>
            </div>
          </div>

          <h4 style={{ marginTop: '24px' }}>Withdrawal History</h4>
          {withdrawHistory.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No withdrawal requests yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {withdrawHistory.map((entry) => (
                <div key={entry.id} style={{ border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{entry.id}</strong>
                    <p style={{ margin: '3px 0 0', color: '#94a3b8' }}>{new Date(entry.requestedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>INR {entry.amount}</strong>
                    <p style={{ margin: '3px 0 0', color: '#facc15' }}>{entry.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Personal Details</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <input className="form-input" placeholder="Name" value={profileForm.name} onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))} />
            <input className="form-input" placeholder="Phone" value={driverInfo?.phone || ''} disabled />
            <input className="form-input" placeholder="Email" value={profileForm.email} onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))} />
            <input className="form-input" placeholder="Blood Group" value={profileForm.bloodGroup} onChange={(event) => setProfileForm((prev) => ({ ...prev, bloodGroup: event.target.value }))} />
            <input className="form-input" placeholder="Address / Area" value={profileForm.address} onChange={(event) => setProfileForm((prev) => ({ ...prev, address: event.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <select className="form-input" value={profileForm.state} onChange={(event) => setProfileForm((prev) => ({ ...prev, state: event.target.value }))}>
                <option value="">Select state</option>
                {STATE_OPTIONS.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
              <input className="form-input" placeholder="City" value={profileForm.city} onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))} />
              <input className="form-input" placeholder="Pincode" inputMode="numeric" value={profileForm.pincode} onChange={(event) => setProfileForm((prev) => ({ ...prev, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))} />
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
