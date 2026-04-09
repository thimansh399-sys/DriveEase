import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { filterIndiaLocations } from '../utils/locationData';
import '../styles/Home.css';

const CARS_PROMO_VERSION = 'cars-promo-v2';

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
    // --- Add missing plans array ---
    const plans = [
      { name: 'Basic', price: '₹299/day', desc: 'For short city rides and errands.' },
      { name: 'Family', price: '₹999/week', desc: 'Perfect for families and regular commutes.' },
      { name: 'Business', price: '₹3499/month', desc: 'For business professionals and frequent travelers.' }
    ];

    // --- Add missing handleBookRide function ---
    function handleBookRide() {
      if (!pickup || (rideMode !== 'hourly' && !drop)) {
        setInputError('Please enter all required locations.');
        return;
      }
      // Example navigation logic (customize as needed)
      navigate('/book-ride', {
        state: {
          pickup,
          drop,
          rideMode,
          pickupPlace,
          dropPlace
        }
      });
    }

    // --- Add missing useCurrentLocation function ---
    function useCurrentLocation() {
      setDetectingLocation(true);
      if (!navigator.geolocation) {
        setLocationNote('Geolocation is not supported by your browser.');
        setDetectingLocation(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickup(`Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
          setLocationNote('Location detected!');
          setDetectingLocation(false);
        },
        (error) => {
          setLocationNote('Unable to detect location. Please enter manually.');
          setDetectingLocation(false);
        }
      );
    }
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupPlace, setPickupPlace] = useState(null);
  const [dropPlace, setDropPlace] = useState(null);
  const [inputError, setInputError] = useState('');
  const [rideMode, setRideMode] = useState('one_way');
  const [hourlyPackage] = useState(4);
  const [outstationTripType] = useState('one_way');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationNote, setLocationNote] = useState('');
  const [showCarsPromo, setShowCarsPromo] = useState(false);

  useEffect(() => {
    const seenVersion = localStorage.getItem('carsPromoSeenVersion') || '';
    if (seenVersion !== CARS_PROMO_VERSION) {
      setShowCarsPromo(true);
    }
  }, []);

  const closeCarsPromo = () => {
    setShowCarsPromo(false);
    localStorage.setItem('carsPromoSeenVersion', CARS_PROMO_VERSION);
  };

  return (
    <>
      <div className="home-v2-page">
        {/* Minimal Hero Section */}
        <section className="home-v2-hero minimal-hero">
          <div className="home-v2-copy">
            <div className="home-v2-badge">India's #1 Trusted Personal Driver Service</div>
            <h1>Book Your Ride Instantly</h1>
            <p>Verified drivers for daily commute, family trips, and business travel.</p>
            {/* Trust badge */}
            <div className="home-v2-trust-badge">✔ 24/7 Support · ✔ Verified Drivers · ✔ Instant Booking</div>
            {/* Booking Form */}
            <div className="home-booking-card minimal">
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
              <button
                type="button"
                className="home-current-location-btn"
                onClick={useCurrentLocation}
                disabled={detectingLocation}
                style={{ marginTop: 12 }}
              >
                {detectingLocation ? 'Detecting GPS...' : '📍 Use current location'}
              </button>
              {locationNote ? <p className="home-optional-hint">{locationNote}</p> : null}
            </div>
          </div>
          {/* Subtle background image or color can be handled in CSS */}
          <div className="home-v2-media minimal-bg" />
        </section>

        {/* Below the fold: all secondary content */}
        <div className="home-v2-divider" />

        {/* ── PLANS ── */}
        <section className="home-v2-section home-v2-plans">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
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
    </>
  );


}

export default Home;
