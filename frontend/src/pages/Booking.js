import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

function Booking() {
  const navigate = useNavigate();
  const { driverId } = useParams();
  const [bookingData, setBookingData] = useState({
    bookingType: 'daily',
    numberOfDays: 1,
    startDate: '',
    insuranceOpted: false,
    insuranceType: 'per_ride'
  });
  const [locations, setLocations] = useState({
    pickup: { address: '', latitude: 28.6139, longitude: 77.2090 },
    drop: { address: '', latitude: 28.7041, longitude: 77.1025 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLocationChange = (type, field, value) => {
    setLocations(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleBookingChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const bookingPayload = {
        pickupLocation: {
          address: locations.pickup.address,
          latitude: locations.pickup.latitude,
          longitude: locations.pickup.longitude,
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        dropLocation: {
          address: locations.drop.address,
          latitude: locations.drop.latitude,
          longitude: locations.drop.longitude,
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110002'
        },
        bookingType: bookingData.bookingType,
        numberOfDays: parseInt(bookingData.numberOfDays),
        startDate: bookingData.startDate,
        endDate: new Date(new Date(bookingData.startDate).getTime() + parseInt(bookingData.numberOfDays) * 24 * 60 * 60 * 1000),
        driverId: driverId || null,
        insuranceOpted: bookingData.insuranceOpted,
        insuranceType: bookingData.insuranceOpted ? bookingData.insuranceType : 'none'
      };

      const response = await api.createBooking(bookingPayload);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess('Booking created successfully!');
        setTimeout(() => {
          navigate(`/payment?bookingId=${response.booking._id}&amount=${response.booking.finalPrice}`);
        }, 2000);
      }
    } catch (err) {
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h1 className="section-title">Book a Driver</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          {/* Booking Type */}
          <div className="form-group">
            <label className="form-label">Booking Type</label>
            <select
              className="form-select"
              value={bookingData.bookingType}
              onChange={(e) => handleBookingChange('bookingType', e.target.value)}
            >
              <option value="hourly">Hourly Booking</option>
              <option value="daily">Daily Booking</option>
              <option value="outstation">Outstation Booking</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={bookingData.startDate}
                onChange={(e) => handleBookingChange('startDate', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Number of Days</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={bookingData.numberOfDays}
                onChange={(e) => handleBookingChange('numberOfDays', e.target.value)}
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div className="form-group">
            <label className="form-label">Pickup Location</label>
            <input
              type="text"
              className="form-input"
              value={locations.pickup.address}
              onChange={(e) => handleLocationChange('pickup', 'address', e.target.value)}
              placeholder="Enter pickup address"
              required
            />
          </div>

          {/* Drop Location */}
          <div className="form-group">
            <label className="form-label">Drop Location</label>
            <input
              type="text"
              className="form-input"
              value={locations.drop.address}
              onChange={(e) => handleLocationChange('drop', 'address', e.target.value)}
              placeholder="Enter drop address"
              required
            />
          </div>

          {/* Insurance */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bookingData.insuranceOpted}
                onChange={(e) => handleBookingChange('insuranceOpted', e.target.checked)}
              />
              <span>Add Ride Insurance (₹50-200)</span>
            </label>
          </div>

          {bookingData.insuranceOpted && (
            <div className="form-group">
              <label className="form-label">Insurance Type</label>
              <select
                className="form-select"
                value={bookingData.insuranceType}
                onChange={(e) => handleBookingChange('insuranceType', e.target.value)}
              >
                <option value="per_ride">Per Ride (₹50)</option>
                <option value="monthly">Monthly Plan (₹200)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating Booking...' : 'Create Booking & Proceed to Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Booking;
