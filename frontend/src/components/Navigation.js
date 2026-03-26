import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation() {
  // No need for useLocation or navLinkStyle with NavLink's active class
  return (
    <header className="navbar sticky-header" style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '18px 40px', background: 'rgba(16,24,32,0.98)', color: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      width: '100%', boxSizing: 'border-box', margin: 0, overflowX: 'hidden'
    }}>
      <div className="logo" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: 1, color: '#16a34a' }}>
        DriveEase
      </div>
      <nav style={{ display: 'flex', gap: '28px', fontWeight: 600 }}>
        <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""} end>Home</NavLink>
        <NavLink to="/drivers" className={({ isActive }) => isActive ? "active" : ""}>Drivers</NavLink>
        <NavLink to="/subscriptions" className={({ isActive }) => isActive ? "active" : ""}>Plans</NavLink>
        <NavLink to="/insurance" className={({ isActive }) => isActive ? "active" : ""}>Insurance</NavLink>
        <NavLink to="/pay" className={({ isActive }) => isActive ? "active" : ""}>Pay</NavLink>
        <NavLink to="/my-bookings" className={({ isActive }) => isActive ? "active" : ""}>My Bookings</NavLink>
      </nav>
      <div className="actions" style={{ display: 'flex', gap: '12px' }}>
        <Link to="/login" className="btn" style={{ background: 'transparent', color: '#16a34a', border: '1.5px solid #16a34a', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none' }}>Login</Link>
        <Link to="/register-driver" className="btn" style={{ background: '#16a34a', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none' }}>Register as Driver</Link>
        <Link to="/booking" className="btn" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}>Book a Driver</Link>
      </div>
    </header>
  );
}

export default Navigation;
