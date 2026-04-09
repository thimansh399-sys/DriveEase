import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [inputError, setInputError] = useState('');
  const [rideMode, setRideMode] = useState('one_way');
  const [detectingLocation] = useState(false);
  const [locationNote] = useState('');

  // Removed unused useEffect and closeCarsPromo

  return (
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
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Find Drivers
            </motion.button>
            <button
              type="button"
              className="home-current-location-btn"
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
      {/* Trust metrics, Why choose us, How it works, Testimonials, Plans, CTA, etc. can be placed here as needed, but are now below the fold. */}
      <Footer />
    </div>
  );
// ...existing code...
}

export default Home;
