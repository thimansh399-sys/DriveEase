import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ isLoggedIn, userRole, onLogout }) {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🚗 DriveEase
      </Link>
      <ul className="navbar-menu">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/available-drivers" style={{ color: '#667eea', fontWeight: 'bold' }}>👥 Available Drivers</Link></li>
        {isLoggedIn && userRole !== 'admin' && userRole !== 'driver' && (
          <>
            <li><Link to="/browse">Find Driver</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/my-bookings">My Bookings</Link></li>
          </>
        )}
        {isLoggedIn && userRole === 'driver' && (
          <li><Link to="/driver-dashboard">Driver Dashboard</Link></li>
        )}
        {isLoggedIn && userRole === 'admin' && (
          <>
            <li><Link to="/admin">Admin Dashboard</Link></li>
            <li><Link to="/admin-dashboard">📊 Enhanced Dashboard</Link></li>
          </>
        )}
        {!isLoggedIn && (
          <>
            <li><Link to="/login" className="btn btn-primary">Login</Link></li>
            <li><Link to="/driver-registration" className="btn btn-outline">🚗 Register as Driver</Link></li>
          </>
        )}
        {isLoggedIn && (
          <li><button className="btn btn-danger" onClick={onLogout}>Logout</button></li>
        )}
      </ul>
    </nav>
  );
}

export default Navigation;
