import React from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode.react';
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
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        transform: 'perspective(1000px)'
      }}>
        <div className="hero-content" style={{
          animation: 'slideInDown 0.8s ease-out'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
            textShadow: '2px 8px 16px rgba(0,0,0,0.3)',
            letterSpacing: '-1px'
          }}>🚗 Not just a ride, a trusted driver.</h1>
          <p style={{
            fontSize: '20px',
            marginBottom: '30px',
            opacity: 0.95,
            lineHeight: '1.6'
          }}>India's First Personal Driver Network — Assigned drivers you can trust for family, office, and peace of mind.</p>
          <div className="hero-buttons" style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '30px'
          }}>
            <Link to="/available-drivers" className="btn btn-primary btn-lg" style={{
              background: 'white',
              color: '#667eea',
              fontWeight: 'bold',
              padding: '15px 30px',
              fontSize: '16px',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
            }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              👥 Browse Available Drivers
            </Link>
            <Link to="/browse" className="btn btn-primary btn-lg" style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold',
              padding: '15px 30px',
              fontSize: '16px',
              border: '2px solid white',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
            }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}>
              📖 Book a Driver
            </Link>
            <Link to="/services" className="btn btn-outline btn-lg" style={{
              background: 'transparent',
              color: 'white',
              fontWeight: 'bold',
              padding: '15px 30px',
              fontSize: '16px',
              border: '2px solid white',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
            }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
              💼 View Plans
            </Link>
          </div>
          <div className="trust-badges">
            <div className="badge">
              <div className="badge-icon">⭐</div>
              <div className="badge-text">4.8 Rating</div>
            </div>
            <div className="badge">
              <div className="badge-icon">🚗</div>
              <div className="badge-text">500+ Drivers</div>
            </div>
            <div className="badge">
              <div className="badge-icon">👥</div>
              <div className="badge-text">10,000+ Users</div>
            </div>
            <div className="badge">
              <div className="badge-icon">✅</div>
              <div className="badge-text">Aadhaar Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="section">
        <h2 className="section-title">The DriveEase Difference</h2>
        <div className="grid grid-2">
          <div className="card">
            <h3>👨‍👩‍👧 Assigned Driver System</h3>
            <p>Get the same trusted driver for office, family trips, school pickup, and medical visits. Build a real relationship.</p>
          </div>
          <div className="card">
            <h3>👨‍👩‍👧 Family Account</h3>
            <p>One account, multiple family members. SOS alerts go to family, not customer support. True peace of mind.</p>
          </div>
          <div className="card">
            <h3>💰 Subscription Plans</h3>
            <p>Monthly plans from ₹1,999. No surge pricing. No surprise charges. "What you see is what you pay."</p>
          </div>
          <div className="card">
            <h3>🔐 Trust Transparency</h3>
            <p>See police verification, training badges, medical fitness, languages, and experience. Know who drives your family.</p>
          </div>
          <div className="card">
            <h3>🎓 Grooming & Training</h3>
            <p>Mandatory etiquette, safety, and behavior training. Not just more drivers — better drivers.</p>
          </div>
          <div className="card">
            <h3>📍 City-Champion Quality</h3>
            <p>We focus on one city at a time to ensure maximum quality and trust. Currently in 10+ major Indian cities.</p>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="section" style={{ backgroundColor: '#f9fafb', padding: '60px 20px' }}>
        <h2 className="section-title">Subscription Plans</h2>
        <div className="grid grid-2">
          {plans.map((plan, idx) => (
            <div key={idx} className="card" style={{ border: '2px solid #16a34a' }}>
              <h3>{plan.name}</h3>
              <div style={{ margin: '15px 0' }}>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>{plan.price}</span>
                <span style={{ color: '#666' }}>{plan.period}</span>
              </div>
              <p style={{ marginBottom: '15px', color: '#666' }}>{plan.description}</p>
              <ul style={{ marginBottom: '15px', listStyle: 'none', color: '#666' }}>
                {plan.features.map((feature, i) => (
                  <li key={i}> ✓ {feature}</li>
                ))}
              </ul>
              <Link to="/services" className="btn btn-primary">Get This Plan</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Section */}
      <section className="section">
        <h2 className="section-title">Payment Methods</h2>
        <div className="grid grid-2">
          {/* UPI */}
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>📱 PhonePe / UPI</h3>
            <p style={{ marginBottom: '20px' }}>{paymentDetails.upi}</p>
            <div style={{
              backgroundColor: '#f0f0f0',
              padding: '20px',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              <QRCode value={`upi://pay?pa=${paymentDetails.upi}`} size={200} />
            </div>
            <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>Scan to pay via UPI</p>
          </div>

          {/* Bank Transfer */}
          <div className="card">
            <h3>🏦 Bank Transfer</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <p><strong>Account Holder:</strong> {paymentDetails.bank.name}</p>
              <p><strong>Account Number:</strong> {paymentDetails.bank.account}</p>
              <p><strong>IFSC Code:</strong> {paymentDetails.bank.ifsc}</p>
              <p><strong>Bank:</strong> {paymentDetails.bank.bank}</p>
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
                <p style={{ margin: '0', fontSize: '12px' }}>Reference: Your Booking ID</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" style={{ backgroundColor: '#f9fafb', padding: '60px 20px' }}>
        <h2 className="section-title">How DriveEase Works</h2>
        <div className="grid grid-3">
          <div className="card">
            <h3 style={{ color: '#16a34a' }}>1. Choose Your Plan</h3>
            <p>Select a subscription or booking type that fits your needs. From office commute to family outings.</p>
          </div>
          <div className="card">
            <h3 style={{ color: '#16a34a' }}>2. Get Assigned Driver</h3>
            <p>Meet your trusted, trained personal driver. Same person every time you need them.</p>
          </div>
          <div className="card">
            <h3 style={{ color: '#16a34a' }}>3. Build Relationship</h3>
            <p>Enjoy peace of mind knowing your family is with someone you trust deeply.</p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="section">
        <h2 className="section-title">Trusted by Families</h2>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '18px', fontStyle: 'italic', marginBottom: '20px' }}>
            "My parents feel safer now. The same driver comes every day. They know him, he knows them. It's not just transportation anymore — it's peace of mind."
          </p>
          <p style={{ fontWeight: 'bold', color: '#16a34a' }}>— Verified Family, Delhi</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        color: 'white',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Ready to Experience the DriveEase Difference?</h2>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>Join thousands of families who trust DriveEase for their transportation needs.</p>
        <Link to="/browse" className="btn" style={{ backgroundColor: 'white', color: '#16a34a', fontWeight: 'bold' }}>
          Book Your Driver Today
        </Link>
      </section>

      {/* Driver Signup CTA */}
      <section className="section" style={{ backgroundColor: '#f9fafb', padding: '80px 20px' }}>
        <h2 className="section-title" style={{ fontSize: '36px', marginBottom: '40px' }}>Are You a Driver? 🚘</h2>
        <div className="card" style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '60px 40px',
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          border: '3px solid #667eea',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(102, 126, 234, 0.15)'
        }}>
          <p style={{ fontSize: '20px', marginBottom: '30px', lineHeight: '1.7', color: '#333' }}>Join India's most trusted driver network. Work with respect, flexible hours, and great earnings.</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '24px', marginBottom: '10px' }}>💰</p>
              <p style={{ fontWeight: 'bold', color: '#667eea' }}>Fixed income + incentives</p>
            </div>
            <div style={{ padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '24px', marginBottom: '10px' }}>🛡️</p>
              <p style={{ fontWeight: 'bold', color: '#667eea' }}>Insurance & benefits</p>
            </div>
            <div style={{ padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '24px', marginBottom: '10px' }}>🎓</p>
              <p style={{ fontWeight: 'bold', color: '#667eea' }}>Training & development</p>
            </div>
            <div style={{ padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '24px', marginBottom: '10px' }}>⭐</p>
              <p style={{ fontWeight: 'bold', color: '#667eea' }}>Professional recognition</p>
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px'
          }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>Registration Fee: ₹150 (One-time)</p>
            <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.9 }}>Verification required • Fast approval (30 mins)</p>
          </div>
          <Link to="/driver-registration" className="btn btn-primary btn-lg" style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            color: 'white',
            fontWeight: 'bold',
            padding: '16px 40px',
            fontSize: '18px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)',
            display: 'inline-block'
          }} onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 12px 28px rgba(22, 163, 74, 0.4)';
          }} onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 20px rgba(22, 163, 74, 0.3)';
          }}>
            🚗 Register as Driver Now
          </Link>
        </div>
      </section>

      {/* Support & Help */}
      <section className="section">
        <h2 className="section-title">Need Help?</h2>
        <div className="grid grid-2">
          <div className="card">
            <h3>📞 Call Support</h3>
            <p><a href="tel:+917836887228" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 'bold' }}>+91-7836887228</a></p>
            <p style={{ fontSize: '14px', color: '#666' }}>Available 24/7 for all your queries</p>
          </div>
          <div className="card">
            <h3>💬 WhatsApp Support</h3>
            <p><a href="https://wa.me/+917836887228" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 'bold' }}>Chat with us</a></p>
            <p style={{ fontSize: '14px', color: '#666' }}>Quick response time</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
