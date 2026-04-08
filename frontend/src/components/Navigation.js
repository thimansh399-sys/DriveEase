import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';
import AppButton from './AppButton';

function Navigation({ isLoggedIn, userRole, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedRole = String(userRole || '').toLowerCase();
  const isDriver = isLoggedIn && normalizedRole === 'driver';
  const isCustomer = isLoggedIn && (normalizedRole === 'customer' || normalizedRole === 'user');
  const showLogoutOnMainScreens =
    location.pathname === '/' ||
    location.pathname === '/profile' ||
    location.pathname === '/driver-dashboard' ||
    location.pathname === '/customer-dashboard';

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const guestTabs = [
    { to: '/', label: 'Home', end: true },
    { to: '/driver-directory', label: 'Live Driver' },
    { to: '/subscriptions', label: 'Plans' },
    { to: '/insurance', label: 'Insurance' },
    { to: '/pay', label: 'Pay' },
  ];

  const customerTabs = [
    { to: '/', label: 'Home', end: true },
    { to: '/book-ride', label: 'Book Ride' },
    { to: '/driver-directory', label: 'Live Driver' },
    { to: '/my-bookings', label: 'My Bookings' },
    { to: '/profile', label: 'Profile' },
  ];

  const driverTabs = [
    { to: '/driver-dashboard', label: 'Dashboard' },
    { to: '/my-bookings', label: 'Active Rides' },
    { to: '/driver-directory', label: 'Live Driver' },
    { to: '/driver-earnings', label: 'Earnings' },
    { to: '/profile', label: 'Profile' },
  ];

  const tabs = isDriver ? driverTabs : isCustomer ? customerTabs : guestTabs;

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

        </ul>

        {/* Right Buttons */}
        <div className="nav-actions">
          {!isLoggedIn ? (
            <>
              <AppButton as={Link} to="/login" size="sm" variant="glass" className="nav-button">
                Login
              </AppButton>
              <AppButton as={Link} to="/register-driver" size="sm" variant="primary" className="nav-button">
                Register as Driver
              </AppButton>
            </>
          ) : (
            <>
              {isDriver && (
                <>
                  <AppButton as={Link} to="/driver-dashboard" size="sm" variant="glass" className="nav-button">
                    Dashboard
                  </AppButton>
                  <AppButton as={Link} to="/driver-earnings" size="sm" variant="glass" className="nav-button">
                    Earnings
                  </AppButton>
                  {showLogoutOnMainScreens && (
                    <AppButton type="button" size="sm" variant="secondary" className="nav-button nav-button-logout" onClick={handleLogout}>
                      Logout
                    </AppButton>
                  )}
                </>
              )}
              {!isDriver && (
                <>
                  <AppButton as={Link} to="/register-driver" size="sm" variant="primary" className="nav-button">
                    Register as Driver
                  </AppButton>
                  {showLogoutOnMainScreens && (
                    <AppButton type="button" size="sm" variant="secondary" className="nav-button nav-button-logout" onClick={handleLogout}>
                      Logout
                    </AppButton>
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
