import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import '../styles/UnifiedUI.css';
import '../styles/EnhancedAnimations.css';
import { buildAssetUrl } from '../utils/network';
import { connectRideSocket } from '../utils/rideSocket';

/**
 * Track Booking Page
 * Live tracking of driver location, ETA, and ride status
 */
export default function TrackBooking() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const mapContainer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState(null);
  const [error, setError] = useState('');
  const [driverLocation, setDriverLocation] = useState({ lat: 26.9124, lng: 75.7873 });
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);

  const statusText = {
    pending: 'Booking pending. Waiting for driver response.',
    confirmed: 'Driver accepted your ride. Share the OTP only after pickup confirmation.',
    driver_assigned: 'Driver assigned. Tracking live location.',
    driver_arrived: 'Driver arrived near pickup. Share OTP to start the ride.',
    otp_verified: 'OTP verified. Ride is being started.',
    in_progress: 'Ride in progress. Enjoy your trip safely.',
    ON_TRIP: 'Ride in progress. Enjoy your trip safely.',
    completed: 'Ride completed successfully.',
    cancelled: 'Booking was cancelled.',
  };

  useEffect(() => {
    let isMounted = true;
    let initialLoad = true;

    const buildFallbackData = () => {
      const pickup = searchParams.get('pickup') || 'Pickup not provided';
      const drop = searchParams.get('drop') || 'Drop not provided';
      const ride = searchParams.get('ride') || 'Standard';
      return {
        id: bookingId || 'LIVE-TRACK',
        status: 'pending',
        pickup: { address: pickup, lat: 26.9124, lng: 75.7873 },
        dropoff: { address: drop, lat: 26.8389, lng: 75.8753 },
        driver: null,
        estimatedTime: 10,
        distance: 0,
        fare: ride === 'Corporate' ? 260 : ride === 'Premium' ? 180 : 120,
        paymentStatus: 'completed',
        verification: { otp: null, otpVerified: false },
        invoice: null,
      };
    };

    const mapBooking = (booking, trackPayload) => {
      const pickup = booking?.pickupLocation || {};
      const dropoff = booking?.dropLocation || {};
      const driver = booking?.driverId || null;
      const estimatedDistance = Number(booking?.estimatedDistance || 0);
      const invoice = booking?.invoice || {
        invoiceId: `INV-${booking?.bookingId || booking?._id || 'LIVE'}`,
        subtotal: Number(booking?.estimatedPrice || 0),
        insurance: Number(booking?.insuranceAmount || 0),
        total: Number(booking?.finalPrice || booking?.estimatedPrice || 0),
        paymentStatus: booking?.paymentStatus || 'completed',
        paymentMethod: booking?.paymentMethod || 'upi',
      };

      return {
        id: booking?.bookingId || booking?._id || bookingId,
        status: booking?.status || 'pending',
        pickup: {
          address: pickup.address || 'Pickup not available',
          lat: Number(pickup.latitude) || 26.9124,
          lng: Number(pickup.longitude) || 75.7873,
        },
        dropoff: {
          address: dropoff.address || 'Drop not available',
          lat: Number(dropoff.latitude) || 26.8389,
          lng: Number(dropoff.longitude) || 75.8753,
        },
        driver: driver
          ? {
              name: driver.name || 'Assigned Driver',
              phone: driver.phone || 'N/A',
              rating: Number(driver.rating?.averageRating || driver.rating || 0),
              vehicle: {
                name: driver.vehicle?.model || 'Vehicle not set',
                plate: driver.vehicle?.registrationNumber || 'N/A',
              },
              avatar: driver.profilePicture ? buildAssetUrl(driver.profilePicture) : null,
              location: {
                lat: Number(driver.currentLocation?.latitude),
                lng: Number(driver.currentLocation?.longitude),
              },
            }
          : null,
        estimatedTime: Math.max(3, Math.round(estimatedDistance * 2) || 8),
        distance: Number(trackPayload?.booking?.distance || booking?.distance || estimatedDistance || 0),
        fare: Number(trackPayload?.booking?.fare || booking?.fare || booking?.finalPrice || booking?.estimatedPrice || 0),
        fareRatePerKm: Number(trackPayload?.booking?.fareRatePerKm || booking?.fareRatePerKm || 15),
        rideStartTime: trackPayload?.booking?.rideStartTime || booking?.rideStartTime || booking?.rideCompletion?.actualStartTime || null,
        paymentStatus: booking?.paymentStatus || 'completed',
        verification: {
          otp: booking?.verification?.otp || null,
          otpVerified: Boolean(booking?.verification?.otpVerified),
          otpExpiry: booking?.verification?.otpExpiry || null,
        },
        invoice,
      };
    };

    const loadBooking = async () => {
      try {
        if (initialLoad) setLoading(true);
        setError('');

        if (!bookingId) {
          if (isMounted) setBookingData(buildFallbackData());
          return;
        }

        const response = await api.getBookingById(bookingId);
        const trackResponse = await api.trackRideByBooking(bookingId).catch(() => null);

        if (!response || response.error) {
          throw new Error(response?.error || 'Booking not found');
        }

        if (isMounted) {
          const mapped = mapBooking(response, trackResponse);
          setBookingData(mapped);
          const trackedLat = Number(trackResponse?.driverLocation?.latitude);
          const trackedLng = Number(trackResponse?.driverLocation?.longitude);

          if (Number.isFinite(trackedLat) && Number.isFinite(trackedLng)) {
            setDriverLocation({ lat: trackedLat, lng: trackedLng });
          } else if (Number.isFinite(mapped.driver?.location?.lat) && Number.isFinite(mapped.driver?.location?.lng)) {
            setDriverLocation({ lat: mapped.driver.location.lat, lng: mapped.driver.location.lng });
          } else {
            setDriverLocation({ lat: mapped.pickup.lat, lng: mapped.pickup.lng });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load tracking details.');
          setBookingData(buildFallbackData());
        }
      } finally {
        if (isMounted && initialLoad) {
          setLoading(false);
          initialLoad = false;
        }
      }
    };

    loadBooking();
    const interval = setInterval(loadBooking, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [bookingId, searchParams]);

  useEffect(() => {
    if (!bookingId) {
      return undefined;
    }

    const socket = connectRideSocket(bookingId);
    socketRef.current = socket;

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    const handleLocation = (payload = {}) => {
      const lat = Number(payload.latitude);
      const lng = Number(payload.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setDriverLocation({ lat, lng });
      }

      setBookingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          distance: Number.isFinite(Number(payload.distance)) ? Number(payload.distance) : prev.distance,
          fare: Number.isFinite(Number(payload.fare)) ? Number(payload.fare) : prev.fare,
          status: payload.status || prev.status,
        };
      });
    };

    socket.on('driver_location_update', handleLocation);
    socket.on('location_update', handleLocation);
    socket.on('ride_started', (payload = {}) => {
      if (String(payload.bookingId || '') === String(bookingId)) {
        setBookingData((prev) => (prev ? { ...prev, status: 'in_progress', rideStartTime: payload.startedAt || prev.rideStartTime } : prev));
      }
    });
    socket.on('ride_ended', (payload = {}) => {
      if (String(payload.bookingId || '') === String(bookingId)) {
        setBookingData((prev) => (prev ? { ...prev, status: 'completed', distance: payload.distance || prev.distance, fare: payload.fare || prev.fare } : prev));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [bookingId]);

  useEffect(() => {
    if (!mapContainer.current || !bookingData) return;

    const canvas = document.createElement('canvas');
    canvas.width = mapContainer.current.clientWidth;
    canvas.height = mapContainer.current.clientHeight;
    const ctx = canvas.getContext('2d');

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1f2e');
    gradient.addColorStop(1, '#0b0f19');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw street grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Normalize coordinates
    const latRange = bookingData.dropoff.lat - bookingData.pickup.lat || 0.01;
    const lngRange = bookingData.dropoff.lng - bookingData.pickup.lng || 0.01;
    const padding = 80;

    const getPixel = (lat, lng) => {
      const x = padding + ((lng - bookingData.pickup.lng) / lngRange) * (canvas.width - 2 * padding);
      const y = canvas.height - padding - ((lat - bookingData.pickup.lat) / latRange) * (canvas.height - 2 * padding);
      return { x, y };
    };

    const pickupPx = getPixel(bookingData.pickup.lat, bookingData.pickup.lng);
    const dropoffPx = getPixel(bookingData.dropoff.lat, bookingData.dropoff.lng);
    const driverPx = getPixel(driverLocation.lat, driverLocation.lng);

    // Draw route
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(pickupPx.x, pickupPx.y);
    ctx.lineTo(dropoffPx.x, dropoffPx.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw traveled path
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pickupPx.x, pickupPx.y);
    ctx.lineTo(driverPx.x, driverPx.y);
    ctx.stroke();

    // Pickup marker
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(pickupPx.x, pickupPx.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dropoff marker
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.arc(dropoffPx.x, dropoffPx.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Driver marker with animated glow
    ctx.shadowColor = 'rgba(255, 107, 53, 0.6)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.arc(driverPx.x, driverPx.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Direction arrow
    const angle = Math.atan2(dropoffPx.y - driverPx.y, dropoffPx.x - driverPx.x);
    ctx.save();
    ctx.translate(driverPx.x, driverPx.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Labels
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('📍 Pickup', pickupPx.x - 30, pickupPx.y - 25);

    ctx.fillStyle = '#93c5fd';
    ctx.fillText('📍 Dropoff', dropoffPx.x - 35, dropoffPx.y - 25);

    ctx.fillStyle = '#ff6b35';
    ctx.fillText('🚗 Driver', driverPx.x - 30, driverPx.y - 25);

    mapContainer.current.innerHTML = '';
    mapContainer.current.appendChild(canvas);
  }, [bookingData, driverLocation]);

  if (loading) {
    return (
      <motion.div
        className="ux-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(34, 197, 94, 0.2)',
            borderTop: '4px solid #22c55e',
            borderRadius: '50%',
          }}
        />
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="ux-page">
        <div className="ux-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="ux-alert error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="ux-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '0' }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '20px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '20px' }}
        >
          <h1 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '28px' }}>
            Track Your Ride
          </h1>
          <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
            Booking ID: {bookingData?.id}
          </p>
        </motion.div>

        {/* Main Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            backgroundColor: '#0b0f19',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            ref={mapContainer}
            style={{
              width: '100%',
              height: '420px',
              backgroundColor: '#1a1f2e',
              position: 'relative',
            }}
          />
        </motion.div>

        {/* Driver Info Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '20px',
          }}
        >
          {/* Left: Driver Details */}
          <div
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              {bookingData?.driver?.avatar ? (
                <motion.img
                  src={bookingData.driver.avatar}
                  alt={bookingData.driver.name || 'Driver'}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '2px solid #22c55e',
                  }}
                  whileHover={{ scale: 1.05 }}
                />
              ) : (
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    background: '#20293a',
                    border: '2px solid #22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#22c55e',
                  }}
                >
                  {bookingData?.driver?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '18px' }}>
                  {bookingData?.driver?.name || 'Driver will be assigned soon'}
                </h3>
                <p style={{ margin: 0, color: '#93c5fd', fontSize: '13px' }}>
                  {bookingData?.driver
                    ? `⭐ ${bookingData.driver.rating || 0} • ${bookingData.driver.vehicle.name}`
                    : 'Waiting for assignment'}
                </p>
                <p style={{ margin: '4px 0 0 0', color: '#aaa', fontSize: '12px' }}>
                  {bookingData?.driver?.vehicle?.plate || 'No vehicle details yet'}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
              <p style={{ margin: '0 0 12px 0', color: '#aaa', fontSize: '12px', textTransform: 'uppercase' }}>
                Driver Details
              </p>
              <a
                href={bookingData?.driver?.phone ? `tel:${bookingData.driver.phone.replace(/\s/g, '')}` : '#'}
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  backgroundColor: 'rgba(147, 197, 253, 0.1)',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  color: '#93c5fd',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginRight: '8px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(147, 197, 253, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(147, 197, 253, 0.1)';
                }}
              >
                📞 Call Driver
              </a>
              <button
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'rgba(147, 197, 253, 0.1)',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  color: '#93c5fd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(147, 197, 253, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(147, 197, 253, 0.1)';
                }}
              >
                💬 Send Message
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <motion.div
              whileHover={{ y: -4 }}
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <p style={{ margin: '0 0 8px 0', color: '#aaa', fontSize: '12px', textTransform: 'uppercase' }}>
                Booking Status
              </p>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e', marginBottom: '8px' }}>
                {String(bookingData?.status || 'pending').replace(/_/g, ' ').toUpperCase()}
              </div>
              <p style={{ margin: 0, color: '#d1fae5', fontSize: '13px' }}>
                {statusText[bookingData?.status] || 'Tracking your booking in real-time.'}
              </p>
              <p style={{ margin: '12px 0 0 0', color: '#aaa', fontSize: '12px' }}>
                ETA {bookingData?.estimatedTime || '--'} mins • Distance {bookingData?.distance || 0} km • Payment {bookingData?.paymentStatus || 'completed'}
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#93c5fd', fontSize: '12px' }}>
                {socketConnected ? 'Live socket connected' : 'Live socket reconnecting, polling every 10s'}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <p style={{ margin: '0 0 8px 0', color: '#aaa', fontSize: '12px', textTransform: 'uppercase' }}>
                Ride Progress
              </p>
              <p style={{ margin: '4px 0', color: '#dbeafe', fontSize: '13px' }}>
                1. Assigned {['driver_assigned', 'confirmed', 'driver_arrived', 'in_progress', 'ON_TRIP', 'completed'].includes(bookingData?.status) ? '✓' : '•'}
              </p>
              <p style={{ margin: '4px 0', color: '#dbeafe', fontSize: '13px' }}>
                2. On Trip {['in_progress', 'ON_TRIP', 'completed'].includes(bookingData?.status) ? '✓' : '•'}
              </p>
              <p style={{ margin: '4px 0', color: '#dbeafe', fontSize: '13px' }}>
                3. Completed {bookingData?.status === 'completed' ? '✓' : '•'}
              </p>
              {bookingData?.rideStartTime ? (
                <p style={{ margin: '10px 0 0 0', color: '#93c5fd', fontSize: '12px' }}>
                  Ride started at {new Date(bookingData.rideStartTime).toLocaleString('en-IN')}
                </p>
              ) : null}
            </motion.div>

            {bookingData?.verification?.otp && !bookingData?.verification?.otpVerified && (
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  backgroundColor: 'rgba(147, 197, 253, 0.1)',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <p style={{ margin: '0 0 8px 0', color: '#aaa', fontSize: '12px', textTransform: 'uppercase' }}>
                  Ride Start OTP
                </p>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.2em' }}>
                  {bookingData.verification.otp}
                </div>
                <p style={{ margin: '8px 0 0 0', color: '#cbd5f5', fontSize: '12px' }}>
                  Share this OTP with the driver only after the driver arrives and confirms pickup.
                </p>
              </motion.div>
            )}

            {bookingData?.invoice && (
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <p style={{ margin: '0 0 8px 0', color: '#aaa', fontSize: '12px', textTransform: 'uppercase' }}>
                  Invoice
                </p>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: '6px' }}>
                  {bookingData.invoice.invoiceId}
                </div>
                <p style={{ margin: '4px 0', color: '#fde68a', fontSize: '13px' }}>Subtotal: ₹{bookingData.invoice.subtotal}</p>
                <p style={{ margin: '4px 0', color: '#fde68a', fontSize: '13px' }}>Insurance: ₹{bookingData.invoice.insurance}</p>
                <p style={{ margin: '8px 0 0 0', color: '#ffc107', fontWeight: 700, fontSize: '18px' }}>
                  Total Paid: ₹{bookingData.invoice.total}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            borderLeft: '4px solid #22c55e',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
              }}
            />
            <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>
              <strong style={{ color: '#22c55e' }}>{String(bookingData?.status || 'pending').replace(/_/g, ' ').toUpperCase()}</strong>
              {' '}
              {statusText[bookingData?.status] || 'Tracking your booking in real-time.'}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}