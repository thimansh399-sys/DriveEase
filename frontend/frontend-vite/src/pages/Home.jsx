import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer.jsx';
import { filterIndiaLocations } from '../utils/locationData';


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
  const plans = [
    { name: 'Basic', price: '₹299/day', desc: 'For short city rides and errands.' },
    { name: 'Family', price: '₹999/week', desc: 'Perfect for families and regular commutes.' },
    { name: 'Business', price: '₹3499/month', desc: 'For business professionals and frequent travelers.' }
  ];

  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupPlace, setPickupPlace] = useState(null);
  const [dropPlace, setDropPlace] = useState(null);
  const [inputError, setInputError] = useState('');
  const [rideMode, setRideMode] = useState('one_way');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  function handleBookRide() {
    if (!pickup || (rideMode !== 'hourly' && !drop)) {
      setInputError('Please enter all required locations.');
      return;
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0f172a] text-white flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 px-4 md:px-12 py-16 md:py-24 w-full max-w-7xl mx-auto">
        {/* Left: Text and Booking */}
        <div className="flex-1 min-w-0 max-w-xl flex flex-col gap-8">
          <div className="mb-4">
            <div className="bg-green-600/15 text-green-400 font-bold text-base md:text-lg px-6 py-2 rounded-full inline-block mb-4 tracking-wide">
              India's #1 Trusted Personal Driver Service — Fast, Safe & Reliable
            </div>
            <h1 className="font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight font-outfit">
              Book Your Ride <span className="text-green-400">Instantly</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl mt-4">Verified drivers for your daily commute, family trips, and business travel.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center mb-2 font-semibold text-base md:text-lg text-green-300">
            <span className="flex items-center gap-1">✔ <span>24/7 Support</span></span>
            <span className="flex items-center gap-1">✔ <span>Verified Drivers</span></span>
            <span className="flex items-center gap-1">✔ <span>Instant Booking</span></span>
          </div>
          {/* Booking Card */}
          <div className="bg-[#151f2e]/80 rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-lg flex flex-col gap-4 border border-slate-800">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-150 border ${rideMode === 'one_way' ? 'bg-green-500 text-white shadow border-green-600' : 'bg-transparent text-green-300 border-slate-700 hover:bg-slate-800/60'}`}
                onClick={() => setRideMode('one_way')}
              >
                One-way Ride
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-150 border ${rideMode === 'hourly' ? 'bg-green-500 text-white shadow border-green-600' : 'bg-transparent text-green-300 border-slate-700 hover:bg-slate-800/60'}`}
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
                className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-150 border ${rideMode === 'outstation' ? 'bg-green-500 text-white shadow border-green-600' : 'bg-transparent text-green-300 border-slate-700 hover:bg-slate-800/60'}`}
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
              icon={<span className="text-green-400">●</span>}
            />
            {rideMode !== 'hourly' && (
              <>
                <div className="h-2" />
                <LocationInput
                  value={drop}
                  onChange={(v) => { setDrop(v); setInputError(''); }}
                  onSelect={setDropPlace}
                  placeholder="Destination"
                  icon={<span className="text-rose-400">●</span>}
                />
              </>
            )}
            <AnimatePresence>
              {inputError && (
                <motion.p
                  className="text-rose-400 font-medium text-base mt-2"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  ⚠️ {inputError}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button
              className="w-full mt-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-lg transition-all duration-150"
              onClick={handleBookRide}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Find Drivers
            </motion.button>
            <button
              type="button"
              className="w-full mt-1 py-2 rounded-xl border border-green-400 text-green-300 bg-transparent hover:bg-slate-800/60 font-semibold transition-all duration-150"
              onClick={useCurrentLocation}
              disabled={detectingLocation}
            >
              {detectingLocation ? 'Detecting GPS...' : '📍 Use current location'}
            </button>
            {locationNote ? <p className="text-xs text-slate-400 mt-1">{locationNote}</p> : null}
          </div>
        </div>
        {/* Right: Hero Image */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <img
            src={import.meta.env.BASE_URL + 'hero-driver.jpg'}
            alt="Professional driver opening car door"
            className="w-11/12 max-w-lg rounded-3xl shadow-2xl shadow-green-500/10 border-2 border-green-900/20"
          />
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-0.5 bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-500/10 my-12" />

      {/* Plans Section */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-0 py-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-extrabold text-center mb-10 text-green-300 font-outfit"
        >
          Our Plans
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              className="bg-[#151f2e] rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-slate-800 hover:shadow-green-500/10 transition-shadow duration-200"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              whileHover={{ y: -6, scale: 1.03 }}
            >
              <h3 className="text-2xl font-bold mb-2 text-green-400">{plan.name}</h3>
              <p className="text-3xl font-extrabold mb-2 text-white">{plan.price}</p>
              <p className="text-slate-300 mb-6">{plan.desc}</p>
              <Link to="/subscriptions" className="w-full">
                <button className="w-full py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow transition-all duration-150">
                  Choose Plan
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-0.5 bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-500/10 my-12" />

      {/* CTA Banner */}
      <motion.section
        className="w-full max-w-4xl mx-auto bg-gradient-to-br from-green-700/20 via-green-500/10 to-green-700/20 rounded-2xl shadow-xl p-10 md:p-16 flex flex-col items-center text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-green-300 font-outfit">Ready to Ride?</h2>
        <p className="text-slate-300 mb-8">Join 10,000+ happy customers who trust DriveEase every day.</p>
        <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
          <Link to="/book-ride" className="w-full md:w-auto">
            <motion.button
              className="w-full md:w-auto px-8 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-lg transition-all duration-150 mb-2 md:mb-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started →
            </motion.button>
          </Link>
          <Link to="/drivers" className="w-full md:w-auto">
            <motion.button
              className="w-full md:w-auto px-8 py-3 rounded-xl border border-green-400 text-green-300 bg-transparent hover:bg-slate-800/60 font-semibold transition-all duration-150"
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
