import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/api';
import '../styles/DriverDashboard.css';
import { playNotificationSound } from '../utils/notificationService';
import { useNotification } from '../context/NotificationContext';

const ACTIVE_STATUSES = ['pending', 'driver_assigned', 'confirmed', 'driver_arrived', 'in_progress'];

const statusLabel = (status) => {
  const map = {
    pending: 'Pending',
    driver_assigned: 'Assigned',
    confirmed: 'Confirmed',
    driver_arrived: 'Arrived',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return map[status] || status;
};

export default function DriverDashboard() {
  const { addNotification } = useNotification();
  const [driver, setDriver] = useState({ name: 'Driver', city: '-' });
  const [bookings, setBookings] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState('');
  const [otpByBooking, setOtpByBooking] = useState({});
  const [error, setError] = useState('');
  const seenPendingRef = useRef(new Set());

  useEffect(() => {
    const storedDriver = JSON.parse(localStorage.getItem('driver') || 'null');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const base = storedDriver || storedUser || {};

    setDriver({
      name: base.name || 'Driver',
      city: base.city || base.personalDetails?.city || '-',
    });

    setIsOnline(String(localStorage.getItem('driverOnline') || '').toLowerCase() === 'true');
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.getDriverBookings();
      const list = response?.bookings || [];
      const normalized = Array.isArray(list) ? list : [];
      setBookings(normalized);

      const newPending = normalized.filter((booking) => {
        const bookingId = String(booking?._id || '');
        if (!bookingId) return false;
        const isNew = !seenPendingRef.current.has(bookingId);
        const isRequest = booking.status === 'pending' && booking.canAccept;
        return isNew && isRequest;
      });

      normalized.forEach((booking) => {
        if (booking?._id) {
          seenPendingRef.current.add(String(booking._id));
        }
      });

      if (newPending.length > 0) {
        addNotification(
          `${newPending.length} new nearby ride request${newPending.length > 1 ? 's' : ''} available.`,
          'info',
          4500,
          'New Ride Request'
        );
        playNotificationSound();
      }

      setError('');
    } catch (err) {
      setError(err?.message || 'Unable to load driver bookings right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const timer = setInterval(fetchBookings, 10000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === 'completed');
    const earnings = completed.reduce((sum, b) => sum + Number(b.invoice?.total || b.finalPrice || b.estimatedPrice || 0), 0);
    return {
      earnings,
      trips: completed.length,
      commission: Math.round(earnings * 0.1),
    };
  }, [bookings]);

  const toggleStatus = async () => {
    const nextState = !isOnline;
    try {
      await api.updateDriverStatus({ isOnline: nextState });
    } catch (_) {
      // Keep optimistic local toggle for better UX in temporary network failures.
    }

    setIsOnline(nextState);
    localStorage.setItem('driverOnline', String(nextState));
  };

  const runBookingAction = async (bookingId, action) => {
    try {
      setActionBusyId(bookingId + action);
      if (action === 'accept' || action === 'decline') {
        await api.respondToBooking(bookingId, action);
      } else if (action === 'arrived') {
        await api.markDriverArrived(bookingId);
      } else if (action === 'start') {
        const enteredOtp = String(otpByBooking[bookingId] || '').trim();
        if (!enteredOtp) {
          alert('Please enter OTP shared by customer.');
          return;
        }
        await api.startRideWithOTP(bookingId, enteredOtp);
      } else if (action === 'complete') {
        await api.completeRide(bookingId);
      }
      await fetchBookings();
    } catch (err) {
      alert(err?.message || 'Action failed. Please retry.');
    } finally {
      setActionBusyId('');
    }
  };

  const activeBookings = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="driver-dashboard-modern">
      <div className="driver-dashboard-shell">
        <div className="driver-dashboard-head">
          <h1>Driver Dashboard</h1>
          <p>{driver.name} · {driver.city}</p>
        </div>

        <div className="driver-stats-grid">
          <div className="driver-modern-card card-hover-pop">
            <h3>Net Earnings</h3>
            <p className="driver-metric earnings">₹{stats.earnings}</p>
          </div>
          <div className="driver-modern-card card-hover-pop">
            <h3>Completed Trips</h3>
            <p className="driver-metric">{stats.trips}</p>
          </div>
          <div className="driver-modern-card card-hover-pop">
            <h3>Estimated Commission</h3>
            <p className="driver-metric">₹{stats.commission}</p>
          </div>
        </div>

        <div className="driver-modern-card card-hover-pop" style={{ marginBottom: 16 }}>
          <h2>Driver Status</h2>
          <div className="driver-status-row">
            <span className={`driver-status-pill ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🟢 Online' : '⚪ Offline'}
            </span>
            <button onClick={toggleStatus} className="driver-primary-btn btn-hover-pop">
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>

        <div className="driver-modern-card card-hover-pop" style={{ marginBottom: 16 }}>
          <h2>Active Booking Requests & Rides</h2>
          {loading ? (
            <p>Loading rides...</p>
          ) : error ? (
            <p style={{ color: '#fca5a5' }}>{error}</p>
          ) : activeBookings.length === 0 ? (
            <p>No active bookings right now.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {activeBookings.map((booking) => {
                const fare = Number(booking.invoice?.total || booking.finalPrice || booking.estimatedPrice || 0);
                const otpShared = Boolean(booking.verification?.otpSharedWithDriver);
                const otpVerified = Boolean(booking.verification?.otpVerified);
                const busy = actionBusyId.startsWith(String(booking._id));

                return (
                  <div key={booking._id} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <strong>#{booking.bookingId || String(booking._id).slice(-6)}</strong>
                      <span>{statusLabel(booking.status)}</span>
                    </div>
                    <p style={{ margin: '8px 0 4px' }}><strong>Customer:</strong> {booking.customer?.name || '-'} ({booking.customer?.phone || '-'})</p>
                    <p style={{ margin: '4px 0' }}><strong>Pickup:</strong> {booking.pickupLocation?.address || '-'}</p>
                    <p style={{ margin: '4px 0' }}><strong>Drop:</strong> {booking.dropLocation?.address || '-'}</p>
                    <p style={{ margin: '4px 0' }}><strong>Fare:</strong> ₹{fare}</p>
                    <p style={{ margin: '4px 0' }}><strong>OTP Shared:</strong> {otpShared ? 'Yes' : 'No'}</p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {(booking.status === 'pending' || booking.status === 'driver_assigned') && (
                        <>
                          <button
                            disabled={busy || !booking.canAccept}
                            onClick={() => runBookingAction(booking._id, 'accept')}
                            className="driver-primary-btn"
                          >
                            {busy ? 'Please wait...' : 'Accept Ride'}
                          </button>
                          <button
                            disabled={busy || !booking.canReject}
                            onClick={() => runBookingAction(booking._id, 'decline')}
                            className="driver-secondary-btn"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button disabled={busy} onClick={() => runBookingAction(booking._id, 'arrived')} className="driver-primary-btn">
                          Mark Arrived
                        </button>
                      )}

                      {(booking.status === 'confirmed' || booking.status === 'driver_arrived') && otpShared && !otpVerified && (
                        <>
                          <input
                            className="driver-input"
                            style={{ marginBottom: 0, maxWidth: 180 }}
                            placeholder="Enter OTP"
                            value={otpByBooking[booking._id] || ''}
                            onChange={(e) => setOtpByBooking((prev) => ({ ...prev, [booking._id]: e.target.value.slice(0, 6) }))}
                          />
                          <button disabled={busy} onClick={() => runBookingAction(booking._id, 'start')} className="driver-primary-btn">
                            Start Ride
                          </button>
                        </>
                      )}

                      {booking.status === 'in_progress' && (
                        <button disabled={busy} onClick={() => runBookingAction(booking._id, 'complete')} className="driver-primary-btn">
                          Complete Ride
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="driver-modern-card card-hover-pop">
          <h2>Completed Rides</h2>
          {completedBookings.length === 0 ? (
            <p>No completed rides yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {completedBookings.slice(0, 8).map((booking) => (
                <div key={booking._id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
                  <strong>#{booking.bookingId || String(booking._id).slice(-6)}</strong>
                  <p style={{ margin: '4px 0' }}>{booking.pickupLocation?.address || '-'} → {booking.dropLocation?.address || '-'}</p>
                  <p style={{ margin: 0 }}>Fare: ₹{Number(booking.invoice?.total || booking.finalPrice || booking.estimatedPrice || 0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
