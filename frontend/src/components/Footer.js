import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>DriveEase</h3>
          <p>India's First Personal Driver Network. Trusted by families across India.</p>
          <p><strong>Contact:</strong> +91-7836887228</p>
          <p><strong>Email:</strong> support@driveease.in</p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <a href="/">Home</a>
          <a href="/browse">Find Drivers</a>
          <a href="/services">Services & Plans</a>
          <a href="/insurance">Insurance</a>
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
