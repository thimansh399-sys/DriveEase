import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/DriverDashboard.css';
import { playNotificationSound } from '../utils/notificationService';
import { useNotification } from '../context/NotificationContext';
import { connectRideSocket, connectDriverSocket } from '../utils/rideSocket';

const ACTIVE_STATUSES = ['pending', 'driver_assigned', 'confirmed', 'driver_arrived', 'in_progress', 'ON_TRIP'];

const statusLabel = (status) => {
  const map = {
    pending: 'Pending',
    driver_assigned: 'Assigned',
    confirmed: 'Confirmed',
    driver_arrived: 'Arrived',
    in_progress: 'In Progress',
    ON_TRIP: 'On Trip',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return map[status] || status;
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [driver, setDriver] = useState({ name: 'Driver', city: '-' });
  const [bookings, setBookings] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState('');
  const [otpModalBooking, setOtpModalBooking] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [error, setError] = useState('');
  const [driverSocketId, setDriverSocketId] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());
  const seenPendingRef = useRef(new Set());
  const socketRef = useRef(null);
  const driverSocketRef = useRef(null);
  const locationTimerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedDriver = JSON.parse(localStorage.getItem('driver') || 'null');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const base = storedDriver || storedUser || {};

    setDriver({
      name: base.name || 'Driver',
      city: base.city || base.personalDetails?.city || '-',
    });

    const resolvedDriverId = String(base?._id || base?.id || localStorage.getItem('driverId') || '').trim();
    setDriverSocketId(resolvedDriverId);

    setIsOnline(String(localStorage.getItem('driverOnline') || '').toLowerCase() === 'true');
  }, []);

  const fetchBookings = useCallback(async () => {
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
  }, [addNotification]);

  useEffect(() => {
    fetchBookings();
    const timer = setInterval(fetchBookings, 10000);
    return () => clearInterval(timer);
  }, [fetchBookings]);

  useEffect(() => {
    if (!driverSocketId) {
      return undefined;
    }

    const driverSocket = connectDriverSocket(driverSocketId);
    driverSocketRef.current = driverSocket;

    driverSocket.on('new_ride_request', (payload = {}) => {
      const bookingId = String(payload.bookingId || '').trim();
      if (bookingId) {
        seenPendingRef.current.delete(bookingId);
      }
      addNotification('New ride request received. Check pending bookings.', 'info', 4500, 'New Ride Request');
      playNotificationSound();
      fetchBookings();
    });

    return () => {
      driverSocket.disconnect();
      driverSocketRef.current = null;
    };
  }, [driverSocketId, addNotification, fetchBookings]);

  const liveBooking = useMemo(
    () => bookings.find((item) => ['driver_arrived', 'in_progress', 'ON_TRIP'].includes(item.status)),
    [bookings]
  );

  useEffect(() => {
    if (!liveBooking?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return undefined;
    }

    const bookingId = String(liveBooking._id);
    const socket = connectRideSocket(bookingId);
    socketRef.current = socket;

    socket.on('ride_started', (payload = {}) => {
      if (String(payload.bookingId || '') === bookingId) {
        navigate(`/track-booking/${bookingId}`);
      }
    });

    socket.on('ride_ended', (payload = {}) => {
      if (String(payload.bookingId || '') === bookingId) {
        fetchBookings();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [liveBooking?._id, navigate, fetchBookings]);

  useEffect(() => {
    const bookingId = liveBooking?._id;
    const isTripLive = liveBooking && ['in_progress', 'ON_TRIP'].includes(liveBooking.status);

    if (!bookingId || !isTripLive || !navigator.geolocation) {
      if (locationTimerRef.current) {
        clearInterval(locationTimerRef.current);
        locationTimerRef.current = null;
      }
      return undefined;
    }

    const publishLocation = () => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const payload = {
          bookingId,
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
        };

        if (socketRef.current?.connected) {
          socketRef.current.emit('driver_location_update', payload);
        }

        try {
          await api.updateRideLocation(payload);
        } catch (_) {
          // Fallback retry will happen in the next interval tick.
        }
      });
    };

    publishLocation();
    locationTimerRef.current = setInterval(publishLocation, 5000);

    return () => {
      if (locationTimerRef.current) {
        clearInterval(locationTimerRef.current);
        locationTimerRef.current = null;
      }
    };
  }, [liveBooking]);

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

  const getAssignmentCountdownLabel = (booking) => {
    const expiresAtRaw = booking?.assignment?.currentAssignmentExpiresAt;
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).getTime() : null;
    if (!Number.isFinite(expiresAt)) return '';

    const diffMs = expiresAt - nowMs;
    if (diffMs <= 0) return 'Reassigning to next online driver...';

    const totalSeconds = Math.ceil(diffMs / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `Accept within ${mm}:${ss} or this ride will auto-assign to another online driver.`;
  };

  const submitOtp = async () => {
    if (!otpModalBooking?._id) return;
    const currentBookingId = String(otpModalBooking._id);
    const value = String(otpInput || '').trim();

    if (!/^\d{4}$/.test(value)) {
      setOtpError('Please enter valid 4-digit OTP.');
      return;
    }

    try {
      setOtpSubmitting(true);
      setOtpError('');
      const response = await api.startRideWithOTP(currentBookingId, value);
      if (response?.error || response?.success === false) {
        throw new Error(response?.error || response?.message || 'OTP verification failed. Please retry.');
      }

      const startedBookingId = String(
        response?.booking?._id
        || response?.booking?.id
        || response?.bookingId
        || currentBookingId
      );

      setOtpModalBooking(null);
      setOtpInput('');
      await fetchBookings();
      navigate(`/track-booking/${startedBookingId}`);
    } catch (err) {
      setOtpError(err?.message || 'OTP verification failed. Please retry.');
    } finally {
      setOtpSubmitting(false);
    }
  };

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
                const normalizedStatus = String(booking.status || '').toLowerCase();
                const busy = actionBusyId.startsWith(String(booking._id));
                const isAssignedRequest = normalizedStatus === 'driver_assigned' && Boolean(booking.canAccept);
                const assignmentCountdownLabel = isAssignedRequest ? getAssignmentCountdownLabel(booking) : '';

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
                    {assignmentCountdownLabel ? (
                      <p style={{ margin: '6px 0', color: '#fcd34d', fontWeight: 600 }}>
                        ⏱ {assignmentCountdownLabel}
                      </p>
                    ) : null}

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

                      {normalizedStatus === 'confirmed' && (
                        <button disabled={busy} onClick={() => runBookingAction(booking._id, 'arrived')} className="driver-primary-btn">
                          Mark Arrived
                        </button>
                      )}

                      {['confirmed', 'driver_arrived', 'arrived'].includes(normalizedStatus) && !otpVerified && (
                        <button
                          disabled={busy}
                          onClick={() => {
                            setOtpModalBooking(booking);
                            setOtpInput('');
                            setOtpError('');
                          }}
                          className="driver-primary-btn"
                          title={otpShared ? 'Verify OTP and start ride' : 'Enter OTP shared by customer and start ride'}
                        >
                          Start Ride
                        </button>
                      )}

                      {(normalizedStatus === 'in_progress' || normalizedStatus === 'on_trip') && (
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

      {otpModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.68)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#0b1220', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Start Ride with OTP</h3>
            <p style={{ marginTop: 0, opacity: 0.85 }}>Enter the OTP shared by customer for booking #{otpModalBooking.bookingId || String(otpModalBooking._id).slice(-6)}</p>
            <input
              className="driver-input"
              autoFocus
              maxLength={4}
              inputMode="numeric"
              value={otpInput}
              placeholder="4-digit OTP"
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            {otpError ? <p style={{ color: '#fda4af' }}>{otpError}</p> : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="driver-secondary-btn"
                onClick={() => {
                  if (!otpSubmitting) {
                    setOtpModalBooking(null);
                    setOtpError('');
                  }
                }}
                disabled={otpSubmitting}
              >
                Cancel
              </button>
              <button type="button" className="driver-primary-btn" onClick={submitOtp} disabled={otpSubmitting}>
                {otpSubmitting ? 'Verifying...' : 'Verify & Start'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
