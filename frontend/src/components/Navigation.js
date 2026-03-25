import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation() {
  const location = useLocation();
  const navLinkStyle = (path) => ({
    color: '#fff',
    textDecoration: 'none',
    fontWeight: location.pathname === path ? 900 : 600,
    borderBottom: location.pathname === path ? '2.5px solid #16a34a' : 'none',
    paddingBottom: '2px',
    transition: 'border 0.2s',
  });
  return (
    <header className="navbar sticky-header" style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '18px 40px', background: 'rgba(16,24,32,0.98)', color: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
    }}>
      <div className="logo" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: 1, color: '#16a34a' }}>
        DriveEase
      </div>
      <nav style={{ display: 'flex', gap: '28px', fontWeight: 600 }}>
        <Link to="/" style={navLinkStyle('/')}>Home</Link>
        <Link to="/drivers" style={navLinkStyle('/drivers')}>Drivers</Link>
        <Link to="/subscriptions" style={navLinkStyle('/subscriptions')}>Plans</Link>
        <Link to="/insurance" style={navLinkStyle('/insurance')}>Insurance</Link>
        <Link to="/pay" style={navLinkStyle('/pay')}>Pay</Link>
        <Link to="/my-bookings" style={navLinkStyle('/my-bookings')}>My Bookings</Link>
      </nav>
      <div className="actions" style={{ display: 'flex', gap: '12px' }}>
        <Link to="/login" className="btn" style={{ background: 'transparent', color: '#16a34a', border: '1.5px solid #16a34a', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none' }}>Login</Link>
        <Link to="/register-driver" className="btn" style={{ background: '#16a34a', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none' }}>Register as Driver</Link>
        <Link to="/booking" className="btn" style={{ background: '#fff', color: '#16a34a', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>Book a Driver</Link>
      </div>
    </header>
  );
}

export default Navigation;
