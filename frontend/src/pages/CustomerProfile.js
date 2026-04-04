import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/CustomerProfile.css';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'driver_assigned', 'driver_arrived', 'otp_verified', 'in_progress'];

const formatStatus = (status = '') => status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return `INR ${amount.toLocaleString('en-IN')}`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

function CustomerProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileResponse, bookingResponse] = await Promise.all([
          api.getProfile(),
          api.getMyBookings()
        ]);

        const list = bookingResponse?.bookings || bookingResponse || [];
        const location = profileResponse?.location || {};

        setProfile(profileResponse || null);
        setForm({
          name: profileResponse?.name || '',
          email: profileResponse?.email || '',
          address: location.address || '',
          city: location.city || '',
          state: location.state || '',
          pincode: location.pincode || ''
        });
        setBookings(Array.isArray(list) ? list : []);
      } catch (error) {
        setMessage(error?.message || 'Unable to load profile details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const activeBooking = bookings.find((item) => ACTIVE_STATUSES.includes(item.status));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await api.updateProfile(form);
      if (response?.error) {
        throw new Error(response.error);
      }
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 10);

  const totalSpent = bookings.reduce((sum, booking) => {
    const value = Number(booking.finalPrice || booking.estimatedPrice || 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  const userRating = Number(profile?.rating || profile?.averageRating || 0);
  const normalizedRating = userRating > 0 ? userRating.toFixed(1) : 'N/A';
  const userInitial = (form.name || profile?.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="customer-profile-page">
      <div className="customer-profile-shell">
        <header className="customer-profile-header customer-profile-card customer-fade-in customer-fade-delay-1">
          <div className="customer-profile-hero-main">
            <div className="customer-avatar">{userInitial}</div>
            <div>
              <p className="customer-profile-kicker">Account Hub</p>
              <h1>{form.name || profile?.name || 'Customer'}</h1>
              <p className="customer-profile-subtitle">{profile?.phone || '-'} • {form.email || 'No email added yet'}</p>
              <button
                type="button"
                className="customer-edit-toggle"
                onClick={() => setIsEditingProfile((prev) => !prev)}
              >
                {isEditingProfile ? 'Close Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>
          <div className="customer-profile-stats">
            <div className="customer-profile-stat-card">
              <span className="customer-profile-stat-label">Total Rides</span>
              <strong>{bookings.length}</strong>
            </div>
            <div className="customer-profile-stat-card">
              <span className="customer-profile-stat-label">Total Spent</span>
              <strong>{formatAmount(totalSpent)}</strong>
            </div>
            <div className="customer-profile-stat-card">
              <span className="customer-profile-stat-label">Rating</span>
              <strong>{normalizedRating}</strong>
            </div>
          </div>
        </header>

        {loading ? <div className="customer-profile-loading">Loading your profile...</div> : (
          <>
            {message && <div className="customer-profile-banner">{message}</div>}

            <div className="customer-profile-grid">
              {isEditingProfile && (
                <section className="customer-profile-card customer-fade-in customer-fade-delay-2">
                <div className="customer-card-header">
                  <h2>Personal Details</h2>
                  <span>Keep contact information up to date</span>
                </div>

                <form onSubmit={handleSubmit} className="customer-profile-form">
                  <div className="customer-form-group customer-form-group-full">
                    <label htmlFor="customerName">Name</label>
                    <input
                      id="customerName"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="customer-form-group">
                    <label htmlFor="customerPhone">Phone</label>
                    <input id="customerPhone" value={profile?.phone || ''} placeholder="Phone" disabled />
                  </div>

                  <div className="customer-form-group">
                    <label htmlFor="customerEmail">Email</label>
                    <input
                      id="customerEmail"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                    />
                  </div>

                  <div className="customer-form-group customer-form-group-full">
                    <label htmlFor="customerAddress">Address</label>
                    <input
                      id="customerAddress"
                      value={form.address}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Address"
                    />
                  </div>

                  <div className="customer-form-group">
                    <label htmlFor="customerCity">City</label>
                    <input
                      id="customerCity"
                      value={form.city}
                      onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>

                  <div className="customer-form-group">
                    <label htmlFor="customerState">State</label>
                    <input
                      id="customerState"
                      value={form.state}
                      onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                    />
                  </div>

                  <div className="customer-form-group">
                    <label htmlFor="customerPincode">Pincode</label>
                    <input
                      id="customerPincode"
                      value={form.pincode}
                      onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="Pincode"
                    />
                  </div>

                  <button className="customer-profile-save-btn" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
                </section>
              )}

              <aside className="customer-profile-card customer-fade-in customer-fade-delay-3">
                <div className="customer-card-header">
                  <h2>Active Ride</h2>
                  <span>Real-time snapshot of your latest booking</span>
                </div>

                {activeBooking ? (
                  <div className="customer-active-ride">
                    <div className="customer-active-row">
                      <span>Booking ID</span>
                      <strong>{activeBooking.bookingId || activeBooking._id}</strong>
                    </div>
                    <div className="customer-active-row">
                      <span>Status</span>
                      <strong className="status-pill">{formatStatus(activeBooking.status)}</strong>
                    </div>
                    <div className="customer-active-block">
                      <span>Pickup</span>
                      <p>{activeBooking.pickupLocation?.address || 'N/A'}</p>
                    </div>
                    <div className="customer-active-block">
                      <span>Drop</span>
                      <p>{activeBooking.dropLocation?.address || 'N/A'}</p>
                    </div>
                    <Link className="customer-track-link" to={`/track-booking/${activeBooking._id}`}>
                      Track Active Ride
                    </Link>
                  </div>
                ) : (
                  <div className="customer-empty-state">
                    <h3>No active ride right now</h3>
                    <p>Your next booking will show up here with tracking details.</p>
                  </div>
                )}
              </aside>
            </div>

            <section className="customer-profile-card customer-bookings-card customer-fade-in customer-fade-delay-4">
              <div className="customer-card-header">
                <h2>Recent Bookings</h2>
                <span>Showing latest {recentBookings.length} rides</span>
              </div>

              {recentBookings.length === 0 ? (
                <div className="customer-empty-state customer-empty-table">
                  <h3>No bookings found</h3>
                  <p>Book your first ride to start building history.</p>
                </div>
              ) : (
                <>
                  <div className="customer-bookings-table-wrap">
                    <table className="customer-bookings-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Pickup</th>
                          <th>Drop</th>
                          <th>Driver</th>
                          <th>Status</th>
                          <th>Amount</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.map((booking) => (
                          <tr key={booking._id}>
                            <td>{booking.bookingId || booking._id}</td>
                            <td>{booking.pickupLocation?.address || '-'}</td>
                            <td>{booking.dropLocation?.address || '-'}</td>
                            <td>{booking.driver?.name || booking.driverId?.name || 'Unassigned'}</td>
                            <td>
                              <span className="status-pill status-pill-muted">{formatStatus(booking.status)}</span>
                            </td>
                            <td>{formatAmount(booking.finalPrice || booking.estimatedPrice)}</td>
                            <td>{formatDate(booking.startDate || booking.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="customer-bookings-mobile-list">
                    {recentBookings.map((booking) => (
                      <article className="customer-booking-mobile-card" key={`mobile-${booking._id}`}>
                        <div className="customer-booking-mobile-head">
                          <strong>{booking.bookingId || booking._id}</strong>
                          <span className="status-pill status-pill-muted">{formatStatus(booking.status)}</span>
                        </div>
                        <div className="customer-booking-mobile-row">
                          <span>Pickup</span>
                          <p>{booking.pickupLocation?.address || '-'}</p>
                        </div>
                        <div className="customer-booking-mobile-row">
                          <span>Drop</span>
                          <p>{booking.dropLocation?.address || '-'}</p>
                        </div>
                        <div className="customer-booking-mobile-meta">
                          <span>{booking.driver?.name || booking.driverId?.name || 'Unassigned'}</span>
                          <span>{formatAmount(booking.finalPrice || booking.estimatedPrice)}</span>
                          <span>{formatDate(booking.startDate || booking.createdAt)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerProfile;
