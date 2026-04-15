import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to DriveEase</h1>
          <p className="hero-subtitle">India&apos;s Most Trusted Driver Booking Platform</p>
          <div className="hero-buttons">
            <Link to="/book-ride" className="btn btn-primary">Book Driver Now</Link>
            <Link to="/register-driver" className="btn btn-secondary">Become a Driver</Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">🚗 Safe & Verified Drivers</div>
        </div>
      </header>

      <section className="features-section">
        <div className="container">
          <h2>Why Choose DriveEase?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Verified Drivers</h3>
              <p>Aadhaar & License verified drivers only</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Live Tracking</h3>
              <p>Real-time GPS tracking & ETA</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Insurance Included</h3>
              <p>₹5 Lakh accident insurance per ride</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>5-Star Service</h3>
              <p>4.8/5 rating from 50K+ customers</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Book?</h2>
          <p>Get your trusted driver in minutes</p>
          <Link to="/book-ride" className="btn btn-primary btn-large">Start Booking</Link>
        </div>
      </section>

      <footer className="simple-footer">
        <p>&copy; 2024 DriveEase. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;

