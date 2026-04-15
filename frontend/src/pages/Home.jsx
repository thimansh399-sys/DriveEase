import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const [rideType, setRideType] = useState('oneway');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  const isHourly = rideType === 'hourly';
  const isOutstation = rideType === 'outstation';

  const services = [
    { icon: '🚗', title: 'One Way Ride', desc: 'Airport transfers, city rides, quick trips' },
    { icon: '⏰', title: 'Hourly Driver', desc: '2-8 hrs personal driver with your car' },
    { icon: '🛣️', title: 'Outstation', desc: 'Long distance with verified drivers' },
    { icon: '⭐', title: 'Premium Service', desc: 'Top-rated drivers + insurance included' },
    { icon: '👨‍💼', title: 'Corporate', desc: 'Monthly packages for businesses' },
    { icon: '🚙', title: 'Car + Driver', desc: 'Full taxi service with clean cars' }
  ];

  return (
    <div className="homepage">
      {/* Hero */}
      <header className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Book Your <span className="accent">Personal Driver</span>
          </h1>
          <p className="hero-subtitle">Fast, safe & affordable rides in seconds</p>
          <div className="hero-buttons">
            <Link to="/book-ride" className="btn btn-primary">Book Now</Link>
            <Link to="/plans" className="btn btn-secondary">View Plans</Link>
          </div>
        </div>
        <div className="hero-booking-card">
          <div className="booking-tabs">
            <button 
              className={`tab ${rideType === 'oneway' ? 'active' : ''}`}
              onClick={() => setRideType('oneway')}
            >
              One Way
            </button>
            <button 
              className={`tab ${rideType === 'hourly' ? 'active' : ''}`}
              onClick={() => setRideType('hourly')}
            >
              Hourly
            </button>
            <button 
              className={`tab ${rideType === 'outstation' ? 'active' : ''}`}
              onClick={() => setRideType('outstation')}
            >
              Outstation
            </button>
          </div>
          <div className="booking-inputs">
            <input 
              className="input" 
              placeholder="Pickup location" 
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
            {(isHourly || isOutstation) && (
              <input 
                className="input" 
                placeholder="Drop location" 
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
              />
            )}
            <button className="btn btn-primary full">Find Driver</button>
          </div>
        </div>
      </header>

      {/* Live Drivers */}
      <section className="live-drivers">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Live Drivers Nearby</h2>
            <p>500+ verified drivers online now</p>
          </div>
          <div className="live-grid">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="live-card">
                <div className="live-avatar">JD</div>
                <div>
                  <h4>John Doe</h4>
                  <p>4.9 ⭐ • 2km away • Online</p>
                </div>
                <div className="live-status online"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Customers</div>
            </div>
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Drivers</div>
            </div>
            <div className="stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
            <div className="stat">
              <div className="stat-number">50+</div>
              <div className="stat-label">Cities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="services">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Services</h2>
            <p>Choose the perfect ride for your journey</p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Drivers Say</h2>
            <p>Real reviews from real customers</p>
          </div>
          <div className="testimonials-grid">
            {[
              { quote: 'Best driver app! Quick booking & verified drivers.', name: 'Priya S.', rating: 5 },
              { quote: 'Used for 50+ trips. Always reliable.', name: 'Rahul K.', rating: 5 },
              { quote: 'Hourly driver saved my day!', name: 'Anita M.', rating: 5 }
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="stars">{'★'.repeat(testimonial.rating)}</div>
                <p>"{testimonial.quote}"</p>
                <div className="testimonial-author">— {testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Ride?</h2>
          <p>Join 10K+ happy customers</p>
          <Link to="/book-ride" className="btn btn-primary btn-large">Get Started</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 DriveEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

