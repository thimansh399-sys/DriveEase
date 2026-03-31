import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';







// Sidebar Component
function Sidebar() {
  return (
    <div className="sidebar">
      <h2>🚗 DriveEase</h2>
      <a href="#" className="active">Dashboard</a>
      {/* Removed Profile, Booking History, Pay History buttons */}
    </div>
  );
}

// Header Component
function Header({ user }) {
  return (
    <div className="header">
      <h2>Customer Dashboard</h2>
      <div className="user">👋 Hi, {user?.name || 'User'}</div>
    </div>
  );
}

// Profile Card
function ProfileCard({ user }) {
  return (
    <div className="card">
      <h3>👤 Profile</h3>
      <p>Name: {user?.name || ''}</p>
      <p>Phone: {user?.phone || ''}</p>
    </div>
  );
}

// Active Ride Card
function ActiveRide({ bookings }) {
  const active = Array.isArray(bookings) ? bookings.find(b => b.status && b.status !== 'completed') : null;
  if (!active) return null;
  return (
    <div className="card">
      <h3>🚗 Active Ride</h3>
      <p>Status: {active.status === 'on_the_way' ? 'On the way' : active.status}</p>
      <p>Driver: {active.driver || '-'}</p>
    </div>
  );
}

// Book Ride Card
function BookRideCard({ user, onBook, loading, error, success }) {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  // For demo, driver is static
  const [driver] = useState('Rahul');

  const handleBook = () => {
    onBook({ pickup, drop, driver });
    setPickup(''); setDrop('');
  };

  return (
    <div className="card">
      <h3>📍 Book Ride</h3>
      <input placeholder="Pickup Location" value={pickup} onChange={e => setPickup(e.target.value)} />
      <input placeholder="Drop Location" value={drop} onChange={e => setDrop(e.target.value)} />
      <button className="btn" onClick={handleBook} disabled={loading}>{loading ? 'Booking...' : 'Book Now'}</button>
      {error && <div style={{color:'red',marginTop:10}}>{error}</div>}
      {success && <div style={{color:'lime',marginTop:10}}>{success}</div>}
    </div>
  );
}

// Ride History Card (Card View)
function RideHistory({ bookings }) {
  return (
    <div className="card full">
      <h3>📜 Ride History</h3>
      {Array.isArray(bookings) && bookings.length > 0 ? bookings.map((b, i) => (
        <div className="ride-item" key={b._id || i}>
          <p>{b.driver || '-'}</p>
          <span>{b.status}</span>
          <b>{b.amount ? `₹${b.amount}` : '-'}</b>
        </div>
      )) : <div className="ride-item">No rides yet</div>}
    </div>
  );
}
// Stats Section
function Stats({ bookings }) {
  // Calculate stats
  const totalRides = Array.isArray(bookings) ? bookings.length : 0;
  const totalSpent = Array.isArray(bookings) ? bookings.reduce((sum, b) => sum + (b.amount || 0), 0) : 0;
  const rating = 4.8; // Static for now
  const activeRides = Array.isArray(bookings) ? bookings.filter(b => b.status && b.status !== 'completed').length : 0;
  return (
    <div className="stats">
      <div className="stat-card">
        <h3>{totalRides}</h3>
        <p>Total Rides</p>
      </div>
      <div className="stat-card">
        <h3>₹{totalSpent.toLocaleString()}</h3>
        <p>Total Spent</p>
      </div>
      <div className="stat-card">
        <h3>{rating} ⭐</h3>
        <p>Rating</p>
      </div>
      <div className="stat-card">
        <h3>{activeRides}</h3>
        <p>Active Rides</p>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user and bookings
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetch(`http://localhost:5000/api/bookings/${parsed.phone}`, {
        headers: { Authorization: 'Bearer ' + token }
      })
        .then(res => res.json())
        .then(data => setBookings(Array.isArray(data) ? data : []))
        .catch(() => setBookings([]));
    }
  }, []);

  // Book ride handler
  const handleBook = async ({ pickup, drop, driver }) => {
    if (!pickup || !drop) {
      setError('Please fill all fields');
      setSuccess('');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({
          userId: user.phone,
          pickup,
          drop,
          driver,
          status: 'pending'
        })
      });
      setSuccess('Booking successful!');
      // Refresh bookings
      fetch(`http://localhost:5000/api/bookings/${user.phone}`, {
        headers: { Authorization: 'Bearer ' + token }
      })
        .then(res => res.json())
        .then(data => setBookings(Array.isArray(data) ? data : []));
    } catch (err) {
      setError('Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main">
        <Header user={user} />
        <div className="content">
          <div className="full">
            <Stats bookings={bookings} />
          </div>
          <ProfileCard user={user} />
          <ActiveRide bookings={bookings} />
          <BookRideCard user={user} onBook={handleBook} loading={loading} error={error} success={success} />
          <RideHistory bookings={bookings} />
        </div>
      </div>
    </div>
  );
}
