import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ isLoggedIn, userRole, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isDriver = isLoggedIn && userRole === 'driver';
  const isCustomer = isLoggedIn && (userRole === 'customer' || userRole === 'user');

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const tabs = [
    { to: '/', label: 'Home', end: true },
    { to: '/drivers', label: 'Drivers' },
    { to: '/subscriptions', label: 'Plans' },
    { to: '/insurance', label: 'Insurance' },
    { to: '/pay', label: 'Pay' },
  ];

  if (isCustomer) tabs.push({ to: '/my-bookings', label: 'My Bookings' });
  if (isDriver) tabs.push({ to: '/my-bookings', label: 'My Rides' });

  return (
    <nav className="navigation">
      <div className="nav-content">
        {/* Logo */}
        <Link to="/" className="nav-brand">
          <span>🚗</span> DriveEase
        </Link>

        {/* Mobile Toggle */}
        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Tabs */}
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          {tabs.map(({ to, label, end }) => (
            <li key={to + label}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right Buttons */}
        <div className="nav-actions">
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="nav-button btn-outline">Login</Link>
              <Link to="/register-driver" className="nav-button btn-register">Register as Driver</Link>
            </>
          ) : (
            <>
              {isDriver && (
                <Link to="/driver-dashboard" className="nav-button btn-outline">Dashboard</Link>
              )}
              {!isDriver && (
                <Link to="/register-driver" className="nav-button btn-register">Register as Driver</Link>
              )}
              <button onClick={handleLogout} className="nav-button btn-logout">Logout</button>
            </>
          )}
          <Link to="/book-driver" className="nav-button btn-primary">🚗 Book a Driver</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
