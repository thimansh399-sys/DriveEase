import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { STATE_OPTIONS, getAreasByCity, getCitiesByState } from '../utils/locationData';
import { annotateDriversWithDistance } from '../utils/geo';
import { buildAssetUrl } from '../utils/network';
import '../styles/Browse.css';

function Browse() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [isOnline, setIsOnline] = useState('');
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [cities, setCities] = useState([]);
  const [bookingDriver, setBookingDriver] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    pickupAddress: '',
    dropAddress: '',
    bookingDate: '',
    bookingType: 'daily',
    numberOfDays: 1,
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [browserCoords, setBrowserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting your location for nearby drivers...');
  const [locationError, setLocationError] = useState('');

  const areaOptions = getAreasByCity(state, city);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Browser GPS is not supported on this device.');
      setLocationStatus('Showing driver list using filters only.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBrowserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('Nearby drivers are sorted by your live GPS distance.');
      },
      (error) => {
        setLocationError(error.message || 'Location access denied.');
        setLocationStatus('Showing driver list using filters only.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
  }, []);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const hasCoords = Number.isFinite(Number(browserCoords?.latitude)) && Number.isFinite(Number(browserCoords?.longitude));
      let response;

      if (hasCoords && !pincode && isOnline !== 'false') {
        response = await api.getNearbyDrivers({
          latitude: browserCoords.latitude,
          longitude: browserCoords.longitude,
          state,
          city,
          area,
          radius: 50,
        });
      } else {
        let query = '?status=all';
        if (state) query += `&state=${state}`;
        if (city) query += `&city=${city}`;
        if (area) query += `&area=${encodeURIComponent(area)}`;
        if (pincode) query += `&pincode=${pincode}`;
        if (isOnline) query += `&isOnline=${isOnline}`;
        response = await api.getAllDrivers(query);
      }

      if (Array.isArray(response)) {
        const sortedDrivers = browserCoords
          ? annotateDriversWithDistance(response, browserCoords)
          : response;
        setDrivers(sortedDrivers);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [area, browserCoords, city, isOnline, pincode, state]);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 10000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  useEffect(() => {
    if (state) {
      setCities(getCitiesByState(state));
      setCity('');
      setArea('');
    } else {
      setCities([]);
      setCity('');
      setArea('');
    }
  }, [state]);

  const clearFilters = () => {
    setState('');
    setCity('');
    setArea('');
    setPincode('');
    setIsOnline('');
  };

  const hasFilters = state || city || area || pincode || isOnline;

  const getDriverLocation = (driver) => {
    const parts = [];
    const loc = driver.personalDetails || driver.currentLocation || {};
    if (loc.address) parts.push(loc.address);
    if (loc.city) parts.push(loc.city);
    if (loc.state) parts.push(loc.state);
    if (loc.pincode) parts.push(loc.pincode);
    if (parts.length === 0 && Array.isArray(driver.serviceAreas) && driver.serviceAreas.length > 0) {
      parts.push(driver.serviceAreas.join(', '));
    }
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const openBookingModal = (driver) => {
    setBookingDriver(driver);
    setBookingSuccess('');
    setBookingError('');
    // Pre-fill if user is logged in
    const userName = localStorage.getItem('userName') || '';
    const userPhone = localStorage.getItem('userPhone') || '';
    setBookingForm({
      customerName: userName,
      customerPhone: userPhone,
      pickupAddress: '',
      dropAddress: '',
      bookingDate: '',
      bookingType: 'daily',
      numberOfDays: 1,
      notes: ''
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      if (!bookingDriver?._id) {
        throw new Error('Please select a driver first.');
      }

      if (!bookingForm.pickupAddress?.trim() || !bookingForm.dropAddress?.trim()) {
        throw new Error('Pickup and drop address are required.');
      }

      const params = new URLSearchParams({
        driverId: bookingDriver._id,
        pickup: bookingForm.pickupAddress.trim(),
        drop: bookingForm.dropAddress.trim(),
      });

      if (bookingForm.customerName?.trim()) params.set('name', bookingForm.customerName.trim());
      if (bookingForm.customerPhone?.trim()) params.set('phone', bookingForm.customerPhone.trim());

      setBookingSuccess('Redirecting to booking page...');
      setBookingDriver(null);
      navigate(`/book-ride?${params.toString()}`);
    } catch (err) {
      setBookingError(err.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="browse-page">
      <div className="browse-hero">
        <h1 className="browse-title">🚗 Browse Drivers</h1>
        <p className="browse-subtitle">Find the perfect driver for your journey</p>
        <p className="browse-subtitle" style={{ marginTop: '8px', fontSize: '14px' }}>{locationStatus}</p>
        {locationError && <p className="browse-subtitle" style={{ marginTop: '4px', fontSize: '13px', color: '#fecaca' }}>{locationError}</p>}
      </div>

      <div className="browse-filters">
        <div className="browse-filter-item">
          <label>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All States</option>
            {STATE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="browse-filter-item">
          <label>City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!state}>
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="browse-filter-item">
          <label>Area</label>
          <select value={area} onChange={(e) => setArea(e.target.value)} disabled={!city}>
            <option value="">All Areas</option>
            {areaOptions.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </div>

        <div className="browse-filter-item">
          <label>Pincode</label>
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Enter Pincode"
            maxLength={6}
          />
        </div>

        <div className="browse-filter-item">
          <label>Status</label>
          <select value={isOnline} onChange={(e) => setIsOnline(e.target.value)}>
            <option value="">All</option>
            <option value="true">🟢 Online</option>
            <option value="false">🔘 Offline</option>
          </select>
        </div>

        {hasFilters && (
          <button className="browse-clear-btn" onClick={clearFilters}>✕ Clear</button>
        )}
      </div>

      <div className="browse-stats">
        <span className="browse-count">{drivers.length} Drivers Found</span>
        {hasFilters && (
          <span className="browse-filter-tags">
            {state && <span className="browse-tag">{state} ✕</span>}
            {city && <span className="browse-tag">{city} ✕</span>}
            {area && <span className="browse-tag">{area} ✕</span>}
            {pincode && <span className="browse-tag">📍 {pincode} ✕</span>}
            {isOnline === 'true' && <span className="browse-tag">🟢 Online ✕</span>}
            {isOnline === 'false' && <span className="browse-tag">🔘 Offline ✕</span>}
          </span>
        )}
      </div>

      {loading ? (
        <div className="browse-loading">
          <div className="browse-spinner"></div>
          <p>Loading drivers...</p>
        </div>
      ) : drivers.length > 0 ? (
        <div className="browse-grid">
          {drivers.map((driver) => (
            <div key={driver._id} className="browse-card">
              <div className="browse-card-top">
                {driver.profilePicture ? (
                  <img
                    src={buildAssetUrl(driver.profilePicture)}
                    alt={driver.name}
                    className="browse-card-img"
                    onError={(event) => {
                      event.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
                    }}
                  />
                ) : (
                  <div className="browse-card-img-placeholder">
                    <span>{driver.name?.charAt(0)}</span>
                  </div>
                )}
                <div className="browse-card-header">
                  <h3 className="browse-card-name">{driver.name}</h3>
                  <span className={`browse-badge ${driver.isOnline ? 'browse-online' : 'browse-offline'}`}>
                    {driver.isOnline ? '🟢 Online' : '🔘 Offline'}
                  </span>
                </div>
              </div>
              <div className="browse-card-info">
                <div className="browse-info-row">
                  <span className="browse-info-icon">📞</span>
                  <span>{driver.phone}</span>
                </div>
                <div className="browse-info-row">
                  <span className="browse-info-icon">🚘</span>
                  <span>{driver.experience?.yearsOfExperience || 0} yrs experience</span>
                </div>
                <div className="browse-info-row">
                  <span className="browse-info-icon">⭐</span>
                  <span>{driver.rating?.averageRating ?? 0} ({driver.rating?.totalRatings ?? 0} rides)</span>
                </div>
                {getDriverLocation(driver) && (
                  <div className="browse-info-row">
                    <span className="browse-info-icon">📍</span>
                    <span>{getDriverLocation(driver)}</span>
                  </div>
                )}
                {driver.vehicle?.model && (
                  <div className="browse-info-row">
                    <span className="browse-info-icon">🚙</span>
                    <span>{driver.vehicle.model}</span>
                  </div>
                )}
                {Number.isFinite(Number(driver.distance)) && (
                  <div className="browse-info-row">
                    <span className="browse-info-icon">📏</span>
                    <span>{Number(driver.distance).toFixed(1)} km away</span>
                  </div>
                )}
              </div>
              <div className="browse-card-actions">
                <button
                  className="browse-book-btn"
                  onClick={() => openBookingModal(driver)}
                  disabled={!driver.isOnline}
                >
                  {driver.isOnline ? '📅 Book Now' : 'Unavailable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="browse-empty">
          <div className="browse-empty-icon">😔</div>
          <h3>No drivers found</h3>
          <p>Try changing or clearing your filters</p>
          {hasFilters && <button className="browse-clear-btn" onClick={clearFilters}>Clear Filters</button>}
        </div>
      )}

      {/* Booking Modal */}
      {bookingDriver && (
        <div className="browse-modal-overlay" onClick={() => !bookingLoading && setBookingDriver(null)}>
          <div className="browse-modal" onClick={e => e.stopPropagation()}>
            <button className="browse-modal-close" onClick={() => !bookingLoading && setBookingDriver(null)}>✕</button>

            <div className="browse-modal-header">
              {bookingDriver.profilePicture ? (
                <img
                  src={buildAssetUrl(bookingDriver.profilePicture)}
                  alt={bookingDriver.name}
                  className="browse-modal-img"
                  onError={(event) => {
                    event.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
                  }}
                />
              ) : (
                <div className="browse-modal-img-placeholder">
                  <span>{bookingDriver.name?.charAt(0)}</span>
                </div>
              )}
              <div>
                <h2 style={{ margin: '0 0 4px', color: '#f8fafc' }}>Book {bookingDriver.name}</h2>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                  ⭐ {bookingDriver.rating?.averageRating ?? 0} • {bookingDriver.experience?.yearsOfExperience || 0} yrs exp
                </p>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="browse-booking-success">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                <p>{bookingSuccess}</p>
                <button className="browse-book-btn" onClick={() => setBookingDriver(null)}>Done</button>
              </div>
            ) : (
              <form className="browse-booking-form" onSubmit={handleBookingSubmit}>
                {bookingError && <div className="browse-booking-error">{bookingError}</div>}

                <div className="browse-form-row">
                  <div className="browse-form-group">
                    <label>Your Name *</label>
                    <input
                      required
                      value={bookingForm.customerName}
                      onChange={e => setBookingForm(p => ({...p, customerName: e.target.value}))}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="browse-form-group">
                    <label>Your Phone *</label>
                    <input
                      required
                      value={bookingForm.customerPhone}
                      onChange={e => setBookingForm(p => ({...p, customerPhone: e.target.value}))}
                      placeholder="10-digit number"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="browse-form-group">
                  <label>Pickup Location *</label>
                  <input
                    required
                    value={bookingForm.pickupAddress}
                    onChange={e => setBookingForm(p => ({...p, pickupAddress: e.target.value}))}
                    placeholder="Enter pickup address"
                  />
                </div>

                <div className="browse-form-group">
                  <label>Drop Location *</label>
                  <input
                    required
                    value={bookingForm.dropAddress}
                    onChange={e => setBookingForm(p => ({...p, dropAddress: e.target.value}))}
                    placeholder="Enter drop address"
                  />
                </div>

                <div className="browse-form-row">
                  <div className="browse-form-group">
                    <label>Date & Time *</label>
                    <input
                      required
                      type="datetime-local"
                      value={bookingForm.bookingDate}
                      onChange={e => setBookingForm(p => ({...p, bookingDate: e.target.value}))}
                    />
                  </div>
                  <div className="browse-form-group">
                    <label>Booking Type</label>
                    <select
                      value={bookingForm.bookingType}
                      onChange={e => setBookingForm(p => ({...p, bookingType: e.target.value}))}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="outstation">Outstation</option>
                    </select>
                  </div>
                </div>

                <div className="browse-form-row">
                  <div className="browse-form-group">
                    <label>Number of Days</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={bookingForm.numberOfDays}
                      onChange={e => setBookingForm(p => ({...p, numberOfDays: e.target.value}))}
                    />
                  </div>
                  <div className="browse-form-group">
                    <label>Notes (optional)</label>
                    <input
                      value={bookingForm.notes}
                      onChange={e => setBookingForm(p => ({...p, notes: e.target.value}))}
                      placeholder="Any special requests"
                    />
                  </div>
                </div>

                <button type="submit" className="browse-submit-btn" disabled={bookingLoading}>
                  {bookingLoading ? 'Booking...' : '✅ Confirm Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Browse;
