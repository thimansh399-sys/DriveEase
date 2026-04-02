import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import '../styles/UnifiedUI.css';
import '../styles/EnhancedAnimations.css';

const MAX_STEP = 5;

function Booking() {
  const navigate = useNavigate();
  const { driverId } = useParams();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState(searchParams.get('pickup') || '');
  const [drop, setDrop] = useState(searchParams.get('drop') || '');
  const [datetime, setDatetime] = useState('');
  const [driverType, setDriverType] = useState(searchParams.get('ride') || 'Standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const title = useMemo(() => {
    if (step === 1) return 'Pickup Location';
    if (step === 2) return 'Drop Location';
    if (step === 3) return 'Select Time';
    if (step === 4) return 'Choose Driver';
    return 'Confirm Booking';
  }, [step]);

  const rideType = useMemo(() => {
    if (driverType === 'Premium') return 'hourly';
    if (driverType === 'Corporate') return 'outstation';
    return 'daily';
  }, [driverType]);

  const canGoNext = useMemo(() => {
    if (step === 1) return Boolean(pickup.trim());
    if (step === 2) return Boolean(drop.trim());
    if (step === 3) return Boolean(datetime);
    if (step === 4) return Boolean(driverType);
    return true;
  }, [step, pickup, drop, datetime, driverType]);

  const onNext = () => {
    setError('');
    setSuccess(null);
    if (!canGoNext) return;
    setStep((prev) => Math.min(prev + 1, MAX_STEP));
  };

  const onBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onConfirm = async () => {
    setError('');
    setSuccess(null);

    if (!pickup.trim() || !drop.trim() || !datetime) {
      setError('Please complete all booking details before confirming.');
      return;
    }

    setLoading(true);
    try {
      const parsed = new Date(datetime);
      const date = Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
      const time = Number.isNaN(parsed.getTime()) ? '' : parsed.toTimeString().slice(0, 5);

      const response = await api.bookRide({
        driverId,
        pickupLocation: { address: pickup.trim() },
        dropLocation: { address: drop.trim() },
        date,
        time,
        rideType,
      });

      if (!response || response.error) {
        setError(response?.error || 'Booking failed. Please try again.');
      } else {
        setSuccess(response.ride || response.booking || response);
        setShowModal(true);
        // Redirect to summary after 2.5s
        setTimeout(() => {
          setShowModal(false);
          navigate(`/my-bookings?bookingId=${response.ride?.bookingId || response.bookingId || response.id || ''}`);
        }, 2500);
      }
    } catch {
      setError('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="ux-page ux-booking-wrap"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="ux-panel"
        layout
      >
        <motion.div 
          key={`step-badge-${step}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`ux-step-badge ${step === MAX_STEP ? 'active' : ''}`}
        >
          Step {step} / {MAX_STEP}
        </motion.div>
        
        <motion.h2 
          className="ux-title"
          key={`title-${step}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h2>

        <AnimatePresence mode="wait">
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="step-container"
          >
            {step === 1 && (
              <input
                placeholder="Enter pickup location"
                className="ux-input"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                autoFocus
              />
            )}

            {step === 2 && (
              <input
                placeholder="Enter drop location"
                className="ux-input"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                autoFocus
              />
            )}

            {step === 3 && (
              <input
                type="datetime-local"
                className="ux-input"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                autoFocus
              />
            )}

            {step === 4 && (
              <motion.div 
                className="ux-grid-gap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
              >
                {['Standard', 'Premium', 'Corporate'].map((type, idx) => {
                  const active = driverType === type;
                  return (
                    <motion.button
                      key={type}
                      type="button"
                      onClick={() => setDriverType(type)}
                      className={`ux-choice ${active ? 'active' : ''}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {type}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                className="ux-review"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <p className="ux-review-muted">Review your booking</p>
                <p className="ux-review-line"><strong>Pickup:</strong> {pickup || '-'}</p>
                <p className="ux-review-line"><strong>Drop:</strong> {drop || '-'}</p>
                <p className="ux-review-line"><strong>Time:</strong> {datetime || '-'}</p>
                <p className="ux-review-line"><strong>Category:</strong> {driverType}</p>
                {driverId && <p className="ux-review-line"><strong>Selected Driver:</strong> {driverId}</p>}

                <motion.button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="ux-btn primary full"
                  style={{ marginTop: 14 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Confirming...' : 'Confirm Ride'}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="ux-alert error"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal confirmation */}
        {showModal && success && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
              <div className="mb-2">Booking ID: {success.bookingId || success.id || 'Created'}</div>
              {success.driver?.name && (
                <div className="mb-2">Driver: {success.driver.name} ({success.driver.phone})</div>
              )}
              <div className="mb-4">You will be redirected to your bookings shortly.</div>
            </div>
          </div>
        )}

        <motion.div 
          className="ux-nav-row"
          layout
        >
          <motion.button
            type="button"
            onClick={onBack}
            disabled={step === 1 || loading}
            className="ux-btn ghost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>
          {step < MAX_STEP && (
            <motion.button
              type="button"
              onClick={onNext}
              disabled={!canGoNext || loading}
              className="ux-btn primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next →
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Booking;
