import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/MyBookings.css';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBookings();
    const interval = setInterval(fetchMyBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyBookings = async () => {
    try {
      const response = await api.getMyBookings();
      setBookings(response);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await api.cancelBooking(bookingId);
        fetchMyBookings();
      } catch (error) {
        console.error('Error cancelling booking:', error);
      }
    }
  };

  const handleConfirm = async (bookingId) => {
    try {
      await api.confirmBooking(bookingId);
      fetchMyBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  return (
    <div className="section">
      <h1 className="section-title">My Bookings</h1>

      {loading ? (
        <div className="loading">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="alert alert-info">No bookings yet. <a href="/browse">Browse drivers</a> to make your first booking!</div>
      ) : (
        <div className="grid grid-1">
          {bookings.map(booking => (
            <div key={booking._id} className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>Booking #{booking.bookingId}</h3>
                  <p><strong>Status:</strong> {booking.status}</p>
                  <p><strong>Type:</strong> {booking.bookingType}</p>
                  <p><strong>Date:</strong> {new Date(booking.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4>Route</h4>
                  <p><strong>From:</strong> {booking.pickupLocation.address}</p>
                  <p><strong>To:</strong> {booking.dropLocation.address}</p>
                  <p><strong>Distance:</strong> {booking.estimatedDistance}km</p>
                </div>
                <div>
                  <h4>Driver</h4>
                  {booking.driverId ? (
                    <>
                      <p><strong>Name:</strong> {booking.driverId.name}</p>
                      <p><strong>Phone:</strong> {booking.driverId.phone}</p>
                      <p><strong>Rating:</strong> ⭐ {booking.driverId.rating?.averageRating || 'N/A'}</p>
                    </>
                  ) : (
                    <p>Driver not assigned yet</p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#16a34a' }}>
                  Amount: ₹{booking.finalPrice}
                </p>
              </div>

              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {booking.status === 'pending' && (
                  <>
                    <button onClick={() => handleConfirm(booking._id)} className="btn btn-primary">
                      Confirm Booking
                    </button>
                    <button onClick={() => handleCancel(booking._id)} className="btn btn-danger">
                      Cancel
                    </button>
                  </>
                )}
                {booking.status === 'in_progress' && (
                  <button className="btn" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                    View Live Tracking
                  </button>
                )}
                {booking.status === 'completed' && (
                  <button className="btn" style={{ backgroundColor: '#10b981', color: 'white' }}>
                    Add Feedback
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
