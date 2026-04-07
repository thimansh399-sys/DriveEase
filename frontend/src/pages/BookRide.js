import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/BookRide.css';
import api from '../utils/api';
import { downloadInvoicePdf } from '../utils/invoiceUtils';

const RIDE_TYPES = [
  { value: 'daily', label: '🚗 One-way Ride' },
  { value: 'hourly', label: '⏱ Hourly Driver' },
  { value: 'outstation', label: '🛣 Outstation Trip' },
];

const SERVICE_TYPES = [
  { value: 'driver_only', label: '🚗 Drive with Your Car', subtitle: 'Driver Only' },
  { value: 'car_driver', label: '🚕 Book a Car + Driver', subtitle: 'Taxi Service' },
];

const DRIVER_TYPES = [
  { value: 'standard', label: 'Standard', extra: 'Normal' },
  { value: 'experienced', label: 'Experienced', extra: '+₹20/hr' },
  { value: 'premium', label: 'Premium', extra: '+₹50/hr' },
];

const CAR_OPTIONS = [
  { value: 'mini', title: '🚗 Mini', models: 'WagonR, Alto', rate: 10, seats: '4 seats', badge: 'Most Booked' },
  { value: 'sedan', title: '🚙 Sedan', models: 'Dzire, Aura', rate: 12, seats: '4 seats', badge: 'Recommended' },
  { value: 'suv', title: '🚘 SUV', models: 'Ertiga, Innova', rate: 15, seats: '6-7 seats', badge: 'Best Value' },
];

const INSURANCE_BY_RIDE_TYPE = {
  hourly: { amount: 29, cover: '₹5 lakh accidental cover' },
  daily: { amount: 39, cover: '₹5 lakh accidental + medical' },
  outstation: { amount: 49, cover: '₹5 lakh premium travel cover' },
};

export default function BookRide() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    pickup: '',
    drop: '',
    rideType: 'daily',
  });
  const [serviceType, setServiceType] = useState('driver_only');
  const [driverType, setDriverType] = useState('standard');
  const [carCategory, setCarCategory] = useState('sedan');
  const [hourlyPackage, setHourlyPackage] = useState(4);
  const [outstationTripType, setOutstationTripType] = useState('one_way');
  const [taxiTripType, setTaxiTripType] = useState('one_way');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [success, setSuccess] = useState(null);
  const [trackedBooking, setTrackedBooking] = useState(null);
  const [trackerMessage, setTrackerMessage] = useState('');
  const [shareOtpLoading, setShareOtpLoading] = useState(false);
  const [rideQuote, setRideQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [insuranceOpted, setInsuranceOpted] = useState(false);
  const [autoFetchDriver, setAutoFetchDriver] = useState(true);
  const shouldAutoDetectPickupRef = useRef(true);

  const isDriverOnly = serviceType === 'driver_only';
  const isCarDriver = serviceType === 'car_driver';
  const isDestinationRequired = isCarDriver || form.rideType === 'daily' || form.rideType === 'outstation';
  const mapQuery = form.pickup && form.drop
    ? `${form.pickup} to ${form.drop}`
    : (form.pickup || form.drop || 'India');
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=12&output=embed`;
  const firstEmptyField = !form.name
    ? 'name'
    : !form.phone
      ? 'phone'
      : !form.pickup
        ? 'pickup'
        : '';
  const selectedInsurance = INSURANCE_BY_RIDE_TYPE[form.rideType] || INSURANCE_BY_RIDE_TYPE.daily;
  const hasPickupValue = Boolean((form.pickup || '').trim());
  const showPostPickupDetails = hasPickupValue;
  const showTaxiSteps = isCarDriver && showPostPickupDetails;
  const dynamicFindLabel = isCarDriver ? 'Find Cars' : 'Find Drivers';

  const quotePrices = [
    Number(rideQuote?.comparison?.BASIC?.estimatedPrice),
    Number(rideQuote?.comparison?.SMART?.estimatedPrice),
    Number(rideQuote?.comparison?.ELITE?.estimatedPrice),
    Number(rideQuote?.activePlan?.estimatedPrice),
  ].filter((value) => Number.isFinite(value) && value > 0);

  const minEstimatedFare = quotePrices.length ? Math.min(...quotePrices) : null;
  const maxEstimatedFare = quotePrices.length ? Math.max(...quotePrices) : null;
  const availableDriverCount = Number(rideQuote?.driverPool?.totalAvailable || 0);
  const carsAvailableCount = Number(rideQuote?.realtimePreview?.carsAvailableNearby || 0);
  const pickupEtaMinutes = Number(rideQuote?.realtimePreview?.pickupEtaMinutes || 6);
  const showNoDriverSuggestion = isDriverOnly && showPostPickupDetails && availableDriverCount === 0 && !quoteLoading;

  const handleFindDrivers = () => {
    if (!hasPickupValue) {
      setError('Please enter pickup location first.');
      return;
    }
    setError('');
    if (!pickupCoords && !geoLoading) {
      requestPickupGeolocation();
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const search = new URLSearchParams(location.search || '');
    const draftPickup = search.get('pickup') || '';
    const draftDrop = search.get('drop') || '';
    const draftRideType = search.get('rideType') || '';
    const draftServiceType = search.get('serviceType') || '';
    const draftDriverType = search.get('driverType') || '';
    const draftCarCategory = search.get('carCategory') || '';
    const draftTotalHours = Number(search.get('totalHours'));
    const draftTripType = search.get('tripType') || '';
    const pickupLatFromQuery = Number(search.get('pickupLat'));
    const pickupLngFromQuery = Number(search.get('pickupLng'));
    const pendingDraftRaw = localStorage.getItem('pendingRideDraft');
    let pendingDraft = null;

    if (pendingDraftRaw) {
      try {
        pendingDraft = JSON.parse(pendingDraftRaw);
      } catch (_) {
        pendingDraft = null;
      }
      localStorage.removeItem('pendingRideDraft');
    }

    const seedPickup = draftPickup || pendingDraft?.pickup || '';
    const seedDrop = draftDrop || pendingDraft?.drop || '';
    const seedRideType = draftRideType || pendingDraft?.rideType || '';
    const seedServiceType = draftServiceType || pendingDraft?.serviceType || '';
    const seedDriverType = draftDriverType || pendingDraft?.driverType || '';
    const seedCarCategory = draftCarCategory || pendingDraft?.carCategory || '';
    const seedTripType = draftTripType || pendingDraft?.tripType || '';
    const seedTotalHours = Number.isFinite(draftTotalHours) && draftTotalHours > 0
      ? draftTotalHours
      : Number(pendingDraft?.totalHours || 0);
    const pendingPickupLat = Number(pendingDraft?.pickupPlace?.lat);
    const pendingPickupLng = Number(pendingDraft?.pickupPlace?.lng);

    const finalPickupLat = Number.isFinite(pickupLatFromQuery) ? pickupLatFromQuery : pendingPickupLat;
    const finalPickupLng = Number.isFinite(pickupLngFromQuery) ? pickupLngFromQuery : pendingPickupLng;

    if (Number.isFinite(finalPickupLat) && Number.isFinite(finalPickupLng)) {
      shouldAutoDetectPickupRef.current = false;
      setPickupCoords({
        latitude: finalPickupLat,
        longitude: finalPickupLng,
      });
    }

    if (!stored) {
      if (seedPickup || seedDrop) {
        setForm((prev) => ({
          ...prev,
          pickup: seedPickup,
          drop: seedDrop,
          rideType: ['hourly', 'daily', 'outstation'].includes(seedRideType) ? seedRideType : prev.rideType,
        }));
      }
      if (seedTotalHours === 2 || seedTotalHours === 4) {
        setHourlyPackage(seedTotalHours);
      }
      if (seedTripType === 'one_way' || seedTripType === 'round_trip') {
        setOutstationTripType(seedTripType);
        setTaxiTripType(seedTripType);
      }
      if (seedServiceType === 'driver_only' || seedServiceType === 'car_driver') {
        setServiceType(seedServiceType);
      }
      if (['standard', 'experienced', 'premium'].includes(seedDriverType)) {
        setDriverType(seedDriverType);
      }
      if (['mini', 'sedan', 'suv'].includes(seedCarCategory)) {
        setCarCategory(seedCarCategory);
      }
      return;
    }

    const parsed = JSON.parse(stored);
    setUser(parsed);
    setForm((prev) => ({
      ...prev,
      name: parsed?.name || '',
      phone: parsed?.phone || '',
      pickup: seedPickup || prev.pickup,
      drop: seedDrop || prev.drop,
      rideType: ['hourly', 'daily', 'outstation'].includes(seedRideType) ? seedRideType : prev.rideType,
    }));

    if (seedTotalHours === 2 || seedTotalHours === 4 || seedTotalHours === 8) {
      setHourlyPackage(seedTotalHours);
    }

    if (seedTripType === 'one_way' || seedTripType === 'round_trip') {
      setOutstationTripType(seedTripType);
      setTaxiTripType(seedTripType);
    }

    if (seedServiceType === 'driver_only' || seedServiceType === 'car_driver') {
      setServiceType(seedServiceType);
    }

    if (['standard', 'experienced', 'premium'].includes(seedDriverType)) {
      setDriverType(seedDriverType);
    }

    if (['mini', 'sedan', 'suv'].includes(seedCarCategory)) {
      setCarCategory(seedCarCategory);
    }
  }, [location.search]);

  const requestPickupGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported in this browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setGeoError('Location permission denied. Please allow location to assign nearest driver.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (shouldAutoDetectPickupRef.current) {
      requestPickupGeolocation();
    }
  }, []);

  useEffect(() => {
    if (!form.pickup) {
      setRideQuote(null);
      setQuoteError('');
      return undefined;
    }

    const effectiveDrop = form.drop || form.pickup;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError('');
      try {
        const response = await api.getRideQuote({
          pickup: form.pickup,
          drop: effectiveDrop,
          serviceType,
          driverType,
          carCategory,
          tripType: isCarDriver ? taxiTripType : outstationTripType,
          rideType: form.rideType,
          totalHours: form.rideType === 'hourly' ? hourlyPackage : undefined,
          pickupLatitude: pickupCoords?.latitude,
          pickupLongitude: pickupCoords?.longitude,
          insuranceOpted,
          insuranceAmount: insuranceOpted ? selectedInsurance.amount : 0,
        });

        if (cancelled) return;
        if (response?.error) {
          setRideQuote(null);
          setQuoteError(response.error);
        } else {
          setRideQuote(response?.quote || null);
        }
      } catch (err) {
        if (cancelled) return;
        setRideQuote(null);
        setQuoteError(err?.message || 'Unable to fetch quote right now.');
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.pickup, form.drop, form.rideType, serviceType, driverType, carCategory, taxiTripType, outstationTripType, hourlyPackage, isDestinationRequired, isCarDriver, pickupCoords?.latitude, pickupCoords?.longitude, insuranceOpted, selectedInsurance.amount]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBooking = async () => {
    if (!form.name || !form.phone || !form.pickup) {
      setError('Please fill required fields (name, phone, pickup).');
      return;
    }

    if (isCarDriver && !form.drop) {
      setError('Destination is mandatory for Car + Driver.');
      return;
    }

    if (isDestinationRequired && !form.drop) {
      setError('Please enter destination for this ride type.');
      return;
    }

    const effectiveDrop = form.drop || form.pickup;

    if (!pickupCoords) {
      setError('Please allow location access. Pickup geolocation is mandatory for nearest driver assignment.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await api.bookNow({
        pickup: form.pickup,
        drop: effectiveDrop,
        serviceType,
        driverType,
        carCategory,
        rideType: form.rideType,
        totalHours: form.rideType === 'hourly' ? hourlyPackage : undefined,
        tripType: isCarDriver ? taxiTripType : (form.rideType === 'outstation' ? outstationTripType : 'one_way'),
        autoFetchDriver,
        pickupLatitude: pickupCoords.latitude,
        pickupLongitude: pickupCoords.longitude,
        insuranceOpted,
        insuranceAmount: insuranceOpted ? selectedInsurance.amount : 0,
      });

      if (data?.booking?._id || data?.booking?.bookingId) {
        setSuccess(data);
        setTrackedBooking(data.booking);
        setTrackerMessage('Assigning Driver Soon...');
      } else {
        setError(data?.error || data?.message || 'Booking failed');
      }
    } catch (err) {
      setError(err?.message || 'Server Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bookingId = success?.booking?._id;
    if (!bookingId) return undefined;

    let mounted = true;

    const refreshBooking = async () => {
      try {
        const detail = await api.getBookingById(bookingId);
        if (!mounted || detail?.error) return;

        setTrackedBooking(detail);

        const status = String(detail.status || '').toLowerCase();
        if (status === 'pending') {
          setTrackerMessage('Assigning Driver Soon...');
        } else if (status === 'confirmed') {
          setTrackerMessage('Driver accepted your ride. Wait for arrival at pickup.');
        } else if (status === 'driver_arrived') {
          setTrackerMessage('Driver reached pickup. Share OTP to start ride.');
        } else if (status === 'in_progress') {
          setTrackerMessage('Ride started successfully.');
        } else if (status === 'completed') {
          setTrackerMessage('Ride completed.');
        }
      } catch (_) {
        // Keep previous tracker state on transient network issues.
      }
    };

    refreshBooking();
    const timer = setInterval(refreshBooking, 8000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [success?.booking?._id]);

  const handleShareOtp = async () => {
    const bookingId = trackedBooking?._id || success?.booking?._id;
    if (!bookingId) return;

    try {
      setShareOtpLoading(true);
      setTrackerMessage('Sharing OTP with driver...');
      const response = await api.shareBookingOtp(bookingId);
      if (response?.error) {
        setTrackerMessage(response.error);
      } else {
        setTrackerMessage('OTP shared with driver. Driver can start ride now.');
        const detail = await api.getBookingById(bookingId);
        if (!detail?.error) setTrackedBooking(detail);
      }
    } catch (err) {
      setTrackerMessage(err?.message || 'Unable to share OTP right now.');
    } finally {
      setShareOtpLoading(false);
    }
  };

  if (success) {
    const live = trackedBooking || success.booking || {};
    const liveStatus = String(live.status || success.booking?.status || '').toLowerCase();
    const driverInfo = live.driver || live.driverId || success.booking?.driver || null;
    const pickupAddress = live.pickupLocation?.address || success.booking?.pickup || '-';
    const dropAddress = live.dropLocation?.address || success.booking?.drop || '-';
    const canShareOtp = liveStatus === 'driver_arrived' && !live.verification?.otpSharedWithDriver;
    const successSubtitle = liveStatus === 'pending'
      ? 'Assigning Driver Soon...'
      : (success.message || 'Ride request submitted successfully.');

    return (
      <div className="book-ride-page">
        <div className="book-ride-card book-ride-success-card book-ride-reveal">
          <div className="book-ride-success-badge">Booking Confirmed</div>
          <div className="book-ride-success-icon">✅</div>
          <h2>Ride Booked!</h2>
          <p className="book-ride-subtitle">{successSubtitle}</p>

          <div className="book-ride-success-panel">
            <p><b>Booking ID:</b> {live.bookingId || success.booking?.bookingId}</p>
            <p><b>Pickup:</b> {pickupAddress}</p>
            <p><b>Drop:</b> {dropAddress}</p>
            <p><b>Service:</b> {success.booking?.serviceType === 'car_driver' ? 'Car + Driver' : 'Driver Only'}</p>
            {success.booking?.driverType ? <p><b>Driver Type:</b> {success.booking.driverType}</p> : null}
            {success.booking?.carCategory ? <p><b>Car:</b> {success.booking.carCategory}</p> : null}
            <p><b>Ride Type:</b> {success.booking?.rideType || live.bookingType || '-'}</p>
            <p><b>Status:</b> <span className="book-ride-status">{live.status || success.booking?.status}</span></p>
            <p><b>Ride Insurance:</b> {live.insuranceOpted || success.booking?.insuranceOpted ? `Enabled (₹${live.insuranceAmount || selectedInsurance.amount})` : 'Not selected'}</p>
            {driverInfo && (
              <p><b>Driver:</b> {driverInfo.name} - {driverInfo.phone}</p>
            )}
            <p className="book-ride-otp">AI Secure OTP: {success.booking?.otp || live.verification?.otp || '-'}</p>
            <p className="book-ride-otp-hint">Share this OTP with your driver to start the ride</p>
            <div className="book-ride-assigning-status" style={{ marginTop: 10 }}>
              {liveStatus === 'pending' ? <span className="book-ride-assigning-dot" /> : null}
              <p style={{ margin: 0, color: '#86efac', fontWeight: 600 }}>{trackerMessage}</p>
            </div>

            {canShareOtp && (
              <button
                type="button"
                className="book-ride-submit"
                onClick={handleShareOtp}
                disabled={shareOtpLoading}
                style={{ marginTop: 12 }}
              >
                {shareOtpLoading ? 'Sharing OTP...' : '🔐 Share OTP With Driver'}
              </button>
            )}

            {live.verification?.otpSharedWithDriver && liveStatus !== 'in_progress' && (
              <p style={{ marginTop: 10, color: '#c4b5fd', fontWeight: 600 }}>
                OTP shared. Driver can now enter OTP and start trip.
              </p>
            )}
          </div>

          <div className="book-ride-success-actions">
            <button className="book-ride-secondary" onClick={() => setSuccess(null)}>
              Book Another Ride
            </button>
            {!!(live._id || success.booking?._id) && (
              <button
                className="book-ride-secondary"
                onClick={() => navigate(`/track-booking/${live._id || success.booking?._id}`)}
              >
                📍 Track Live Ride
              </button>
            )}
            <button className="book-ride-submit" onClick={() => navigate('/customer-dashboard')}>
              Back to Dashboard
            </button>
            {String(liveStatus || '').toLowerCase() === 'completed' && live.invoice ? (
              <button
                className="book-ride-submit"
                onClick={() => downloadInvoicePdf(live, 'customer')}
              >
                Download Invoice PDF
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="book-ride-page">
      <div className="book-ride-layout">
        <div className="book-ride-card book-ride-reveal">
          <button className="book-ride-back book-ride-reveal delay-1" onClick={() => navigate('/customer-dashboard')}>
            &larr; Back
          </button>

          <h2 className="book-ride-reveal delay-1">🚗 Book Your Ride</h2>
          {user && <p className="book-ride-subtitle book-ride-reveal delay-2">Hi {user.name}, where do you want to go?</p>}

          <div className="book-ride-types book-ride-service-types book-ride-reveal delay-2">
            {SERVICE_TYPES.map(({ value, label, subtitle }) => (
              <button
                key={value}
                onClick={() => setServiceType(value)}
                className={`book-ride-type-btn ${serviceType === value ? 'active' : ''}`}
              >
                <span>{label}</span>
                <small>{subtitle}</small>
              </button>
            ))}
          </div>

          {isDriverOnly && (
            <div className="book-ride-types book-ride-reveal delay-2">
              {RIDE_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setForm((prev) => ({ ...prev, rideType: value }))}
                  className={`book-ride-type-btn ${form.rideType === value ? 'active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="book-ride-input-group book-ride-reveal delay-2">
            <input
              name="pickup"
              placeholder="Pickup Location"
              value={form.pickup}
              onChange={handleChange}
              className="book-ride-input"
              autoFocus={firstEmptyField === 'pickup'}
            />

            {(isCarDriver || form.rideType !== 'hourly') && (
              <input
                name="drop"
                placeholder={isCarDriver ? 'Destination (required)' : 'Destination'}
                value={form.drop}
                onChange={handleChange}
                className="book-ride-input"
              />
            )}
          </div>

          <button
            type="button"
            className="book-ride-submit book-ride-reveal delay-3"
            onClick={handleFindDrivers}
            disabled={geoLoading}
          >
            {geoLoading ? 'Searching...' : dynamicFindLabel}
          </button>

          {showPostPickupDetails && (
            <div className="book-ride-progressive-section book-ride-reveal delay-3">
              <button
                type="button"
                className="book-ride-secondary"
                onClick={requestPickupGeolocation}
                disabled={geoLoading}
              >
                {geoLoading ? 'Getting Location...' : '📍 Use current location'}
              </button>

              <div className="book-ride-quick-stats">
                <p className="book-ride-quick-item">
                  <span>{isCarDriver ? '⚡ Cars available nearby' : '⚡ Drivers nearby'}</span>
                  <b>
                    {quoteLoading
                      ? 'Finding...'
                      : `${isCarDriver ? carsAvailableCount : availableDriverCount || 0} available`}
                  </b>
                </p>
                <p className="book-ride-quick-item">
                  <span>💰 Estimated Fare</span>
                  <b>
                    {minEstimatedFare && maxEstimatedFare
                      ? `₹${minEstimatedFare} - ₹${maxEstimatedFare}`
                      : 'Calculating...'}
                  </b>
                </p>
                <p className="book-ride-quick-item">
                  <span>⏱ Pickup in</span>
                  <b>{quoteLoading ? '...' : `${pickupEtaMinutes} mins`}</b>
                </p>
              </div>

              {isDriverOnly && (
                <div className="book-ride-driver-types">
                  {DRIVER_TYPES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`book-ride-driver-type-btn ${driverType === option.value ? 'active' : ''}`}
                      onClick={() => setDriverType(option.value)}
                    >
                      <span>{option.label}</span>
                      <small>{option.extra}</small>
                    </button>
                  ))}
                </div>
              )}

              {isDriverOnly && form.rideType === 'hourly' && (
                <div className="book-ride-hourly-packages">
                  <button
                    type="button"
                    className={`book-ride-hourly-btn ${hourlyPackage === 2 ? 'active' : ''}`}
                    onClick={() => setHourlyPackage(2)}
                  >
                    Hire for 2 hours
                  </button>
                  <button
                    type="button"
                    className={`book-ride-hourly-btn ${hourlyPackage === 4 ? 'active' : ''}`}
                    onClick={() => setHourlyPackage(4)}
                  >
                    Hire for 4 hours
                  </button>
                  <button
                    type="button"
                    className={`book-ride-hourly-btn ${hourlyPackage === 8 ? 'active' : ''}`}
                    onClick={() => setHourlyPackage(8)}
                  >
                    Hire for 8 hours
                  </button>
                </div>
              )}

              {isDriverOnly && form.rideType === 'outstation' && (
                <div className="book-ride-hourly-packages">
                  <button
                    type="button"
                    className={`book-ride-hourly-btn ${outstationTripType === 'one_way' ? 'active' : ''}`}
                    onClick={() => setOutstationTripType('one_way')}
                  >
                    One-way
                  </button>
                  <button
                    type="button"
                    className={`book-ride-hourly-btn ${outstationTripType === 'round_trip' ? 'active' : ''}`}
                    onClick={() => setOutstationTripType('round_trip')}
                  >
                    Round trip
                  </button>
                </div>
              )}

              {showTaxiSteps && (
                <>
                  <div className="book-ride-hourly-packages">
                    <button
                      type="button"
                      className={`book-ride-hourly-btn ${taxiTripType === 'one_way' ? 'active' : ''}`}
                      onClick={() => setTaxiTripType('one_way')}
                    >
                      One-way
                    </button>
                    <button
                      type="button"
                      className={`book-ride-hourly-btn ${taxiTripType === 'round_trip' ? 'active' : ''}`}
                      onClick={() => setTaxiTripType('round_trip')}
                    >
                      Round trip
                    </button>
                  </div>

                  <div className="book-ride-car-grid">
                    {CAR_OPTIONS.map((car) => (
                      <button
                        key={car.value}
                        type="button"
                        className={`book-ride-car-card ${carCategory === car.value ? 'active' : ''}`}
                        onClick={() => setCarCategory(car.value)}
                      >
                        <div className="book-ride-car-badge">⭐ {car.badge}</div>
                        <h4>{car.title}</h4>
                        <p>{car.models}</p>
                        <div className="book-ride-car-meta">💰 ₹{car.rate}/km</div>
                        <div className="book-ride-car-meta">👤 {car.seats}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {showNoDriverSuggestion && (
                <div className="book-ride-smart-suggestion">
                  😕 No drivers nearby. Try booking a car instead.
                  <button
                    type="button"
                    className="book-ride-secondary"
                    style={{ marginTop: 10 }}
                    onClick={() => setServiceType('car_driver')}
                  >
                    Switch to Car + Driver
                  </button>
                </div>
              )}

              <div className="book-ride-input-group">
                <input
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  className="book-ride-input"
                  autoFocus={firstEmptyField === 'name'}
                />
                <input
                  name="phone"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={handleChange}
                  className="book-ride-input"
                  autoFocus={firstEmptyField === 'phone'}
                />
              </div>
            </div>
          )}

          {showPostPickupDetails && (
            <div className="book-ride-quote-card">
              <div className="book-ride-quote-head">
                <h4>Plan Based Estimate</h4>
                {quoteLoading ? <span>Updating...</span> : null}
              </div>

              {quoteError ? <p className="book-ride-quote-error">{quoteError}</p> : null}

              {rideQuote?.activePlan ? (
                <>
                  <div className="book-ride-quote-grid">
                    <div>
                      <label>Active Plan</label>
                      <b>{rideQuote.activePlan.label}</b>
                    </div>
                    <div>
                      <label>Estimated Price</label>
                      <b>₹{rideQuote.activePlan.estimatedPrice}</b>
                    </div>
                    <div>
                      <label>Driver Priority</label>
                      <b>{rideQuote.activePlan.priorityBadge}</b>
                    </div>
                    <div>
                      <label>Driver Quality</label>
                      <b>{rideQuote.activePlan.driverQuality}</b>
                    </div>
                  </div>

                  <div className="book-ride-plan-strip">
                    <span>BASIC ₹{rideQuote.comparison?.BASIC?.estimatedPrice ?? '-'}</span>
                    <span>SMART ₹{rideQuote.comparison?.SMART?.estimatedPrice ?? '-'}</span>
                    <span>ELITE ₹{rideQuote.comparison?.ELITE?.estimatedPrice ?? '-'}</span>
                  </div>

                  {rideQuote?.recommendUpgrade?.message ? (
                    <div className="book-ride-upgrade-popup">
                      {rideQuote.recommendUpgrade.message}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="book-ride-quote-placeholder">
                  Enter pickup to see live quote. Destination is optional.
                </p>
              )}
            </div>
          )}

          {showPostPickupDetails && (
            <>
              <div className="book-ride-insurance-card">
                <div className="book-ride-insurance-head">
                  <h4>Per Ride Insurance</h4>
                  <label className="book-ride-insurance-toggle">
                    <input
                      type="checkbox"
                      checked={insuranceOpted}
                      onChange={(event) => setInsuranceOpted(event.target.checked)}
                    />
                    <span>{insuranceOpted ? 'Added' : 'Add'}</span>
                  </label>
                </div>

                <p className="book-ride-insurance-copy">
                  Protect this ride with <strong>{selectedInsurance.cover}</strong> for just <strong>₹{selectedInsurance.amount}</strong>.
                </p>
                <p className="book-ride-insurance-copy">
                  Insurance partner support available during active ride and claim follow-up.
                </p>

                <div className="book-ride-insurance-links">
                  <a href="/insurance">View DriveEase Insurance Plans</a>
                  <a href="https://www.icicilombard.com/" target="_blank" rel="noreferrer">Insurance Company Partner</a>
                  <a href="https://www.icicilombard.com/claims" target="_blank" rel="noreferrer">Claims Portal</a>
                </div>
              </div>

              <div className="book-ride-insurance-card">
                <div className="book-ride-insurance-head">
                  <h4>Driver Auto-Fetch</h4>
                  <label className="book-ride-insurance-toggle">
                    <input
                      type="checkbox"
                      checked={autoFetchDriver}
                      onChange={(event) => setAutoFetchDriver(event.target.checked)}
                    />
                    <span>{autoFetchDriver ? 'On' : 'Off'}</span>
                  </label>
                </div>
                <p className="book-ride-insurance-copy">
                  Keep this ON to auto-assign nearest available driver immediately after booking.
                </p>
              </div>
            </>
          )}

          {showPostPickupDetails && geoError ? <div className="book-ride-error">{geoError}</div> : null}

          {error && <div className="book-ride-error book-ride-reveal delay-3">{error}</div>}

          {showPostPickupDetails && (
            <button className="book-ride-submit book-ride-reveal delay-3" onClick={handleBooking} disabled={loading}>
              {loading ? 'Booking...' : (isCarDriver ? '🚕 Find Cars' : '🚗 Find Drivers')}
            </button>
          )}
        </div>

        <aside className="book-ride-map-card book-ride-reveal delay-2">
          <h3>Live Route Preview</h3>

          <div className="book-ride-map-frame-wrap">
            <iframe
              title="Ride route map"
              src={mapUrl}
              loading="lazy"
              allowFullScreen
              className="book-ride-map-frame"
            />
          </div>

          <div className="book-ride-map-summary">
            <p><span>Pickup</span><b>{form.pickup || 'Not set'}</b></p>
            <p><span>Drop</span><b>{form.drop || 'Not set'}</b></p>
            <p><span>Ride Type</span><b>{form.rideType}</b></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
