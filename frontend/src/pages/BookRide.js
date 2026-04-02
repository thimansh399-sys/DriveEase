import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BookRide.css';

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
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/bookings/book-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data);
      } else {
        setError(data.message || 'Booking failed');
      }
    } catch (err) {
      setError('Server Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="book-ride-page">
        <div className="book-ride-card book-ride-success-card book-ride-reveal">
          <div className="book-ride-success-badge">Booking Confirmed</div>
          <div className="book-ride-success-icon">✅</div>
          <h2>Ride Booked!</h2>
          <p className="book-ride-subtitle">{success.message}</p>

          <div className="book-ride-success-panel">
            <p><b>Booking ID:</b> {success.booking?.bookingId}</p>
            <p><b>Pickup:</b> {success.booking?.pickup}</p>
            <p><b>Drop:</b> {success.booking?.drop}</p>
            <p><b>Ride Type:</b> {success.booking?.rideType}</p>
            <p><b>Status:</b> <span className="book-ride-status">{success.booking?.status}</span></p>
            {success.booking?.driver && (
              <p><b>Driver:</b> {success.booking.driver.name} - {success.booking.driver.phone}</p>
            )}
            <p className="book-ride-otp">OTP: {success.booking?.otp}</p>
            <p className="book-ride-otp-hint">Share this OTP with your driver to start the ride</p>
          </div>

          <div className="book-ride-success-actions">
            <button className="book-ride-secondary" onClick={() => setSuccess(null)}>
              Book Another Ride
            </button>
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
