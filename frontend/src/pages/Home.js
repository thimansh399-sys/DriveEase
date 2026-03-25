import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const plans = [
    {
      name: 'Office Commute',
      price: '₹4,999',
      period: '/month',
      description: 'Regular 2-hour daily driver for office commute',
      features: ['2 hours daily', 'Fixed driver', 'Insurance included']
    },
    {
      name: 'School & Evening',
      price: '₹3,999',
      period: '/month',
      description: 'Kids school pickup and evening family activities',
      features: ['Flexible hours', 'Safe & trained', 'Family tracking']
    },
    {
      name: 'Senior Care',
      price: '₹5,999',
      period: '/month',
      description: 'Dedicated driver for elderly family members',
      features: ['24/7 availability', 'Medical trained', 'Emergency SOS']
    },
    {
      name: 'Weekend Family',
      price: '₹1,999',
      period: '/month',
      description: 'Enjoy weekends without driving stress',
      features: ['Weekends only', 'Family driver', 'Best rates']
    }
  ];

  const paymentDetails = {
    upi: '+91-7836887228',
    bank: {
      account: '922010062230782',
      ifsc: 'UTIB0004620',
      name: 'Krishna Kant Pandey',
      bank: 'Axis Bank'
    }
  };

  return (
    <div className="home-page" style={{ fontFamily: 'Poppins, sans-serif', background: '#101820', minHeight: '100vh', margin: 0, padding: 0, width: '100vw', height: '100vh', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* Hero Section */}
      <section className="hero grid-container" style={{
        minHeight: 'calc(100vh - 80px)', height: 'calc(100vh - 80px)', width: '100vw',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: 'linear-gradient(120deg, #101820 60%, #16a34a 100%)',
        overflow: 'hidden', margin: 0, padding: 0, position: 'relative',
      }}>
        {/* Hero Content (left) */}
        <div className="hero-content content" style={{ maxWidth: 600, zIndex: 3, color: '#fff', textAlign: 'left', marginLeft: '4vw', alignSelf: 'center', justifySelf: 'start' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: 18, lineHeight: 1.1 }}>Not just a ride,<br />a <span style={{ color: '#16a34a' }}>trusted driver</span>.</h1>
          <p style={{ fontSize: '22px', marginBottom: 32, opacity: 0.95, fontWeight: 500 }}>
            We don’t assign just a driver — we assign someone your family can trust.<br />
            <span style={{ fontSize: 16, color: '#b6f5d8', fontWeight: 600 }}>India’s First Personal Driver Network</span>
          </p>
          <div style={{ display: 'flex', gap: 18, marginBottom: 32 }}>
            <Link to="/booking" className="btn" style={{ background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 18, padding: '14px 38px', borderRadius: 8, textDecoration: 'none', boxShadow: '0 4px 16px rgba(22,163,74,0.18)', transition: 'all 0.2s' }}>Get Your Trusted Driver</Link>
            <Link to="/subscriptions" className="btn" style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', fontWeight: 700, fontSize: 18, padding: '14px 38px', borderRadius: 8, textDecoration: 'none', transition: 'all 0.2s' }}>View Family Plans</Link>
          </div>
          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
            <div style={{ background: 'rgba(22,163,74,0.12)', borderRadius: 8, padding: '10px 18px', color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⭐ 4.8 Rating
            </div>
            <div style={{ background: 'rgba(22,163,74,0.12)', borderRadius: 8, padding: '10px 18px', color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🚗 5000+ Drivers
            </div>
            <div style={{ background: 'rgba(22,163,74,0.12)', borderRadius: 8, padding: '10px 18px', color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              👥 10,000+ Customers
            </div>
            <div style={{ background: 'rgba(22,163,74,0.12)', borderRadius: 8, padding: '10px 18px', color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ Aadhaar Verified
            </div>
          </div>
          {/* Brand Ambassador */}
          <div style={{ marginTop: 10, color: '#b6f5d8', fontWeight: 600, fontSize: 15 }}>
            Brand Ambassador: Himanshu Thakur
          </div>
        </div>
        {/* Background image (right) */}
        <div style={{ gridColumn: 2, gridRow: 1, height: '100%', width: '100%', position: 'relative' }}>
          <img src="https://gsiglobe.com/assets/img/personal-driver.jpg" alt="DriveEase Driver" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '100%', objectFit: 'cover', zIndex: 1, display: 'block' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(16,24,32,0.3) 0%, rgba(22,163,74,0.3) 100%)', zIndex: 2 }} />
        </div>
        {/* Floating WhatsApp Button */}
        <a href="https://wa.me/+917836887228" target="_blank" rel="noopener noreferrer" style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200 }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" style={{ width: 56, height: 56, borderRadius: '50%', boxShadow: '0 4px 16px rgba(22,163,74,0.18)' }} />
        </a>
      </section>
      {/* Footer */}
      <footer style={{ background: '#101820', color: '#b6f5d8', padding: '32px 0 16px 0', textAlign: 'center', marginTop: 40 }}>
        <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 18 }}>Need Help? Contact Us Directly</div>
        <div style={{ marginBottom: 8 }}>Support: <a href="tel:+917836887228" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}>+91-7836887228</a> | <a href="mailto:support@driveease.in" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}>support@driveease.in</a></div>
        <div style={{ marginBottom: 8 }}>
          <Link to="/" style={{ color: '#b6f5d8', margin: '0 12px', textDecoration: 'none' }}>Home</Link>
          <Link to="/booking" style={{ color: '#b6f5d8', margin: '0 12px', textDecoration: 'none' }}>Book Driver</Link>
          <Link to="/register-driver" style={{ color: '#b6f5d8', margin: '0 12px', textDecoration: 'none' }}>Register Driver</Link>
          <Link to="/track-booking" style={{ color: '#b6f5d8', margin: '0 12px', textDecoration: 'none' }}>Track Booking</Link>
        </div>
        <div style={{ fontSize: 13, color: '#b6f5d8', marginTop: 10 }}>© 2026 DriveEase. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default Home;
