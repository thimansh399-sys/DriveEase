import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function DriverProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/drivers/${id}`)
      .then(res => res.json())
      .then(data => {
        setDriver(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load driver details');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading driver profile...</div>;
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>;
  if (!driver) return <div className="text-center py-12">Driver not found.</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-black px-4 py-8 flex flex-col items-center">
      <button onClick={() => navigate(-1)} className="mb-6 text-emerald-600 hover:underline">← Back to Drivers</button>
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl animate-fade-in">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-emerald-600">
            {driver.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{driver.name}</h2>
            <div className="text-gray-700 mb-1">{driver.city}, {driver.state}</div>
            <div className="text-gray-500 text-xs">Pincode: {driver.pincode}</div>
            <div className="flex gap-2 flex-wrap text-xs mt-2">
              {driver.verified && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Verified</span>}
              {driver.badges?.map(b => <span key={b} className="bg-gray-200 text-gray-700 px-2 py-1 rounded">{b}</span>)}
            </div>
          </div>
        </div>
        <div className="mb-4 text-gray-800">
          <strong>Experience:</strong> {driver.experience || 'N/A'} years<br />
          <strong>Languages:</strong> {driver.languages?.join(', ') || 'N/A'}<br />
          <strong>Background Verification:</strong> {driver.backgroundVerified ? 'Complete' : 'Pending'}<br />
          <strong>Medical Fitness:</strong> {driver.medicalFitness ? 'Fit' : 'N/A'}
        </div>
        {/* Booking Form */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-emerald-600 mb-2">Book This Driver</h3>
          <BookingForm driverId={driver._id} driverName={driver.name} />
        </div>
      // BookingForm component
      function BookingForm({ driverId, driverName }) {
        const [pickup, setPickup] = useState('');
        const [drop, setDrop] = useState('');
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');
        const [days, setDays] = useState(1);
        const [loading, setLoading] = useState(false);
        const [success, setSuccess] = useState('');
        const [error, setError] = useState('');

        const handleSubmit = async (e) => {
          e.preventDefault();
          setLoading(true);
          setError('');
          setSuccess('');
          try {
            const res = await fetch('/api/bookings/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                driverId,
                pickupLocation: { address: pickup },
                dropLocation: { address: drop },
                bookingType: 'personal_driver',
                startDate,
                endDate,
                numberOfDays: days,
                insuranceOpted: false,
                insuranceType: 'none',
              }),
            });
            if (!res.ok) throw new Error('Booking failed');
            setSuccess('Booking successful! You will be contacted soon.');
            setPickup(''); setDrop(''); setStartDate(''); setEndDate(''); setDays(1);
          } catch (err) {
            setError('Booking failed. Please try again.');
          }
          setLoading(false);
        };

        return (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              className="bg-white rounded px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Pickup Location"
              value={pickup}
              onChange={e => setPickup(e.target.value)}
              required
            />
            <input
              className="bg-white rounded px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Drop Location"
              value={drop}
              onChange={e => setDrop(e.target.value)}
              required
            />
            <div className="flex gap-4">
              <div className="flex flex-col flex-1">
                <label className="text-xs text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  className="bg-white rounded px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  className="bg-white rounded px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs text-gray-600 mb-1">Days</label>
                <input
                  type="number"
                  min="1"
                  className="bg-white rounded px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={days}
                  onChange={e => setDays(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg shadow font-semibold transition"
              disabled={loading}
            >
              {loading ? 'Booking...' : `Book ${driverName}`}
            </button>
            {success && <div className="text-green-600 font-semibold mt-2">{success}</div>}
            {error && <div className="text-red-500 font-semibold mt-2">{error}</div>}
          </form>
        );
      }
      </div>
    </div>
  );
}
