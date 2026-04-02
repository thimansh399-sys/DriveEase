import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BookRide.css';
import api from '../utils/api';

const RIDE_TYPES = [
  { value: 'hourly', label: '⏱ Hourly' },
  { value: 'daily', label: '🚗 Daily' },
  { value: 'outstation', label: '🛣 Outstation' },
];

export default function BookRide() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    pickup: '',
    drop: '',
    rideType: 'hourly',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [trackedBooking, setTrackedBooking] = useState(null);
  const [trackerMessage, setTrackerMessage] = useState('');
  const [shareOtpLoading, setShareOtpLoading] = useState(false);

  const mapQuery = form.pickup && form.drop
    ? `${form.pickup} to ${form.drop}`
    : (form.pickup || form.drop || 'India');
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=12&output=embed`;

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;

    const parsed = JSON.parse(stored);
    setUser(parsed);
    setForm((prev) => ({
      ...prev,
      name: parsed?.name || '',
      phone: parsed?.phone || '',
    }));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBooking = async () => {
    if (!form.name || !form.phone || !form.pickup || !form.drop) {
      setError('Please fill all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await api.bookNow({
        pickup: form.pickup,
        drop: form.drop,
        rideType: form.rideType,
      });

      if (data?.booking?._id || data?.booking?.bookingId) {
        setSuccess(data);
        setTrackedBooking(data.booking);
        setTrackerMessage('Searching nearby drivers...');
      } else {
        setError(data?.error || data?.message || 'Booking failed');
      }
    } catch (err) {
      setError(err?.message || 'Server Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bookingId = success?.booking?._id;
    if (!bookingId) return undefined;

    let mounted = true;

    const refreshBooking = async () => {
      try {
        const detail = await api.getBookingById(bookingId);
        if (!mounted || detail?.error) return;

        setTrackedBooking(detail);

        const status = String(detail.status || '').toLowerCase();
        if (status === 'pending') {
          setTrackerMessage('Searching nearby drivers...');
        } else if (status === 'confirmed') {
          setTrackerMessage('Driver accepted your ride. Wait for arrival at pickup.');
        } else if (status === 'driver_arrived') {
          setTrackerMessage('Driver reached pickup. Share OTP to start ride.');
        } else if (status === 'in_progress') {
          setTrackerMessage('Ride started successfully.');
        } else if (status === 'completed') {
          setTrackerMessage('Ride completed.');
        }
      } catch (_) {
        // Keep previous tracker state on transient network issues.
      }
    };

    refreshBooking();
    const timer = setInterval(refreshBooking, 8000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [success?.booking?._id]);

  const handleShareOtp = async () => {
    const bookingId = trackedBooking?._id || success?.booking?._id;
    if (!bookingId) return;

    try {
      setShareOtpLoading(true);
      setTrackerMessage('Sharing OTP with driver...');
      const response = await api.shareBookingOtp(bookingId);
      if (response?.error) {
        setTrackerMessage(response.error);
      } else {
        setTrackerMessage('OTP shared with driver. Driver can start ride now.');
        const detail = await api.getBookingById(bookingId);
        if (!detail?.error) setTrackedBooking(detail);
      }
    } catch (err) {
      setTrackerMessage(err?.message || 'Unable to share OTP right now.');
    } finally {
      setShareOtpLoading(false);
    }
  };

  if (success) {
    const live = trackedBooking || success.booking || {};
    const liveStatus = String(live.status || success.booking?.status || '').toLowerCase();
    const driverInfo = live.driver || live.driverId || success.booking?.driver || null;
    const pickupAddress = live.pickupLocation?.address || success.booking?.pickup || '-';
    const dropAddress = live.dropLocation?.address || success.booking?.drop || '-';
    const canShareOtp = liveStatus === 'driver_arrived' && !live.verification?.otpSharedWithDriver;

    return (
      <div className="book-ride-page">
        <div className="book-ride-card book-ride-success-card book-ride-reveal">
          <div className="book-ride-success-badge">Booking Confirmed</div>
          <div className="book-ride-success-icon">✅</div>
          <h2>Ride Booked!</h2>
          <p className="book-ride-subtitle">{success.message}</p>

          <div className="book-ride-success-panel">
            <p><b>Booking ID:</b> {live.bookingId || success.booking?.bookingId}</p>
            <p><b>Pickup:</b> {pickupAddress}</p>
            <p><b>Drop:</b> {dropAddress}</p>
            <p><b>Ride Type:</b> {success.booking?.rideType || live.bookingType || '-'}</p>
            <p><b>Status:</b> <span className="book-ride-status">{live.status || success.booking?.status}</span></p>
            {driverInfo && (
              <p><b>Driver:</b> {driverInfo.name} - {driverInfo.phone}</p>
            )}
            <p className="book-ride-otp">AI Secure OTP: {success.booking?.otp || live.verification?.otp || '-'}</p>
            <p className="book-ride-otp-hint">Share this OTP with your driver to start the ride</p>
            <p style={{ marginTop: 10, color: '#86efac', fontWeight: 600 }}>{trackerMessage}</p>

            {canShareOtp && (
              <button
                type="button"
                className="book-ride-submit"
                onClick={handleShareOtp}
                disabled={shareOtpLoading}
                style={{ marginTop: 12 }}
              >
                {shareOtpLoading ? 'Sharing OTP...' : '🔐 Share OTP With Driver'}
              </button>
            )}

            {live.verification?.otpSharedWithDriver && liveStatus !== 'in_progress' && (
              <p style={{ marginTop: 10, color: '#c4b5fd', fontWeight: 600 }}>
                OTP shared. Driver can now enter OTP and start trip.
              </p>
            )}
          </div>

          <div className="book-ride-success-actions">
            <button className="book-ride-secondary" onClick={() => setSuccess(null)}>
              Book Another Ride
            </button>
            {!!(live._id || success.booking?._id) && (
              <button
                className="book-ride-secondary"
                onClick={() => navigate(`/track-booking/${live._id || success.booking?._id}`)}
              >
                📍 Track Live Ride
              </button>
            )}
            <button className="book-ride-submit" onClick={() => navigate('/customer-dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="book-ride-page">
      <div className="book-ride-layout">
        <div className="book-ride-card book-ride-reveal">
          <button className="book-ride-back book-ride-reveal delay-1" onClick={() => navigate('/customer-dashboard')}>
            &larr; Back
          </button>

          <h2 className="book-ride-reveal delay-1">🚗 Book Your Ride</h2>
          {user && <p className="book-ride-subtitle book-ride-reveal delay-2">Hi {user.name}, where do you want to go?</p>}

          <div className="book-ride-input-group book-ride-reveal delay-2">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="book-ride-input"
            />
            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className="book-ride-input"
            />
            <input
              name="pickup"
              placeholder="Pickup Location"
              value={form.pickup}
              onChange={handleChange}
              className="book-ride-input"
            />
            <input
              name="drop"
              placeholder="Drop Location"
              value={form.drop}
              onChange={handleChange}
              className="book-ride-input"
            />
          </div>

          <div className="book-ride-types">
            {RIDE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setForm((prev) => ({ ...prev, rideType: value }))}
                className={`book-ride-type-btn ${form.rideType === value ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && <div className="book-ride-error book-ride-reveal delay-3">{error}</div>}

          <button className="book-ride-submit book-ride-reveal delay-3" onClick={handleBooking} disabled={loading}>
            {loading ? 'Booking...' : '🚗 Confirm Booking'}
          </button>
        </div>

        <aside className="book-ride-map-card book-ride-reveal delay-2">
          <h3>Live Route Preview</h3>
          <p className="book-ride-map-subtitle">Pickup aur drop ke hisaab se route preview</p>

          <div className="book-ride-map-frame-wrap">
            <iframe
              title="Ride route map"
              src={mapUrl}
              loading="lazy"
              allowFullScreen
              className="book-ride-map-frame"
            />
          </div>

          <div className="book-ride-map-summary">
            <p><span>Pickup</span><b>{form.pickup || 'Not set'}</b></p>
            <p><span>Drop</span><b>{form.drop || 'Not set'}</b></p>
            <p><span>Ride Type</span><b>{form.rideType}</b></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
