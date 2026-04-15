import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import api from '../utils/api';
import { connectRideSocket } from '../utils/rideSocket';

function Header({ user }) {
  return (
    <div className="header">
      <h2>Customer Dashboard</h2>
      <div className="header-actions">
        <div className="user">👋 Hi, {user?.name || 'User'}</div>
      </div>
    </div>
  );
}

function ProfileCard({ user }) {
  return (
    <div className="card">
      <h3>👤 Profile</h3>
      <p>Name: {user?.name || ''}</p>
      <p>Phone: {user?.phone || ''}</p>
    </div>
  );
}

function ActiveRide({ bookings }) {
  const active = Array.isArray(bookings) ? bookings.find((b) => b.status && b.status !== 'completed') : null;
  if (!active) return null;

  const driverName = typeof active.driver === 'string' ? active.driver : (active.driver?.name || '-');

  return (
    <div className="card">
      <h3>🚗 Active Ride</h3>
      <p>Status: {active.status === 'on_the_way' ? 'On the way' : active.status}</p>
      <p>Driver: {driverName}</p>
    </div>
  );
}

function RideHistory({ bookings }) {
  return (
    <div className="card full">
      <h3>📜 Ride History</h3>
      {Array.isArray(bookings) && bookings.length > 0 ? bookings.map((b, i) => (
        <div className="ride-item" key={b._id || i}>
          <p>{typeof b.driver === 'string' ? b.driver : (b.driver?.name || '-')}</p>
          <span>{b.status}</span>
          <b>{b.amount ? `₹${b.amount}` : '-'}</b>
        </div>
      )) : <div className="ride-item">No rides yet</div>}
    </div>
  );
}

function Stats({ bookings }) {
  const totalRides = Array.isArray(bookings) ? bookings.length : 0;
  const totalSpent = Array.isArray(bookings) ? bookings.reduce((sum, b) => sum + (b.amount || 0), 0) : 0;
  const rating = 4.8;
  const activeRides = Array.isArray(bookings) ? bookings.filter((b) => b.status && b.status !== 'completed').length : 0;

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
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      api.getMyBookings()
        .then((data) => {
          const list = data?.bookings || data || [];
          setBookings(Array.isArray(list) ? list : []);
        })
        .catch(() => setBookings([]));
    }
  }, []);

  const activeBooking = useMemo(
    () => bookings.find((booking) => ['driver_arrived', 'confirmed', 'in_progress', 'ON_TRIP'].includes(booking?.status)),
    [bookings]
  );

  useEffect(() => {
    if (!activeBooking?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return undefined;
    }

    const bookingId = String(activeBooking._id);
    const socket = connectRideSocket(bookingId);
    socketRef.current = socket;

    socket.on('ride_started', (payload = {}) => {
      if (String(payload.bookingId || '') === bookingId) {
        navigate(`/track-booking/${bookingId}`);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeBooking?._id, navigate]);

  return (
    <div className="dashboard">
      <div className="main">
        <Header user={user} />
        <div className="content">
          <div className="full">
            <Stats bookings={bookings} />
            <ProfileCard user={user} />
            <ActiveRide bookings={bookings} />
            <RideHistory bookings={bookings} />
          </div>
        </div>
      </div>
    </div>
  );
}
