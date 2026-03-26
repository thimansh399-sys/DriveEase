import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer" style={{ width: '100vw', minWidth: '100vw', margin: 0, padding: 0 }}>
      <div className="footer-content">
        <div className="footer-section">
          <h3>DriveEase</h3>
          <p>India's First Personal Driver Network. Trusted by families across India.</p>
          <p><strong>Contact:</strong> +91-7836887228</p>
          <p><strong>Email:</strong> support@driveease.in</p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/browse">Find Drivers</Link>
          <Link to="/services">Services & Plans</Link>
          <Link to="/insurance">Insurance</Link>
        </div>
        <div className="footer-section">
          <h3>Support</h3>
          <a href="tel:+917836887228">Call Support</a>
          <a href="https://wa.me/+917836887228">WhatsApp</a>
          <a href="#faq">FAQs</a>
          <a href="#terms">Terms & Conditions</a>
        </div>
        <div className="footer-section">
          <h3>Brand Ambassador</h3>
          <p><strong>Himanshu Thakur</strong></p>
          <p>Growing DriveEase across India</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 DriveEase. All rights reserved. "Not just a ride, a trusted driver."</p>
      </div>
    </footer>
  );
}

export default Footer;
