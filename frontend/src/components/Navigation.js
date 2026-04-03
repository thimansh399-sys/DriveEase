import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ isLoggedIn, userRole, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isDriver = isLoggedIn && userRole === 'driver';
  const isCustomer = isLoggedIn && (userRole === 'customer' || userRole === 'user');
  const showLogoutOnMainScreens =
    location.pathname === '/' ||
    location.pathname === '/profile' ||
    location.pathname === '/driver-dashboard' ||
    location.pathname === '/customer-dashboard';

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

  if (isLoggedIn) {
    tabs.push({ to: '/profile', label: 'Profile' });
  }
  if (isCustomer) tabs.push({ to: '/my-bookings', label: 'My Bookings' });
  if (isDriver) {
    tabs.push({ to: '/driver-dashboard', label: 'Dashboard' });
    tabs.push({ to: '/my-bookings', label: 'My Rides' });
  }

  return (
    <nav className="navigation">
      <div className="nav-content">
        {/* Logo */}
        <Link to="/" className="nav-brand">
          <img src="/driveease-logo.svg" alt="DriveEase" className="nav-brand-logo" />
          <span className="nav-brand-text">DriveEase</span>
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

          {!isLoggedIn && (
            <>
              <li className="nav-mobile-only">
                <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              </li>
              <li className="nav-mobile-only">
                <Link to="/register-driver" className="nav-link" onClick={() => setMenuOpen(false)}>Register as Driver</Link>
              </li>
            </>
          )}

          {isLoggedIn && (
            <>
              {isDriver && (
                <li className="nav-mobile-only">
                  <Link to="/driver-dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                </li>
              )}
              {!isDriver && (
                <li className="nav-mobile-only">
                  <Link to="/register-driver" className="nav-link" onClick={() => setMenuOpen(false)}>Register as Driver</Link>
                </li>
              )}
              <li className="nav-mobile-only">
                {showLogoutOnMainScreens && (
                  <button
                    type="button"
                    className="nav-link nav-link-button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                )}
              </li>
            </>
          )}

          <li className="nav-mobile-only">
            <Link to="/book-driver" className="nav-link" onClick={() => setMenuOpen(false)}>Book a Driver</Link>
          </li>
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
                <>
                  <Link to="/driver-dashboard" className="nav-button btn-outline">Dashboard</Link>
                  {showLogoutOnMainScreens && (
                    <button type="button" className="nav-button btn-logout" onClick={handleLogout}>Logout</button>
                  )}
                </>
              )}
              {!isDriver && (
                <>
                  <Link to="/register-driver" className="nav-button btn-register">Register as Driver</Link>
                  {showLogoutOnMainScreens && (
                    <button type="button" className="nav-button btn-logout" onClick={handleLogout}>Logout</button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
