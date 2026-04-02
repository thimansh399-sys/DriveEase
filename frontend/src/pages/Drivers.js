import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { STATE_OPTIONS, getAreasByCity, getCitiesByState } from '../utils/locationData';
import { annotateDriversWithDistance } from '../utils/geo';
import { buildAssetUrl } from '../utils/network';
import '../styles/UnifiedUI.css';
import '../styles/EnhancedAnimations.css';

const buildDriverLocation = (driver) => {
  const parts = [];
  const address = driver.personalDetails?.address || driver.currentLocation?.address;
  const city = driver.currentLocation?.city || driver.personalDetails?.city;
  const state = driver.currentLocation?.state || driver.personalDetails?.state;
  const pincode = driver.currentLocation?.pincode || driver.personalDetails?.pincode;

  if (address) parts.push(address);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (pincode) parts.push(String(pincode));

  if (!parts.length && Array.isArray(driver.serviceAreas) && driver.serviceAreas.length) {
    return driver.serviceAreas.join(', ');
  }

  return parts.join(', ') || 'Location not available';
};

const mapDriverCard = (driver, index) => ({
  _id: driver._id || `driver-${index}`,
  name: driver.name,
  rating: driver.rating?.averageRating || 4.5,
  rides: driver.rating?.totalRatings || driver.experience?.totalRides || 0,
  experience: driver.experience?.yearsOfExperience || 0,
  location: buildDriverLocation(driver),
  price: driver.price || 80,
  available: driver.isOnline ?? false,
  profileImg: (() => {
    const pic = driver.profilePicture || driver.documents?.selfie?.file;
    if (!pic) return `https://randomuser.me/api/portraits/men/${index + 30}.jpg`;
    return buildAssetUrl(pic);
  })(),
  phone: driver.phone || '-',
  vehicle: driver.vehicle?.model || driver.vehicle?.registrationNumber || '-',
  languages: driver.languages?.length > 0 ? driver.languages : ['Hindi'],
  verified: driver.status === 'approved' || driver.isVerified,
  serviceAreas: Array.isArray(driver.serviceAreas) ? driver.serviceAreas : [],
  distanceKm: Number.isFinite(Number(driver.distance)) ? Number(driver.distance).toFixed(1) : null,
});

export default function Drivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [browserCoords, setBrowserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting your location for GPS-based nearby drivers...');
  const [locationError, setLocationError] = useState('');
  const [apiError, setApiError] = useState('');

  const cityOptions = useMemo(() => (state ? getCitiesByState(state) : []), [state]);
  const areaOptions = useMemo(() => (state && city ? getAreasByCity(state, city) : []), [state, city]);
  const pincodeOptions = useMemo(() => {
    const values = new Set();
    drivers.forEach((driver) => {
      const raw = String(driver.location || '');
      const matches = raw.match(/\b\d{6}\b/g) || [];
      matches.forEach((match) => values.add(match));
    });
    return [...values].sort();
  }, [drivers]);

  const resolveLocationFromCoords = useCallback(async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: { Accept: 'application/json' }
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const address = data?.address || {};
      const detectedState = address.state || '';
      const detectedCity = address.city || address.town || address.county || '';
      const detectedPincode = address.postcode ? String(address.postcode).slice(0, 6) : '';

      if (detectedState) setState(detectedState);
      if (detectedCity) setCity(detectedCity);
      if (detectedPincode) setPincode(detectedPincode);
    } catch (_) {
      // Silent fallback: manual filters still available.
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Browser location is not supported on this device.');
      setLocationStatus('Showing online drivers using manual city and area filters.');
      return;
    }

    setLocationError('');
    setLocationStatus('Fetching your live location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBrowserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('Nearby drivers are now sorted by your browser GPS distance.');
        resolveLocationFromCoords(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLocationError(error.message || 'Location access denied.');
        setLocationStatus('Location unavailable. You can still filter by state, city, and area.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
  }, [resolveLocationFromCoords]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  useEffect(() => {
    if (city && !cityOptions.includes(city)) {
      setCity('');
      setArea('');
    }
  }, [cityOptions, city]);

  useEffect(() => {
    if (area && !areaOptions.includes(area)) {
      setArea('');
    }
  }, [areaOptions, area]);

  useEffect(() => {
    let isMounted = true;

    const fetchDrivers = async () => {
      setLoading(true);
      try {
        const hasCoords = Number.isFinite(Number(browserCoords?.latitude)) && Number.isFinite(Number(browserCoords?.longitude));
        let query = '?status=all';
        if (state) query += `&state=${encodeURIComponent(state)}`;
        if (city) query += `&city=${encodeURIComponent(city)}`;
        if (area) query += `&area=${encodeURIComponent(area)}`;
        if (pincode) query += `&pincode=${encodeURIComponent(pincode)}`;

        const [allResponse, nearbyResponse] = await Promise.all([
          api.getAllDrivers(query),
          hasCoords
            ? api.getNearbyDrivers({
                latitude: browserCoords.latitude,
                longitude: browserCoords.longitude,
                state,
                city,
                area,
                pincode,
                radius: 50,
              })
            : Promise.resolve([])
        ]);

        const allList = Array.isArray(allResponse) ? allResponse : [];
        const nearbyList = Array.isArray(nearbyResponse) ? nearbyResponse : [];
        const nearbyMap = new Map(nearbyList.map((entry) => [String(entry._id), entry]));

        const list = allList.map((driver) => {
          const key = String(driver._id);
          const nearbyDriver = nearbyMap.get(key);
          return nearbyDriver?.distance != null
            ? { ...driver, distance: nearbyDriver.distance }
            : driver;
        });
        if (!isMounted) return;

        const distanceSortedDrivers = browserCoords
          ? annotateDriversWithDistance(list, browserCoords)
          : list;

        if (distanceSortedDrivers.length > 0) {
          setDrivers(distanceSortedDrivers.map(mapDriverCard));
        } else {
          setDrivers([]);
        }
      } catch (error) {
        if (isMounted) {
          setDrivers([]);
          const errorMsg = error.message || 'Unable to load nearby drivers.';
          if (errorMsg.includes('not reachable') || errorMsg.includes('Backend')) {
            setApiError('⚠️ Backend server not accessible. Please check server status or contact admin.');
          } else {
            setLocationError(errorMsg);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [browserCoords, state, city, area, pincode]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return drivers
      .filter((driver) =>
        [driver.name, driver.location, driver.vehicle, ...(driver.serviceAreas || [])]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      )
      .sort((left, right) => {
        const leftDistance = Number(left.distanceKm);
        const rightDistance = Number(right.distanceKm);

        if (Number.isFinite(leftDistance) && Number.isFinite(rightDistance)) {
          return leftDistance - rightDistance;
        }

        if (Number.isFinite(leftDistance)) return -1;
        if (Number.isFinite(rightDistance)) return 1;
        return 0;
      });
  }, [drivers, search]);

  return (
    <motion.div
      className="ux-page ux-drivers-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div className="ux-container">
        <motion.div
          className="ux-header-row"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.h2
            style={{ margin: 0 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            Find Your Driver
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}
          >
            <button type="button" className="ux-btn primary" onClick={detectLocation}>
              Use My Current Location
            </button>
          </motion.div>
        </motion.div>

        <div className="ux-filter-row">
          <select className="ux-search" value={state} onChange={(e) => { setState(e.target.value); setCity(''); setArea(''); }}>
            <option value="">All States</option>
            {STATE_OPTIONS.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
          <select className="ux-search" value={city} onChange={(e) => { setCity(e.target.value); setArea(''); }} disabled={!state}>
            <option value="">All Cities</option>
            {cityOptions.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
          <select className="ux-search" value={area} onChange={(e) => setArea(e.target.value)} disabled={!city}>
            <option value="">All Areas</option>
            {areaOptions.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
          <input
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="ux-search"
            list="drivers-pincode-options"
            inputMode="numeric"
          />
          <datalist id="drivers-pincode-options">
            {pincodeOptions.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <input
            placeholder="Search driver, vehicle, or locality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ux-search"
          />
        </div>

        <p className="ux-subtle" style={{ marginTop: 0, marginBottom: '8px' }}>
          {locationStatus} Auto refresh: every 60 seconds.
        </p>
        {apiError && (
          <p className="ux-subtle" style={{ marginTop: 0, marginBottom: '8px', color: '#fca5a5', fontWeight: 'bold', padding: '8px', backgroundColor: 'rgba(252, 165, 165, 0.1)', borderRadius: '4px' }}>
            {apiError}
          </p>
        )}
        {locationError && !apiError && (
          <p className="ux-subtle" style={{ marginTop: 0, marginBottom: '18px', color: '#fca5a5' }}>
            {locationError}
          </p>
        )}

        <motion.div className="ux-card-grid" layout>
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div
                className="ux-empty"
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="loading-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ marginRight: '12px' }}
                />
                Loading nearby drivers...
              </motion.div>
            ) : filtered.length > 0 ? (
              filtered.map((driver, index) => (
                <motion.div
                  className="ux-driver-card"
                  key={driver._id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ delay: index * 0.08, duration: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div className="ux-driver-top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.08 + 0.1 }}>
                    <motion.div style={{ position: 'relative' }}>
                      <motion.img
                        src={driver.profileImg}
                        alt={driver.name}
                        className="ux-avatar"
                        onError={(event) => {
                          event.target.src = 'https://randomuser.me/api/portraits/men/31.jpg';
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      />
                      <motion.div
                        className="driver-status-indicator"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: driver.available ? '#22c55e' : '#ef4444',
                          border: '3px solid #0b0f19',
                          opacity: driver.available ? 1 : 0.6,
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.08 + 0.2, type: 'spring' }}
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 + 0.15 }}>
                      <motion.h3 style={{ margin: '0 0 4px 0' }}>{driver.name}</motion.h3>
                      <p className="ux-subtle" style={{ margin: 0 }}>
                        {driver.available ? 'Online and ready' : 'Currently offline'}
                      </p>
                    </motion.div>
                  </motion.div>

                  <motion.p className="ux-rating" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 + 0.2 }}>
                    ⭐ {driver.rating}
                  </motion.p>

                  <motion.p className="ux-location" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 + 0.25 }}>
                    📍 {driver.location}
                  </motion.p>

                  <motion.div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginTop: '12px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      color: '#93c5fd',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.27 }}
                  >
                    <div>
                      <span style={{ color: '#fff', fontWeight: 500 }}>Rides:</span><br />{driver.rides}
                    </div>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 500 }}>Experience:</span><br />{driver.experience} yrs
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#fff', fontWeight: 500 }}>Vehicle:</span><br />{driver.vehicle}
                    </div>
                    <div>
                      <span style={{ color: '#22c55e', fontWeight: 500 }}>₹{driver.price}/km</span>
                    </div>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 500 }}>Distance:</span><br />{driver.distanceKm ? `${driver.distanceKm} km away` : 'GPS unavailable'}
                    </div>
                  </motion.div>

                  <motion.button
                    className="ux-btn primary full"
                    onClick={() => navigate(driver._id ? `/booking/${driver._id}` : '/booking')}
                    disabled={!driver.available}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 + 0.3 }}
                    whileHover={driver.available ? { scale: 1.05 } : {}}
                    whileTap={driver.available ? { scale: 0.95 } : {}}
                  >
                    {driver.available ? 'Book Driver' : 'Unavailable'}
                  </motion.button>

                  <motion.div className="ux-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.08 + 0.35 }}>
                    {driver.verified ? 'Verified Driver' : 'Verification Pending'}
                  </motion.div>
                </motion.div>
              ))
            ) : (
              <motion.div className="ux-empty" key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                No drivers available. Try another search or enable GPS location.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
