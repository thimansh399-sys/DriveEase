import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, Polyline, TileLayer, Tooltip, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import '../styles/Booking.css';
import '../styles/BookDriver.css';


// --- New: India states for dropdown ---
// const INDIAN_STATES = [ ... ]; // unused

const DEFAULT_CENTER = [28.6139, 77.209];

// const insuranceOptions = [ ... ]; // unused

// const rideOptions = [ ... ]; // unused

function MapViewport({ pickupCoords, dropCoords, routeCoords }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoords.length > 1) {
      map.fitBounds(routeCoords, { padding: [40, 40] });
      return;
    }

    if (pickupCoords && dropCoords) {
      map.fitBounds([pickupCoords, dropCoords], { padding: [40, 40] });
      return;
    }

    if (pickupCoords) {
      map.setView(pickupCoords, 12);
      return;
    }

    if (dropCoords) {
      map.setView(dropCoords, 12);
      return;
    }

    map.setView(DEFAULT_CENTER, 5);
  }, [map, pickupCoords, dropCoords, routeCoords]);

  return null;
}

// async function geocodeLocation(query, signal) { ... } // unused

// async function fetchRouteData(pickup, drop, signal) { ... } // unused

// function mapRideType(rideLabel) { ... } // unused

// function splitCityState(rawAddress) { ... } // unused

export default function BookDriver() {
  // --- Fix: Declare distance state at the top ---
  const [distance] = useState(5); // Default to 5km for demo, update as needed
  // Modern header and search bar UI
  // Handler for GPS location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(`${position.coords.latitude},${position.coords.longitude}`);
          alert('Location set via GPS!');
        },
        (error) => {
          alert('Unable to retrieve your location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };
        // Simulate user login state and location (replace with real auth/location logic)
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [userLocation, setUserLocation] = useState("");

        // Prompt for login/location if needed
        const handleBook = (driver) => {
          if (!isLoggedIn || !userLocation) {
            alert("Please login and submit your location to book a driver.");
            // Optionally, open login modal or location input here
            return;
          }
          setSelectedDriver(driver);
          setShowModal(true);
        };
      // Booking modal state
      const [selectedDriver, setSelectedDriver] = useState(null);
      const [showModal, setShowModal] = useState(false);
      const [bookingData, setBookingData] = useState({ pickup: '', drop: '', time: '', insurance: 'none' });
      const [calculatedFare, setCalculatedFare] = useState(0);

      // Fare calculation logic
      useEffect(() => {
        // Example: base fare 50, per km 10, insurance
        let baseFare = 50;
        let perKm = 10;
        let insurance = 0;
        if (bookingData.insurance === 'mini') insurance = 10;
        if (bookingData.insurance === 'premium') insurance = 20;
        // Use distance state directly (already defaulted to 5)
        let dist = distance;
        setCalculatedFare(baseFare + dist * perKm + insurance);
      }, [bookingData.insurance, distance]);

      // Confirm booking handler (logs and closes modal, can be upgraded to save to backend)
      const handleConfirmBooking = async () => {
        // Uncomment below to save to backend
        // await fetch("http://localhost:5000/api/bookings", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ driverId: selectedDriver._id, ...bookingData, fare: calculatedFare })
        // });
        alert(`Booking Confirmed ✅\nFare: ₹${calculatedFare}`);
        setShowModal(false);
      };

      // Bubble filter buttons (example for city, can be expanded)
      const cityBubbles = ["Kanpur", "Lucknow", "Delhi", "Mumbai", "Bangalore"];
    // --- Restore missing state and handlers for UI to compile ---
    const [form] = useState({ name: '', phone: '', pickup: '', drop: '', ride: 'Standard', insurance: 0 });
    // const updateField = (key, value) => setForm(f => ({ ...f, [key]: value })); // unused
    const [showConfirmation] = useState(false); // used in JSX
    const [assignedRide] = useState(null); // used in JSX
    const [duration] = useState(0); // used in JSX
    const [mapLoading] = useState(false); // used in JSX
    const [mapStatus] = useState(''); // used in JSX
    const [pickupGeo] = useState(null); // used in JSX
    const [dropGeo] = useState(null); // used in JSX
    const [routeData] = useState(null); // used in JSX
    const [fare] = useState({ baseFare: 0, perKm: 0, insurance: 0, total: 0 }); // used in JSX
    // (distance state is now declared at the top)
    // const handleSearchDrivers = () => {}; // unused
  // --- New: Driver search filters and results ---
  const [filters, setFilters] = useState({ state: '', city: '', area: '', pincode: '' });
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  // const [driversError, setDriversError] = useState(''); // unused


  // Fetch drivers from backend on mount and whenever filters change

  // Fetch drivers function
  const fetchDrivers = useCallback(async () => {
    setDriversLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.city) params.append('city', filters.city);
      if (filters.area) params.append('area', filters.area);
      if (filters.pincode) params.append('pincode', filters.pincode);
      const query = params.toString() ? `?${params.toString()}` : '';
      // Use shared API utility
      const data = await api.getAllDrivers(query);
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  }, [filters.state, filters.city, filters.area, filters.pincode]);

  // Fetch on mount and whenever filters change
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Search button handler
  const handleSearch = () => {
    fetchDrivers();
  };

  // Use all drivers as filteredDrivers (no in-memory filtering)
  const filteredDrivers = drivers;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Haversine formula to calculate distance between two lat/lng points
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Direct booking: find nearest available driver
  const handleDirectBook = () => {
    if (!isLoggedIn || !userLocation || !bookingData.pickup) {
      alert('Please login and enter your pickup location.');
      return;
    }
    // Parse userLocation (lat,lng)
    const [userLat, userLng] = userLocation.split(',').map(Number);
    // Find nearest driver with valid location
    let nearest = null;
    let minDist = Infinity;
    filteredDrivers.forEach(driver => {
      if (driver.location && Array.isArray(driver.location.coordinates)) {
        const [lng, lat] = driver.location.coordinates;
        const dist = haversineDistance(userLat, userLng, lat, lng);
        if (dist < minDist) {
          minDist = dist;
          nearest = driver;
        }
      }
    });
    if (nearest) {
      setSelectedDriver(nearest);
      setShowModal(true);
    } else {
      alert('No available drivers found nearby.');
    }
  };

  // ...existing code for hooks, handlers, etc...
  return (
    <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Find Your Driver</h1>
        <div className="flex gap-3">
          <button
            onClick={getLocation}
            className="bg-green-500 px-5 py-2 rounded-full hover:bg-green-600 transition"
          >
            Use My GPS
          </button>
          <button
            onClick={fetchDrivers}
            className="bg-white text-black px-5 py-2 rounded-full hover:bg-gray-300 transition"
          >
            Show Drivers
          </button>
        </div>
      </div>
      {/* Search Bar & Direct Booking */}
      <div className="bg-gray-900 p-4 rounded-xl flex items-center gap-3 shadow-lg mb-8">
        <input
          type="text"
          placeholder="Search driver, car..."
          className="flex-1 bg-gray-800 p-3 rounded-lg outline-none"
        />
        <button className="bg-green-500 px-6 py-2 rounded-lg">
          Search
        </button>
        <button
          className="bg-yellow-500 px-6 py-2 rounded-lg ml-4"
          onClick={handleDirectBook}
        >
          Book Nearest Driver
        </button>
      </div>
      {/* Existing booking UI below */}
      <div className="book-driver-main-grid">
      {/* Left: Driver search/filter sidebar (to be restored next) */}
      <div className="book-driver-sidebar">
        <h2 className="book-driver-sidebar-title">Find Drivers</h2>
        <div className="book-driver-filters">
          <div className="flex flex-wrap gap-2 mb-4">
            {cityBubbles.map(city => (
              <button
                key={city}
                className={`px-4 py-2 rounded-full text-white font-semibold ${filters.city === city ? 'bg-green-500' : 'bg-gray-700 hover:bg-green-600'}`}
                onClick={() => handleFilterChange('city', city)}
                type="button"
              >
                {city}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <input
              type="text"
              placeholder="Enter City or Area"
              className="bg-gray-800 text-white px-4 py-2 rounded-lg w-48"
              value={filters.city}
              onChange={e => handleFilterChange('city', e.target.value)}
            />
            <input
              type="text"
              placeholder="Pincode"
              className="bg-gray-800 text-white px-4 py-2 rounded-lg w-32"
              value={filters.pincode}
              onChange={e => handleFilterChange('pincode', e.target.value)}
              maxLength={6}
            />
            <button
              onClick={handleSearch}
              className="bg-green-500 px-6 py-2 rounded-lg text-white"
              type="button"
            >
              Search Drivers
            </button>
            <button
              onClick={() => {
                // Simulate GPS location
                setUserLocation("Your GPS Location");
                alert("Location set via GPS!");
              }}
              className="bg-blue-500 px-4 py-2 rounded-lg text-white"
              type="button"
            >
              Use My GPS
            </button>
            {!isLoggedIn && (
              <button
                onClick={() => { setIsLoggedIn(true); alert('Logged in!'); }}
                className="bg-yellow-500 px-4 py-2 rounded-lg text-white"
                type="button"
              >
                Login
              </button>
            )}
          </div>
        </div>
        <div className="book-driver-results">
          {/* {driversError && <div className="book-driver-error">{driversError}</div>} */}
          {driversLoading && <div style={{ color: '#94a3b8', marginTop: 12 }}>Loading drivers...</div>}
          {!driversLoading && filteredDrivers.length === 0 && (
            <div style={{ color: '#94a3b8', marginTop: 12 }}>No drivers found for the selected filters.</div>
          )}
          {!driversLoading && filteredDrivers.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              {filteredDrivers.map(driver => (
                <div
                  key={driver._id}
                  className="bg-gray-900 p-4 rounded-xl shadow-md driver-card hover:scale-105 transition-transform duration-300"
                  style={{ minHeight: 210 }}
                >
                  <h2 className="text-white text-lg font-semibold">{driver.name}</h2>
                  <p className="text-gray-400 text-sm">{driver.carModel || driver.car || 'N/A'}</p>
                  <p className="text-gray-400 text-sm">⭐ {driver.rating?.averageRating ?? driver.rating ?? 'N/A'} • ₹{driver.price || 'N/A'}/km</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleBook(driver)}
                      className="bg-green-500 px-4 py-2 rounded-lg text-white"
                    >
                      Book Now
                    </button>
                    {driver.phone && (
                      <a
                        href={`tel:${driver.phone}`}
                        className="bg-blue-500 px-4 py-2 rounded-lg text-white"
                      >
                        Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
                {/* Booking Modal */}
                {showModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-gray-900 p-6 rounded-xl w-96">
                      <h2 className="text-white text-xl font-semibold mb-4">
                        Book {selectedDriver?.name}
                      </h2>
                      <input
                        type="text"
                        placeholder="Pickup Location"
                        className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
                        value={bookingData.pickup}
                        onChange={e => setBookingData({ ...bookingData, pickup: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Drop Location"
                        className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
                        value={bookingData.drop}
                        onChange={e => setBookingData({ ...bookingData, drop: e.target.value })}
                      />
                      <input
                        type="datetime-local"
                        className="w-full mb-4 p-2 rounded bg-gray-800 text-white"
                        value={bookingData.time}
                        onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                      />
                      {/* Insurance Selection */}
                      <div className="mb-4">
                        <label className="block text-white mb-2 font-semibold">Insurance</label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="insurance"
                              value="none"
                              checked={bookingData.insurance === 'none'}
                              onChange={() => setBookingData({ ...bookingData, insurance: 'none' })}
                            />
                            None
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="insurance"
                              value="mini"
                              checked={bookingData.insurance === 'mini'}
                              onChange={() => setBookingData({ ...bookingData, insurance: 'mini' })}
                            />
                            Mini Plan (+₹10)
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="insurance"
                              value="premium"
                              checked={bookingData.insurance === 'premium'}
                              onChange={() => setBookingData({ ...bookingData, insurance: 'premium' })}
                            />
                            Premium (+₹20)
                          </label>
                        </div>
                      </div>
                      {/* Fare Display */}
                      <div className="mb-4 text-white font-semibold">
                        Fare: ₹{calculatedFare}
                      </div>
                      <div className="flex justify-between">
                        <button
                          onClick={() => setShowModal(false)}
                          className="bg-gray-600 px-4 py-2 rounded text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmBooking}
                          className="bg-green-500 px-4 py-2 rounded text-white"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
        </div>
      </div>
      {/* Close sidebar and main grid before starting form column */}
      </div>

      {/* Right: Booking form column (to be restored next) */}
      <div className="booking-container book-driver-form-column">
                {/* Booking confirmation overlay (structure only) */}
                <AnimatePresence>
                  {showConfirmation && assignedRide && (
                    <motion.div
                      className="booking-confirm-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.75)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '16px',
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          background: '#0f172a',
                          border: '1.5px solid #16a34a',
                          borderRadius: '16px',
                          padding: '32px 28px',
                          maxWidth: '460px',
                          width: '100%',
                          textAlign: 'center',
                          boxShadow: '0 0 40px rgba(34,197,94,0.25)',
                        }}
                      >
                        <div style={{ fontSize: '52px', marginBottom: '8px' }}>✅</div>
                        <h3>Booking Confirmed!</h3>
                        {/* Details and actions will be restored with logic */}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
        <h2 className="booking-title">Book a Driver</h2>
        <div className="booking-card">
          <h3>Trip Details</h3>
          <div className="booking-form">
            {/* ...existing booking form fields... */}
          </div>
          <div className="booking-summary">
            {/* ...existing summary rows... */}
          </div>
        </div>
        <div className="book-driver-map-card" style={{ marginTop: 24 }}>
          <div className="book-driver-map-head">
            <div>
              <p>Live Route Preview</p>
              <h3>{form?.pickup || 'Pickup'} to {form?.drop || 'Drop'}</h3>
            </div>
            <div className="book-driver-map-pill">{duration} min ETA</div>
          </div>
          <div className="book-driver-map-status">
            <span className={`book-driver-map-status-dot ${mapLoading ? 'loading' : ''}`} />
            <span>{mapStatus}</span>
          </div>
          <div className="book-driver-map-visual">
            <MapContainer center={DEFAULT_CENTER} zoom={5} scrollWheelZoom className="book-driver-live-map">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewport
                pickupCoords={pickupGeo ? [pickupGeo.lat, pickupGeo.lng] : null}
                dropCoords={dropGeo ? [dropGeo.lat, dropGeo.lng] : null}
                routeCoords={routeData?.coordinates || []}
              />
              {pickupGeo && (
                <CircleMarker center={[pickupGeo.lat, pickupGeo.lng]} radius={10} pathOptions={{ color: '#16a34a', fillColor: '#22c55e', fillOpacity: 1, weight: 3 }}>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                    Pickup: {pickupGeo.displayName}
                  </Tooltip>
                </CircleMarker>
              )}
              {dropGeo && (
                <CircleMarker center={[dropGeo.lat, dropGeo.lng]} radius={10} pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 1, weight: 3 }}>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                    Drop: {dropGeo.displayName}
                  </Tooltip>
                </CircleMarker>
              )}
              {routeData?.coordinates?.length > 1 && (
                <Polyline positions={routeData.coordinates} pathOptions={{ color: '#22c55e', weight: 5, opacity: 0.9 }} />
              )}
            </MapContainer>
            <div className="book-driver-map-overlay-card driver">
              <strong>Driver Nearby</strong>
              <span>{form?.ride || 'Standard'} selected</span>
            </div>
            <div className="book-driver-map-overlay-card drop">
              <strong>{dropGeo ? 'Drop Pinned' : 'Destination'}</strong>
              <span>{dropGeo?.displayName || form?.drop || 'Choose drop location'}</span>
            </div>
          </div>
          <div className="book-driver-map-stats">
            <div>
              <span>Route</span>
              <strong>{distance} km</strong>
            </div>
            <div>
              <span>ETA</span>
              <strong>{duration} mins</strong>
            </div>
            <div>
              <span>Estimated Fare</span>
              <strong>₹{fare?.total?.toFixed(2) || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
