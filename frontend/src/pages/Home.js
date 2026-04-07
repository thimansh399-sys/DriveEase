import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { filterIndiaLocations } from '../utils/locationData';
import '../styles/Home.css';

function LocationInput({ value, onChange, onSelect, placeholder, icon }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const normalized = String(query || '').trim();
    if (normalized.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const fallback = filterIndiaLocations(normalized, 8).map((location) => ({
          label: location,
          lat: null,
          lng: null,
          source: 'fallback'
        }));

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&addressdetails=1&limit=8&q=${encodeURIComponent(normalized)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Unable to fetch live locations');
        }

        const data = await response.json();
        const live = (Array.isArray(data) ? data : []).map((item) => ({
          label: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon),
          source: 'live'
        }));

        const merged = [...live];
        fallback.forEach((entry) => {
          if (!merged.some((existing) => existing.label === entry.label)) {
            merged.push(entry);
          }
        });

        if (!mounted) return;
        setSuggestions(merged.slice(0, 8));
        setOpen(merged.length > 0);
      } catch (_) {
        if (!mounted || controller.signal.aborted) return;
        const fallback = filterIndiaLocations(normalized, 8).map((location) => ({
          label: location,
          lat: null,
          lng: null,
          source: 'fallback'
        }));
        setSuggestions(fallback);
        setOpen(fallback.length > 0);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 240);

    return () => {
      mounted = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (loc) => {
    setQuery(loc.label);
    onChange(loc.label);
    if (onSelect) {
      onSelect({ address: loc.label, lat: loc.lat, lng: loc.lng, source: loc.source });
    }
    setOpen(false);
  };

  return (
    <div className="home-location-wrap" ref={wrapRef}>
      <div className="home-input-group">
        <span className="home-input-icon">{icon}</span>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChange(next);
            if (onSelect) onSelect(null);
          }}
          className="home-location-input"
          onFocus={() => query.length >= 2 && setOpen(suggestions.length > 0)}
          autoComplete="off"
        />
        {query && (
          <button className="home-input-clear" onClick={() => {
            setQuery('');
            onChange('');
            if (onSelect) onSelect(null);
            setOpen(false);
          }}>
            ✕
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="home-suggestions"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {suggestions.map((loc) => (
              <li key={`${loc.label}-${loc.lat || 'na'}-${loc.lng || 'na'}`} onMouseDown={() => handleSelect(loc)}>
                <span className="home-suggestion-icon">📍</span> {loc.label}
              </li>
            ))}
            {loading && <li className="home-suggestion-loading">Searching exact locations...</li>}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupPlace, setPickupPlace] = useState(null);
  const [dropPlace, setDropPlace] = useState(null);
  const [inputError, setInputError] = useState('');
  const [rideMode, setRideMode] = useState('one_way');
  const [hourlyPackage, setHourlyPackage] = useState(4);
  const [outstationTripType, setOutstationTripType] = useState('one_way');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  const features = [
    { icon: '⚡', title: 'Fast Booking', desc: 'Book a verified driver in under 60 seconds.' },
    { icon: '💰', title: 'Affordable Price', desc: 'Transparent pricing with no hidden charges.' },
    { icon: '📍', title: 'Live Tracking', desc: 'Track your driver in real-time on the map.' },
    { icon: '🛡️', title: 'Safe Ride', desc: 'Background-verified, licensed professionals only.' },
  ];

  const steps = [
    { no: '01', title: 'Book a Driver', desc: 'Enter your pickup & drop location.' },
    { no: '02', title: 'Get Matched Instantly', desc: 'We assign the nearest available driver.' },
    { no: '03', title: 'Enjoy Safe Ride', desc: 'Sit back and track your ride live.' },
  ];

  const testimonials = [
    { text: 'Amazing service! The driver was on time and very professional.', name: 'Priya S.' },
    { text: 'Very safe drivers. I feel confident sending my parents alone.', name: 'Rahul M.' },
    { text: 'Best daily commute solution. Saved so much on monthly travel!', name: 'Ankit K.' },
  ];

  const plans = [
    { name: 'Daily', price: '₹499/day', desc: 'Perfect for one-off trips' },
    { name: 'Monthly', price: '₹12,999', desc: 'Best value for daily commuters' },
    { name: 'Corporate', price: 'Custom', desc: 'Tailored for businesses' },
  ];

  const isDestinationRequired = rideMode === 'one_way' || rideMode === 'outstation';
  const estimatedFareRange = (() => {
    if (rideMode === 'hourly') {
      if (hourlyPackage === 2) return '₹299 - ₹449';
      if (hourlyPackage === 8) return '₹899 - ₹1399';
      return '₹499 - ₹799';
    }

    if (rideMode === 'outstation') {
      return outstationTripType === 'round_trip' ? '₹1899 - ₹2999' : '₹999 - ₹1799';
    }

    return '₹120 - ₹180';
  })();

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote('Location is not supported in this browser.');
      return;
    }

    setDetectingLocation(true);
    setLocationNote('Detecting your current location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);
        setPickupPlace({ address: '', lat, lng, source: 'gps' });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
            {
              headers: {
                Accept: 'application/json'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Reverse lookup failed');
          }

          const data = await response.json();
          const address = data?.display_name || `Current Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          setPickup(address);
          setPickupPlace({ address, lat, lng, source: 'gps' });
          setLocationNote('Pickup set from your current location.');
          setInputError('');
        } catch (_) {
          const fallbackAddress = `Current Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          setPickup(fallbackAddress);
          setPickupPlace({ address: fallbackAddress, lat, lng, source: 'gps' });
          setLocationNote('Pickup set from GPS coordinates.');
          setInputError('');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        setLocationNote('Unable to detect location. Please allow GPS permission.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleBookRide = () => {
    if (!pickup.trim()) {
      setInputError('Please enter pickup location.');
      return;
    }

    if (isDestinationRequired && !drop.trim()) {
      setInputError('Please enter destination for this ride type.');
      return;
    }

    setInputError('');
    const normalizedRideType = rideMode === 'one_way' ? 'daily' : rideMode;
    const search = new URLSearchParams({ pickup, rideType: normalizedRideType });

    if (drop.trim()) {
      search.set('drop', drop.trim());
    }

    if (rideMode === 'outstation') {
      search.set('tripType', outstationTripType);
    }

    if (normalizedRideType === 'hourly') {
      search.set('totalHours', String(hourlyPackage));
    }

    if (Number.isFinite(Number(pickupPlace?.lat)) && Number.isFinite(Number(pickupPlace?.lng))) {
      search.set('pickupLat', String(pickupPlace.lat));
      search.set('pickupLng', String(pickupPlace.lng));
    }

    if (Number.isFinite(Number(dropPlace?.lat)) && Number.isFinite(Number(dropPlace?.lng))) {
      search.set('dropLat', String(dropPlace.lat));
      search.set('dropLng', String(dropPlace.lng));
    }

    const target = `/book-ride?${search.toString()}`;
    const hasToken = Boolean(localStorage.getItem('token'));

    if (hasToken) {
      navigate(target);
      return;
    }

    localStorage.setItem('pendingRideDraft', JSON.stringify({
      pickup,
      drop,
      pickupPlace,
      dropPlace,
      rideType: normalizedRideType,
      totalHours: normalizedRideType === 'hourly' ? hourlyPackage : undefined,
      tripType: normalizedRideType === 'outstation' ? outstationTripType : undefined,
    }));
    navigate('/login');
  };

  return (
    <div className="home-v2-page">
      {/* Background blobs */}
      <div className="home-v2-bg-blob home-v2-bg-blob-top" />
      <div className="home-v2-bg-blob home-v2-bg-blob-bottom" />

      {/* ── HERO SECTION ── */}
      <section className="home-v2-hero">
        {/* LEFT: Copy + Booking Inputs */}
        <motion.div
          className="home-v2-copy"
          initial={{ opacity: 0, y: 38 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <motion.div
            className="home-v2-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            India's #1 Trusted Personal Driver Service — Fast, Safe & Reliable
          </motion.div>

          <h1>
            Book Your Ride<br />
            <span>Instantly</span>
          </h1>

          <p>
            Verified drivers for your daily commute, family trips, and business travel.
          </p>

          {/* Booking Input Card */}
          <motion.div
            className="home-booking-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
          >
            <div className="home-ride-mode-row">
              <button
                type="button"
                className={`home-ride-mode-btn ${rideMode === 'one_way' ? 'active' : ''}`}
                onClick={() => setRideMode('one_way')}
              >
                One-way Ride
              </button>
              <button
                type="button"
                className={`home-ride-mode-btn ${rideMode === 'hourly' ? 'active' : ''}`}
                onClick={() => {
                  setRideMode('hourly');
                  setDrop('');
                  setDropPlace(null);
                }}
              >
                Hire Driver (2h/4h)
              </button>
              <button
                type="button"
                className={`home-ride-mode-btn ${rideMode === 'outstation' ? 'active' : ''}`}
                onClick={() => setRideMode('outstation')}
              >
                Outstation Trip
              </button>
            </div>

            {rideMode === 'hourly' && (
              <div className="home-hourly-package-row">
                <button
                  type="button"
                  className={`home-hourly-package-btn ${hourlyPackage === 2 ? 'active' : ''}`}
                  onClick={() => setHourlyPackage(2)}
                >
                  2 Hours
                </button>
                <button
                  type="button"
                  className={`home-hourly-package-btn ${hourlyPackage === 4 ? 'active' : ''}`}
                  onClick={() => setHourlyPackage(4)}
                >
                  4 Hours
                </button>
                <button
                  type="button"
                  className={`home-hourly-package-btn ${hourlyPackage === 8 ? 'active' : ''}`}
                  onClick={() => setHourlyPackage(8)}
                >
                  8 Hours
                </button>
              </div>
            )}

            {rideMode === 'outstation' && (
              <div className="home-hourly-package-row">
                <button
                  type="button"
                  className={`home-hourly-package-btn ${outstationTripType === 'one_way' ? 'active' : ''}`}
                  onClick={() => setOutstationTripType('one_way')}
                >
                  One-way
                </button>
                <button
                  type="button"
                  className={`home-hourly-package-btn ${outstationTripType === 'round_trip' ? 'active' : ''}`}
                  onClick={() => setOutstationTripType('round_trip')}
                >
                  Round trip
                </button>
              </div>
            )}

            <LocationInput
              value={pickup}
              onChange={(v) => { setPickup(v); setInputError(''); }}
              onSelect={setPickupPlace}
              placeholder="Pickup Location"
              icon="🟢"
            />
            {rideMode !== 'hourly' && (
              <>
                <div className="home-input-divider" />
                <LocationInput
                  value={drop}
                  onChange={(v) => { setDrop(v); setInputError(''); }}
                  onSelect={setDropPlace}
                  placeholder="Destination"
                  icon="🔴"
                />
              </>
            )}

            <button
              type="button"
              className="home-current-location-btn"
              onClick={useCurrentLocation}
              disabled={detectingLocation}
            >
              {detectingLocation ? 'Detecting GPS...' : '📍 Use Current Location'}
            </button>
            {locationNote ? <p className="home-optional-hint">{locationNote}</p> : null}

            <div className="home-availability-hint">⚡ 3 drivers available near you</div>
            <div className="home-fare-preview">Estimated Fare: {estimatedFareRange}</div>

            <AnimatePresence>
              {inputError && (
                <motion.p
                  className="home-input-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  ⚠️ {inputError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              className="home-book-btn"
              onClick={handleBookRide}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Find Drivers
            </motion.button>

          </motion.div>

          <div className="home-v2-quick-points">
            <span>✔ Verified Drivers</span>
            <span>✔ 24/7 Support</span>
            <span>✔ Instant Booking</span>
          </div>

          <div className="home-v2-stats">
            {['⭐ 4.8 Rating', '🚗 5000+ Drivers', '👥 10k+ Customers'].map((item) => (
              <div key={item} className="home-v2-stat-card">{item}</div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT: Car Image */}
        <motion.div
          className="home-v2-media"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <img
            src="https://gsiglobe.com/assets/img/personal-driver.jpg"
            alt="DriveEase Driver"
          />
          <div className="home-v2-media-glow" />

          {/* floating ETA card */}
          <motion.div
            className="home-eta-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <span className="home-eta-dot" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Driver En Route</div>
                <div style={{ color: '#22c55e', fontSize: '12px' }}>ETA: 30 mins</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <div className="home-v2-divider" />

      {/* ── FEATURES SECTION ── */}
      <section className="home-v2-section">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Why Choose DriveEase
        </motion.h2>
        <div className="home-v2-feature-grid">
          {features.map((item, idx) => (
            <motion.div
              key={item.title}
              className="home-v2-feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <div className="home-feature-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="home-v2-divider" />

      {/* ── HOW IT WORKS ── */}
      <section className="home-v2-section">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          How It Works
        </motion.h2>
        <div className="home-v2-step-grid">
          {steps.map((step, index) => (
            <motion.div
              key={step.no}
              className="home-v2-step-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.4 }}
            >
              <div className="home-v2-step-no">{step.no}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="home-v2-divider" />

      {/* ── MAP PREVIEW SECTION ── */}
      <section className="home-v2-section">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Live Route Tracking
        </motion.h2>
        <motion.div
          className="home-map-preview"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="home-map-bg">
            {/* Simulated map grid */}
            <svg width="100%" height="100%" viewBox="0 0 600 280" preserveAspectRatio="xMidYMid slice">
              {/* grid lines */}
              {[0,60,120,180,240].map(y => (
                <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              ))}
              {[0,75,150,225,300,375,450,525,600].map(x => (
                <line key={`v${x}`} x1={x} y1="0" x2={x} y2="280" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              ))}
              {/* Route dashed line */}
              <path d="M 80 200 Q 200 80 400 100 L 520 80" stroke="#22c55e" strokeWidth="3" fill="none" strokeDasharray="10 6" />
              {/* Traveled path */}
              <path d="M 80 200 Q 200 80 280 90" stroke="#4ade80" strokeWidth="4" fill="none" />
              {/* Pickup marker */}
              <circle cx="80" cy="200" r="10" fill="#22c55e" />
              <text x="96" y="204" fill="#fff" fontSize="12" fontWeight="bold">Pickup</text>
              {/* Dropoff marker */}
              <circle cx="520" cy="80" r="10" fill="#93c5fd" />
              <text x="532" y="84" fill="#fff" fontSize="12" fontWeight="bold">Drop</text>
              {/* Driver marker */}
              <circle cx="280" cy="90" r="14" fill="#f97316" opacity="0.9"/>
              <text x="272" y="95" fill="#fff" fontSize="14">🚗</text>
            </svg>

            <div className="home-map-overlay">
              <div className="home-map-eta">
                <span className="home-eta-pulse" />
                Driver 30 mins away · 2.3 km remaining
              </div>
            </div>
          </div>

          <div className="home-map-info-row">
            <div className="home-map-info-card" style={{ borderColor: '#22c55e' }}>
              <div style={{ color: '#22c55e', fontSize: '20px' }}>📍</div>
              <div>
                <div style={{ fontWeight: 700 }}>ETA</div>
                <div style={{ color: '#22c55e' }}>30 mins</div>
              </div>
            </div>
            <div className="home-map-info-card" style={{ borderColor: '#93c5fd' }}>
              <div style={{ fontSize: '20px' }}>🗺️</div>
              <div>
                <div style={{ fontWeight: 700 }}>Distance</div>
                <div style={{ color: '#93c5fd' }}>12.5 km</div>
              </div>
            </div>
            <div className="home-map-info-card" style={{ borderColor: '#fbbf24' }}>
              <div style={{ fontSize: '20px' }}>💰</div>
              <div>
                <div style={{ fontWeight: 700 }}>Fare</div>
                <div style={{ color: '#fbbf24' }}>₹285</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="home-v2-divider" />

      {/* ── TESTIMONIALS ── */}
      <section className="home-v2-section">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          What Our Users Say
        </motion.h2>
        <div className="home-v2-testimonial-grid">
          {testimonials.map((item, idx) => (
            <motion.div
              key={item.name}
              className="home-v2-testimonial-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <div className="home-v2-stars">★★★★★</div>
              <p>"{item.text}"</p>
              <div className="home-testimonial-name">— {item.name}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="home-v2-divider" />

      {/* ── PLANS ── */}
      <section className="home-v2-section home-v2-plans">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Plans for Everyone
        </motion.h2>
        <div className="home-v2-plan-grid">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              className="home-v2-plan-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <h3>{plan.name}</h3>
              <p className="home-plan-price">{plan.price}</p>
              <p className="home-plan-desc">{plan.desc}</p>
              <Link to="/subscriptions" className="home-v2-btn home-v2-btn-primary home-v2-plan-action">
                Choose Plan
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="home-v2-divider" />

      {/* ── CTA BANNER ── */}
      <motion.section
        className="home-cta-banner"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2>Ready to Ride?</h2>
        <p>Join 10,000+ happy customers who trust DriveEase every day.</p>
        <div className="home-cta-actions">
          <Link to="/book-ride" className="home-cta-link">
            <motion.button
              className="home-book-btn home-cta-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started →
            </motion.button>
          </Link>
          <Link to="/drivers" className="home-cta-link">
            <motion.button
              className="home-v2-btn home-v2-btn-outline home-cta-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Drivers
            </motion.button>
          </Link>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}

export default Home;
