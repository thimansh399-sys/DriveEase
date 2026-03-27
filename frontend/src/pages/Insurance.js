import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/Insurance.css';

function Insurance() {
  const [activeRide, setActiveRide] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addingDriver, setAddingDriver] = useState(false);
  const [success, setSuccess] = useState(null);
  const [driverSuccess, setDriverSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('passenger');
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchActiveRide();
  }, [token]);

  const fetchActiveRide = async () => {
    try {
      const res = await api.getActiveRide();
      if (res.success && res.booking) {
        setActiveRide(res.booking);
        const sugRes = await api.suggestInsurance(res.booking._id || res.booking.id);
        if (sugRes) setSuggestion(sugRes);
      }
    } catch (err) {
      console.error('Error fetching active ride:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInsurance = async () => {
    if (!activeRide) return;
    setAdding(true); setError(null);
    try {
      const res = await api.addInsurance(activeRide._id || activeRide.id);
      if (res.success) {
        setSuccess(res);
        setActiveRide(prev => ({ ...prev, insuranceOpted: true }));
      } else {
        setError(res.error || 'Failed to add insurance');
      }
    } catch (err) { setError('Network error. Please try again.'); }
    finally { setAdding(false); }
  };

  const handleAddDriverInsurance = async () => {
    if (!activeRide) return;
    setAddingDriver(true); setError(null);
    try {
      const res = await api.addDriverInsurance(activeRide._id || activeRide.id);
      if (res.success) {
        setDriverSuccess(res);
        setActiveRide(prev => ({ ...prev, driverInsuranceOpted: true }));
      } else {
        setError(res.error || 'Failed to add driver insurance');
      }
    } catch (err) { setError('Network error. Please try again.'); }
    finally { setAddingDriver(false); }
  };

  const passengerCoverage = [
    { icon: '🛡️', title: '₹5 Lakh Accident Cover', desc: 'Full accidental damage cover for passenger & co-passengers' },
    { icon: '🏥', title: 'Medical Emergency', desc: 'Up to ₹1 lakh medical expenses covered instantly' },
    { icon: '🚑', title: 'Free Ambulance', desc: 'Ambulance dispatch within minutes — zero cost' },
    { icon: '⚖️', title: 'Third-Party Liability', desc: 'Legal & financial protection against third-party claims' },
    { icon: '📞', title: '24/7 Helpline', desc: 'One-call emergency assistance, anytime anywhere' },
    { icon: '⚡', title: 'Instant Claim', desc: 'File claims in-app — settlement within 48 hours' },
  ];

  const driverCoverage = [
    { icon: '🚗', title: '₹3 Lakh Driver Cover', desc: 'Accidental cover for driver during the ride' },
    { icon: '🔧', title: 'Vehicle Damage', desc: 'Covers repair cost for ride-related vehicle damage' },
    { icon: '🏥', title: '₹50K Medical', desc: 'Up to ₹50,000 medical expenses for the driver' },
    { icon: '🚛', title: 'Towing Assist', desc: 'Free towing up to 25 km in case of breakdown' },
  ];

  const insurancePrice = suggestion?.insuranceCost || 29;
  const driverInsurancePrice = suggestion?.driverInsurance?.cost || 29;

  return (
    <div className="insurance-page">
      {/* HERO */}
      <div className="insurance-hero">
        <div className="insurance-hero-badge">RIDE PROTECTION</div>
        <h1 className="insurance-title">
          <span className="ins-price-big">₹5 Lakh</span> Accidental Cover
        </h1>
        <p className="insurance-hero-tagline">Only <span className="ins-green-glow">₹29–₹49</span> per ride</p>
        <p className="insurance-subtitle">
          Smart pricing based on distance & ride type. The safest way to ride.
        </p>
        <div className="insurance-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">₹5L</span>
            <span className="hero-stat-label">Passenger Cover</span>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat">
            <span className="hero-stat-value">₹3L</span>
            <span className="hero-stat-label">Driver Cover</span>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat">
            <span className="hero-stat-value">₹29</span>
            <span className="hero-stat-label">Starting At</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="insurance-tabs">
        <button className={`ins-tab ${tab === 'passenger' ? 'active' : ''}`} onClick={() => setTab('passenger')}>
          🛡️ Passenger Insurance
        </button>
        <button className={`ins-tab ${tab === 'driver' ? 'active' : ''}`} onClick={() => setTab('driver')}>
          🚗 Driver Insurance
        </button>
      </div>

      {/* ACTIVE RIDE — SMART SUGGESTION */}
      {token && (
        <div className="insurance-active-section">
          {loading ? (
            <div className="insurance-loading">
              <div className="insurance-spinner"></div>
              <p>Checking active rides...</p>
            </div>
          ) : activeRide ? (
            <div className="insurance-active-card">
              <div className="insurance-active-header">
                <span className="insurance-active-icon">🚗</span>
                <div>
                  <h3>Active Ride Detected</h3>
                  <p>Booking #{activeRide.bookingId}</p>
                </div>
                {suggestion?.score > 0 && (
                  <div className="smart-score-badge">
                    Smart Score: {suggestion.score}
                  </div>
                )}
              </div>

              {/* PASSENGER INSURANCE */}
              {tab === 'passenger' && (
                <>
                  {!activeRide.insuranceOpted && !success ? (
                    <>
                      {suggestion?.suggest && (
                        <div className="insurance-suggestion-box">
                          <span className="suggestion-icon">💡</span>
                          <div>
                            <strong>{suggestion.message || `₹5 lakh accidental cover only ₹${insurancePrice}`}</strong>
                            {suggestion.reasons?.map((r, i) => (
                              <p key={i} className="suggestion-reason">{r}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="insurance-add-section">
                        <div className="insurance-add-price">
                          <span className="price-amount">₹{insurancePrice}</span>
                          <span className="price-label">per ride • ₹5 lakh cover</span>
                        </div>
                        <button className="insurance-add-btn" onClick={handleAddInsurance} disabled={adding}>
                          {adding ? 'Adding...' : '🛡️ Add ₹5L Cover'}
                        </button>
                      </div>
                    </>
                  ) : success ? (
                    <div className="insurance-inline-success">
                      <span>✅</span>
                      <div>
                        <strong>{success.message}</strong>
                        <p>Cover: {success.insurance?.coverAmount}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="insurance-inline-success">
                      <span>🛡️</span>
                      <div>
                        <strong>Passenger Insurance Active</strong>
                        <p>₹5 lakh accidental cover — you're protected!</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* DRIVER INSURANCE */}
              {tab === 'driver' && (
                <>
                  {!activeRide.driverInsuranceOpted && !driverSuccess ? (
                    <>
                      {suggestion?.driverInsurance?.suggest && (
                        <div className="insurance-suggestion-box driver-suggest">
                          <span className="suggestion-icon">🚗</span>
                          <div>
                            <strong>₹3 lakh driver cover — only ₹{driverInsurancePrice}/ride</strong>
                            {suggestion.driverInsurance.reasons?.map((r, i) => (
                              <p key={i} className="suggestion-reason">{r}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="insurance-add-section">
                        <div className="insurance-add-price">
                          <span className="price-amount">₹{driverInsurancePrice}</span>
                          <span className="price-label">per ride • ₹3 lakh cover</span>
                        </div>
                        <button className="insurance-add-btn driver-btn" onClick={handleAddDriverInsurance} disabled={addingDriver || userRole !== 'driver'}>
                          {addingDriver ? 'Adding...' : userRole === 'driver' ? '🚗 Add Driver Cover' : 'Login as Driver'}
                        </button>
                      </div>
                    </>
                  ) : driverSuccess ? (
                    <div className="insurance-inline-success">
                      <span>✅</span>
                      <div>
                        <strong>{driverSuccess.message}</strong>
                        <p>Cover: {driverSuccess.insurance?.coverAmount}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="insurance-inline-success">
                      <span>🚗</span>
                      <div>
                        <strong>Driver Insurance Active</strong>
                        <p>₹3 lakh cover + towing + vehicle damage — protected!</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && <div className="insurance-error">{error}</div>}
            </div>
          ) : (
            <div className="insurance-no-ride">
              <span className="no-ride-icon">📋</span>
              <p>No active ride. Insurance can be added once you book a ride.</p>
            </div>
          )}
        </div>
      )}

      {/* PRICING CARDS */}
      <div className="insurance-pricing-section">
        <h2 className="section-heading">Smart <span>Pricing</span></h2>
        <p className="section-sub">Price adjusts automatically based on ride distance, time & type</p>
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="pricing-card-badge">SHORT RIDE</div>
            <div className="pricing-card-price">₹29</div>
            <p>Up to 10 km</p>
            <span className="pricing-cover">₹5L cover</span>
          </div>
          <div className="pricing-card highlight">
            <div className="pricing-card-badge">BEST VALUE</div>
            <div className="pricing-card-price">₹35–₹39</div>
            <p>10–50 km / Night rides</p>
            <span className="pricing-cover">₹5L cover</span>
          </div>
          <div className="pricing-card">
            <div className="pricing-card-badge">OUTSTATION</div>
            <div className="pricing-card-price">₹45–₹49</div>
            <p>50+ km / Premium rides</p>
            <span className="pricing-cover">₹5L cover</span>
          </div>
          <div className="pricing-card driver-card">
            <div className="pricing-card-badge">DRIVER</div>
            <div className="pricing-card-price">₹29</div>
            <p>All rides — flat rate</p>
            <span className="pricing-cover">₹3L cover</span>
          </div>
        </div>
      </div>

      {/* COVERAGE GRID */}
      <div className="insurance-coverage-section">
        <h2 className="section-heading">
          {tab === 'passenger' ? 'Passenger' : 'Driver'} <span>Coverage</span>
        </h2>
        <div className="coverage-grid">
          {(tab === 'passenger' ? passengerCoverage : driverCoverage).map((item, i) => (
            <div key={i} className="coverage-card">
              <span className="coverage-card-icon">{item.icon}</span>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="insurance-how-section">
        <h2 className="section-heading">How It <span>Works</span></h2>
        <div className="how-steps">
          <div className="how-step">
            <div className="step-number">1</div>
            <h4>Book a Ride</h4>
            <p>Book your ride as usual through DriveEase</p>
          </div>
          <div className="how-step-arrow">→</div>
          <div className="how-step">
            <div className="step-number">2</div>
            <h4>Smart Suggestion</h4>
            <p>We analyze time, distance & route to suggest the best cover</p>
          </div>
          <div className="how-step-arrow">→</div>
          <div className="how-step">
            <div className="step-number">3</div>
            <h4>₹5L Cover Active</h4>
            <p>One tap — ₹29 to ₹49. Instant protection.</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="insurance-faq-section">
        <h2 className="section-heading">Frequently <span>Asked</span></h2>
        <div className="faq-grid">
          <div className="faq-card">
            <h4>₹5 lakh accidental cover only ₹49?</h4>
            <p>Yes! Starting from ₹29 for short rides, up to ₹49 for outstation — covers accident damage, medical & more.</p>
          </div>
          <div className="faq-card">
            <h4>Why does price change?</h4>
            <p>Smart pricing — short city rides are ₹29, night/long-distance go up to ₹49. Always fair.</p>
          </div>
          <div className="faq-card">
            <h4>Is there driver insurance too?</h4>
            <p>Yes! Drivers get ₹3 lakh cover + vehicle damage + towing at flat ₹29/ride.</p>
          </div>
          <div className="faq-card">
            <h4>How do I claim?</h4>
            <p>In-app claim filing or call our 24/7 helpline. Settlement within 48 hours.</p>
          </div>
        </div>
      </div>

      {/* HELPLINE */}
      <div className="insurance-helpline">
        <span className="helpline-icon">📞</span>
        <div>
          <strong>Emergency Helpline</strong>
          <a href="tel:+917836887228">+91-7836887228</a>
        </div>
      </div>
    </div>
  );
}

export default Insurance;
