import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
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
          {/* ...rest of the component... */}
        </button>
      </div>
    </nav>
  );
}

export default Navigation;