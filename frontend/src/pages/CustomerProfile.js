import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function CustomerProfile() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyBookings().then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="customer-profile-page" style={{ maxWidth: 900, margin: '40px auto' }}>
      <h2>My Profile & Booking History</h2>
      {loading ? <div>Loading...</div> : (
        bookings.length === 0 ? <div>No bookings found.</div> : (
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
              {bookings.map(b => (
                <tr key={b._id}>
                  <td style={{ padding: 12 }}>{b.bookingId}</td>
                  <td style={{ padding: 12 }}>{b.pickupLocation?.address}</td>
                  <td style={{ padding: 12 }}>{b.dropLocation?.address}</td>
                  <td style={{ padding: 12 }}>{b.driverId?.name || 'Unassigned'}</td>
                  <td style={{ padding: 12 }}>{b.status}</td>
                  <td style={{ padding: 12 }}>₹{b.finalPrice}</td>
                  <td style={{ padding: 12 }}>{b.startDate ? new Date(b.startDate).toLocaleDateString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

export default CustomerProfile;
