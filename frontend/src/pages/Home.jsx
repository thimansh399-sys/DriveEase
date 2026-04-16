import React, { useState } from "react";
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [activeTab, setActiveTab] = useState('oneway');
  
  const handleFindDrivers = () => {
    console.log('Find Drivers:', { activeTab, pickup, destination });
  };

  const handleTryNow = () => {
    console.log('Try Now clicked!');
  };

  return (
    <div className="home">

      {/* HERO - Preserved */}
      <section className="hero">
        <div className="hero-left">
          <h1>Book Your Ride Instantly</h1>
          <p>Verified drivers for daily commute, family trips & business travel.</p>

          {/* Preserved Booking Card */}
          <div className="card">
            <div className="tab-buttons">
              <button 
                className={`tab-btn ${activeTab === 'oneway' ? 'active' : ''}`} 
                onClick={() => setActiveTab('oneway')}
              >
                One-way Ride
              </button>
              <button 
                className={`tab-btn ${activeTab === 'hire' ? 'active' : ''}`} 
                onClick={() => setActiveTab('hire')}
              >
                Hire Driver (2h/4h)
              </button>
              <button 
                className={`tab-btn ${activeTab === 'outstation' ? 'active' : ''}`} 
                onClick={() => setActiveTab('outstation')}
              >
                Outstation Trip
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Pickup Location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            
            <button className="btn full" onClick={handleFindDrivers}>
              Find Drivers
            </button>

            <div className="feature-alert">
              <span>🚖 Car + Driver now available</span>
              <button className="try-now-btn" onClick={handleTryNow}>Try Now</button>
            </div>
          </div>

          <div className="trust-badges">
            <span>⭐ 4.9 Rating</span>
            <span>✔ Verified</span>
            <span>🕒 24x7</span>
          </div>
        </div>

        <div className="hero-right">
          <img src="/hero-driver.png" alt="Professional driver" />
        </div>
      </section>

      {/* STATS
      <section className="stats">
        <div>
          <h2>4.9</h2>
          <p>Rating</p>
        </div>
        <div>
          <h2>10K+</h2>
          <p>Rides</p>
        </div>
        <div>
          <h2>24x7</h2>
          <p>Support</p>
        </div>
      </section> */}

      {/* SERVICES */}
      <section className="section">
        <h2>Our Services</h2>

        <div className="grid-3">
          <div className="box">
            Driver Only
            <button className="btn full">Book Now</button>
          </div>
          <div className="box">
            Driver + Car
            <button className="btn full">Book Now</button>
          </div>
          <div className="box">
            Outstation
            <button className="btn full">Book Now</button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section center">
        <h2>How It Works</h2>
        <div className="grid-3">
          <div className="box">
            <h3>1. Enter Location</h3>
          </div>
          <div className="box">
            <h3>2. Choose Driver</h3>
          </div>
          <div className="box">
            <h3>3. Ride Safely</h3>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section">
        <h2>Pricing</h2>

        <div className="grid-4">
          <div className="box">
            <h3>Mini</h3>
            <p>₹9/km</p>
            <button className="btn full">Book</button>
          </div>

          <div className="box">
            <h3>Prime</h3>
            <p>₹11/km</p>
            <button className="btn full">Book</button>
          </div>

          <div className="box">
            <h3>Play</h3>
            <p>₹10/km</p>
            <button className="btn full">Book</button>
          </div>

          <div className="box">
            <h3>Lux</h3>
            <p>₹15/km</p>
            <button className="btn full">Book</button>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="section center">
        <h2>What Users Say</h2>
        <div className="grid-2">
          <div className="box">
            <p>"Amazing service, very reliable!"</p>
            <h4>- Rahul</h4>
          </div>
          <div className="box">
            <p>"Best driver booking experience!"</p>
            <h4>- Priya</h4>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section center">
        <h2>Book Your Ride Now</h2>
        <button className="btn big">Get Started</button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        © 2026 DriveEase. All rights reserved.
      </footer>

    </div>
  );
};

export default Home;

