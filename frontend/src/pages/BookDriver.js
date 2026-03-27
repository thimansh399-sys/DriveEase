import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { INDIA_LOCATION_SUGGESTIONS } from '../utils/locationData';
import '../styles/Booking.css';
import '../styles/BookDriver.css';

const DEFAULT_CENTER = [28.6139, 77.209];

const insuranceOptions = [
  { label: 'No Insurance', value: 0 },
  { label: 'Basic Insurance (+₹50)', value: 50 },
  { label: 'Premium Insurance (+₹100)', value: 100 },
];

const rideOptions = [
  { label: 'Standard Driver', value: 'Standard' },
  { label: 'Premium Driver', value: 'Premium' },
  { label: 'Corporate Driver', value: 'Corporate' },
];

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

async function geocodeLocation(query, signal) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    {
      signal,
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch location');
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}

async function fetchRouteData(pickup, drop, signal) {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`,
    {
      signal,
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch route');
  }

  const data = await response.json();
  if (!data.routes || !data.routes[0]) {
    return null;
  }

  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationMins: route.duration / 60,
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}

function mapRideType(rideLabel) {
  if (rideLabel === 'Premium') return 'hourly';
  if (rideLabel === 'Corporate') return 'outstation';
  return 'daily';
}

function splitCityState(rawAddress) {
  const normalized = String(rawAddress || '').trim();
  if (!normalized) return { city: '', state: '' };
  const parts = normalized.split(',').map((p) => p.trim()).filter(Boolean);
  return {
    city: parts[0] || '',
    state: parts[1] || '',
  };
}

export default function BookDriver() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preferredDriverId = searchParams.get('driverId') || '';
  const authToken = localStorage.getItem('token');
  const currentRole = String(localStorage.getItem('userRole') || '').toLowerCase();
  const isCustomerRole = currentRole === 'customer' || currentRole === 'user';
  const [form, setForm] = useState({
    name: '',
    phone: '',
    pickup: searchParams.get('pickup') || '',
    drop: searchParams.get('drop') || '',
    ride: 'Standard',
    insurance: 0,
  });
  const [pickupGeo, setPickupGeo] = useState(null);
  const [dropGeo, setDropGeo] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [mapStatus, setMapStatus] = useState('Enter pickup and drop locations to preview the live route.');
  const [mapLoading, setMapLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [assignedRide, setAssignedRide] = useState(null);

  const estimatedDistance = useMemo(() => {
    if (!form.pickup || !form.drop) return 0;
    return Math.min(28, Math.max(8, Math.round((form.pickup.length + form.drop.length) / 3)));
  }, [form.pickup, form.drop]);

  useEffect(() => {
    if (!form.pickup.trim()) {
      setPickupGeo(null);
      setRouteData(null);
      setMapStatus('Enter pickup and drop locations to preview the live route.');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setMapLoading(true);
        const result = await geocodeLocation(form.pickup.trim(), controller.signal);
        setPickupGeo(result);
        if (result) {
          setMapStatus(`Pickup pinned near ${result.displayName}.`);
        } else {
          setMapStatus('Pickup location not found. Try a more specific location.');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMapStatus('Unable to locate pickup right now.');
        }
      } finally {
        setMapLoading(false);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [form.pickup]);

  useEffect(() => {
    if (!form.drop.trim()) {
      setDropGeo(null);
      setRouteData(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setMapLoading(true);
        const result = await geocodeLocation(form.drop.trim(), controller.signal);
        setDropGeo(result);
        if (result && pickupGeo) {
          setMapStatus(`Drop pinned near ${result.displayName}. Fetching route...`);
        } else if (result) {
          setMapStatus(`Drop pinned near ${result.displayName}.`);
        } else {
          setMapStatus('Drop location not found. Try a more specific location.');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMapStatus('Unable to locate drop right now.');
        }
      } finally {
        setMapLoading(false);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [form.drop, pickupGeo]);

  useEffect(() => {
    if (!pickupGeo || !dropGeo) {
      setRouteData(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setMapLoading(true);
        const route = await fetchRouteData(pickupGeo, dropGeo, controller.signal);
        setRouteData(route);
        if (route) {
          setMapStatus(`Route ready: ${route.distanceKm.toFixed(1)} km in ${Math.round(route.durationMins)} mins.`);
        } else {
          setMapStatus('Route preview unavailable for these locations.');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMapStatus('Unable to fetch route. Showing mapped locations only.');
        }
      } finally {
        setMapLoading(false);
      }
    })();

    return () => controller.abort();
  }, [pickupGeo, dropGeo]);

  const distance = useMemo(() => {
    if (routeData?.distanceKm) {
      return Number(routeData.distanceKm.toFixed(1));
    }
    return estimatedDistance;
  }, [estimatedDistance, routeData]);

  const duration = useMemo(() => {
    if (routeData?.durationMins) {
      return Math.max(1, Math.round(routeData.durationMins));
    }
    return Math.max(18, Math.round(estimatedDistance * 2.4));
  }, [estimatedDistance, routeData]);

  const fare = useMemo(() => {
    const baseFare = form.ride === 'Premium' ? 180 : form.ride === 'Corporate' ? 260 : 120;
    const perKm = form.ride === 'Premium' ? 16 : form.ride === 'Corporate' ? 22 : 12;
    const rideFare = baseFare + distance * perKm;
    return {
      baseFare,
      perKm,
      rideFare,
      insurance: Number(form.insurance),
      total: rideFare + Number(form.insurance),
    };
  }, [distance, form.insurance, form.ride]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (bookingError) setBookingError('');
  };

  const handleContinue = async () => {
    if (assignedRide?.id) {
      navigate(`/track-booking/${assignedRide.id}`);
      return;
    }

    if (!form.pickup.trim() || !form.drop.trim()) {
      setBookingError('Please enter pickup and drop location.');
      return;
    }

    if (!authToken) {
      setBookingError('Please login first to book a ride.');
      navigate('/login');
      return;
    }

    if (!isCustomerRole) {
      setBookingError('Booking is available for customer accounts only. Please login as customer to confirm this ride.');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError('');

      const pickupParsed = splitCityState(form.pickup);
      const dropParsed = splitCityState(form.drop);
      const now = new Date();

      const insuranceValue = Number(form.insurance || 0);
      const payload = {
        pickupLocation: {
          address: form.pickup.trim(),
          latitude: pickupGeo?.lat,
          longitude: pickupGeo?.lng,
          city: pickupParsed.city,
          state: pickupParsed.state,
        },
        dropLocation: {
          address: form.drop.trim(),
          latitude: dropGeo?.lat,
          longitude: dropGeo?.lng,
          city: dropParsed.city,
          state: dropParsed.state,
        },
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        rideType: mapRideType(form.ride),
        preferredDriverId: preferredDriverId || undefined,
        insuranceOpted: insuranceValue > 0,
        insuranceAmount: insuranceValue,
        paymentMethod: 'upi',
      };

      const response = await api.bookRide(payload);
      if (!response?.success || !response?.ride) {
        throw new Error(response?.error || 'Unable to book ride right now.');
      }

      setAssignedRide(response.ride);
      setMapStatus('Driver assigned successfully. Review driver details below and start tracking.');
    } catch (error) {
      setBookingError(error.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="booking-page book-driver-page">
      <div className="book-driver-banner-strip">
        <span>Book Your Driver Today</span>
        <span>20% Off First Ride</span>
        <span>Police Verified Drivers</span>
        <span>GPS Tracked Every Ride</span>
      </div>

      <div className="book-driver-layout">
        <motion.div
          className="booking-container book-driver-form-column"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="booking-title">Book a Driver</h2>

          <div className="booking-card">
            <h3>Trip Details</h3>
            <div className="booking-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    className="form-input"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    className="form-input"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pickup Location</label>
                <input
                  className="form-input"
                  placeholder="Enter pickup location (City, State)"
                  list="india-location-options"
                  value={form.pickup}
                  onChange={(e) => updateField('pickup', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Drop Location</label>
                <input
                  className="form-input"
                  placeholder="Enter drop location (City, State)"
                  list="india-location-options"
                  value={form.drop}
                  onChange={(e) => updateField('drop', e.target.value)}
                />
              </div>

              <datalist id="india-location-options">
                {INDIA_LOCATION_SUGGESTIONS.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>

              <div className="form-row">
                <div className="form-group">
                  <label>Driver Type</label>
                  <select
                    className="form-select"
                    value={form.ride}
                    onChange={(e) => updateField('ride', e.target.value)}
                  >
                    {rideOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Insurance</label>
                  <select
                    className="form-select"
                    value={form.insurance}
                    onChange={(e) => updateField('insurance', e.target.value)}
                  >
                    {insuranceOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="booking-summary">
              <div className="summary-row">
                <span className="summary-label">Distance</span>
                <span className="summary-value">{distance} km</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Travel Time</span>
                <span className="summary-value">{duration} mins</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Base Fare</span>
                <span className="summary-value">₹{fare.baseFare}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Per Km</span>
                <span className="summary-value">₹{fare.perKm}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Insurance</span>
                <span className="summary-value">₹{fare.insurance}</span>
              </div>
              <div className="summary-row summary-total">
                <span className="summary-label">Total</span>
                <span className="summary-value">₹{fare.total}</span>
              </div>
            </div>

            {bookingError && (
              <div className="book-driver-error">{bookingError}</div>
            )}

            {!isCustomerRole && authToken && (
              <div className="book-driver-error" style={{ marginTop: '10px', borderColor: 'rgba(250,204,21,0.5)', background: 'rgba(113,63,18,0.28)', color: '#fde68a' }}>
                You are logged in as <strong>{currentRole || 'non-customer'}</strong>. Switch to a customer account to book this ride.
              </div>
            )}

            {assignedRide?.driver && (
              <div className="book-driver-assigned-card">
                <div className="book-driver-assigned-head">
                  <h4>Assigned Driver Details</h4>
                  <span>Booking #{assignedRide.bookingId}</span>
                </div>
                <div className="book-driver-assigned-grid">
                  <div>
                    <span>Name</span>
                    <strong>{assignedRide.driver.name || 'Driver'}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{assignedRide.driver.phone || 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Rating</span>
                    <strong>{assignedRide.driver.rating ? `⭐ ${assignedRide.driver.rating}` : 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>
                      {assignedRide.driver.currentLocation?.city || 'Unknown'}
                      {assignedRide.driver.currentLocation?.state ? `, ${assignedRide.driver.currentLocation.state}` : ''}
                    </strong>
                  </div>
                </div>
                <p className="book-driver-assigned-otp">
                  Ride OTP: <strong>{assignedRide.otp}</strong> (share this only when the driver arrives)
                </p>
                {assignedRide.confirmationMessage && (
                  <p className="book-driver-assigned-otp">{assignedRide.confirmationMessage}</p>
                )}
                {assignedRide.invoice && (
                  <div className="booking-summary" style={{ marginTop: '16px' }}>
                    <div className="summary-row">
                      <span className="summary-label">Invoice</span>
                      <span className="summary-value">{assignedRide.invoice.invoiceId}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Subtotal</span>
                      <span className="summary-value">₹{assignedRide.invoice.subtotal}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Insurance</span>
                      <span className="summary-value">₹{assignedRide.invoice.insurance}</span>
                    </div>
                    <div className="summary-row summary-total">
                      <span className="summary-label">Paid</span>
                      <span className="summary-value">₹{assignedRide.invoice.total}</span>
                    </div>
                  </div>
                )}
                {assignedRide.id && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => navigate(`/booking-confirmation/${assignedRide.id}`)}
                    >
                      Open Confirmation Page
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleContinue}
              disabled={bookingLoading || !form.pickup.trim() || !form.drop.trim() || (authToken && !isCustomerRole)}
            >
              {bookingLoading ? 'Booking Ride...' : assignedRide?.id ? 'Track Assigned Driver' : (authToken && !isCustomerRole) ? 'Customer Access Required' : 'Confirm & Find Driver'}
            </button>

            {authToken && !isCustomerRole && (
              <button
                type="button"
                className="btn"
                style={{ marginTop: '10px', width: '100%', background: 'rgba(148,163,184,0.2)', color: '#e2e8f0' }}
                onClick={() => navigate('/login')}
              >
                Switch Account
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="book-driver-map-column"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="book-driver-map-card">
            <div className="book-driver-map-head">
              <div>
                <p>Live Route Preview</p>
                <h3>{form.pickup || 'Pickup'} to {form.drop || 'Drop'}</h3>
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
                <span>{form.ride} selected</span>
              </div>
              <div className="book-driver-map-overlay-card drop">
                <strong>{dropGeo ? 'Drop Pinned' : 'Destination'}</strong>
                <span>{dropGeo?.displayName || form.drop || 'Choose drop location'}</span>
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
                <strong>₹{fare.total}</strong>
              </div>
            </div>

            {preferredDriverId && !assignedRide?.id && (
              <div className="book-driver-selected-note">
                Preferred driver selected. If online and approved, booking will be sent to that driver first.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
