import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'driver_assigned', 'driver_arrived', 'otp_verified', 'in_progress'];

function CustomerProfile() {
  const [profile, setProfile] = useState(null);
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

  return (
    <div className="customer-profile-page" style={{ maxWidth: 900, margin: '40px auto' }}>
      <h2>My Profile, Active Ride & Booking History</h2>
      {loading ? <div>Loading...</div> : (
        <>
          {message && (
            <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#ecfeff', color: '#155e75' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, marginBottom: 20, background: '#fff', padding: 16, borderRadius: 10 }}>
            <h3 style={{ margin: 0 }}>Personal Details</h3>
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" required />
            <input value={profile?.phone || ''} placeholder="Phone" disabled />
            <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
            <input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Address" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} placeholder="City" />
              <input value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} placeholder="State" />
              <input value={form.pincode} onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="Pincode" />
            </div>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
          </form>

          <div style={{ marginBottom: 20, background: '#fff', padding: 16, borderRadius: 10 }}>
            <h3 style={{ marginTop: 0 }}>Active Ride</h3>
            {activeBooking ? (
              <>
                <p style={{ margin: '0 0 6px' }}><strong>ID:</strong> {activeBooking.bookingId || activeBooking._id}</p>
                <p style={{ margin: '0 0 6px' }}><strong>Status:</strong> {activeBooking.status}</p>
                <p style={{ margin: '0 0 6px' }}><strong>Pickup:</strong> {activeBooking.pickupLocation?.address || 'N/A'}</p>
                <p style={{ margin: 0 }}><strong>Drop:</strong> {activeBooking.dropLocation?.address || 'N/A'}</p>
                <div style={{ marginTop: 10 }}>
                  <Link to={`/track-booking/${activeBooking._id}`}>Track Active Ride</Link>
                </div>
              </>
            ) : (
              <p style={{ margin: 0 }}>No active ride at the moment.</p>
            )}
          </div>

          {recentBookings.length === 0 ? <div>No bookings found.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: 12 }}>Booking ID</th>
                  <th style={{ padding: 12 }}>Pickup</th>
                  <th style={{ padding: 12 }}>Drop</th>
                  <th style={{ padding: 12 }}>Driver</th>
                  <th style={{ padding: 12 }}>Status</th>
                  <th style={{ padding: 12 }}>Amount</th>
                  <th style={{ padding: 12 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b._id}>
                    <td style={{ padding: 12 }}>{b.bookingId || b._id}</td>
                    <td style={{ padding: 12 }}>{b.pickupLocation?.address}</td>
                    <td style={{ padding: 12 }}>{b.dropLocation?.address}</td>
                    <td style={{ padding: 12 }}>{b.driver?.name || b.driverId?.name || 'Unassigned'}</td>
                    <td style={{ padding: 12 }}>{b.status}</td>
                    <td style={{ padding: 12 }}>₹{b.finalPrice || b.estimatedPrice || 0}</td>
                    <td style={{ padding: 12 }}>{b.startDate ? new Date(b.startDate).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default CustomerProfile;
