import React from 'react';
import { Link } from 'react-router-dom';

function Services() {
  return (
    <div className="section">
      <h1 className="section-title">DriveEase Services</h1>

      <div className="grid grid-2">
        {/* Subscriptions */}
        <Link to="/services" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <h3 style={{ color: '#16a34a' }}>📅 Subscription Plans</h3>
          <p>Monthly plans starting from ₹1,999</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Get assigned drivers for regular needs</p>
        </Link>

        {/* Insurance */}
        <Link to="/services" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <h3 style={{ color: '#16a34a' }}>🛡️ Ride Insurance</h3>
          <p>₹50 per ride or ₹200/month</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Protection for accidental damages</p>
        </Link>

        {/* My Bookings */}
        <Link to="/my-bookings" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <h3 style={{ color: '#16a34a' }}>🗂️ My Bookings</h3>
          <p>View all your active and past bookings</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Manage your rides and payments</p>
        </Link>

        {/* Payments */}
        <Link to="/payment" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <h3 style={{ color: '#16a34a' }}>💳 Payment Methods</h3>
          <p>UPI, Bank Transfer, and more</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Secure and easy payments</p>
        </Link>

        {/* Support */}
        <div className="card">
          <h3 style={{ color: '#16a34a' }}>📞 24/7 Support</h3>
          <p><strong>Phone:</strong> <a href="tel:+917836887228">+91-7836887228</a></p>
          <p><strong>WhatsApp:</strong> <a href="https://wa.me/+917836887228" target="_blank" rel="noopener noreferrer">Chat Now</a></p>
        </div>

        {/* Helpline */}
        <div className="card">
          <h3 style={{ color: '#16a34a' }}>🚑 Emergency Helpline</h3>
          <p>Ambulance & Medical Support</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Available during rides</p>
        </div>
      </div>
    </div>
  );
}

export default Services;
