import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-section">
          <div className="footer-brand">🚗 DriveEase</div>
          <p className="footer-description">India's First Personal Driver Network.<br />Trusted by families across India.</p>
          <div className="footer-contact-item">
            <span className="footer-contact-icon">📞</span>
            <span>+91-7836887228</span>
          </div>
          <div className="footer-contact-item">
            <span className="footer-contact-icon">✉️</span>
            <span>support@driveease.in</span>
          </div>
        </div>
        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/browse">Find Drivers</Link></li>
            <li><Link to="/services">Services & Plans</Link></li>
            <li><Link to="/insurance">Insurance</Link></li>
          </ul>
        </div>
        {/* Support */}
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="tel:+917836887228">Call Support</a></li>
            <li><a href="https://wa.me/+917836887228" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href="#faq">FAQs</a></li>
            <li><a href="#terms">Terms & Conditions</a></li>
          </ul>
        </div>
        {/* Brand Ambassador */}
        <div className="footer-section">
          <p className="footer-description" style={{ marginBottom: '8px' }}>Himanshu Thakur</p>
          <p className="footer-description">Growing DriveEase across India 🇮🇳</p>
          <div className="footer-social">
            <a href="https://wa.me/+917836887228" target="_blank" rel="noopener noreferrer" title="WhatsApp">💬</a>
            <a href="tel:+917836887228" title="Call">📞</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 DriveEase. All rights reserved. "Not just a ride, a trusted driver."</p>
      </div>
    </footer>
  );
}

export default Footer;