import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/UnifiedUI.css';
import '../styles/EnhancedAnimations.css';

/**
 * Payment Page
 * Integrated payment flow with multiple payment methods
 */
export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState('method'); // method | details | confirm | success
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVV: '',
  });
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample booking data
  const bookingData = {
    bookingId: searchParams.get('bookingId') || 'BOOK123456',
    driverName: 'Rajesh Kumar',
    pickupLocation: 'Hazratganj, Lucknow',
    dropoffLocation: 'Gomti Nagar, Lucknow',
    distance: 12.5,
    baseFare: 150,
    perKmRate: 8,
    distanceFare: 100,
    surgePricing: 0,
    taxes: 35,
  };

  // Calculate total fare
  const fareBreakdown = useMemo(() => {
    return {
      baseFare: bookingData.baseFare,
      distanceFare: bookingData.distance * bookingData.perKmRate,
      surgePricing: bookingData.surgePricing,
      subtotal: bookingData.baseFare + bookingData.distance * bookingData.perKmRate + bookingData.surgePricing,
      taxes: bookingData.taxes,
      total: bookingData.baseFare + bookingData.distance * bookingData.perKmRate + bookingData.surgePricing + bookingData.taxes,
    };
  }, [bookingData]);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      description: 'Google Pay, PhonePe, PayTM',
      icon: '📱',
      color: 'rgba(147, 197, 253, 0.1)',
      borderColor: 'rgba(147, 197, 253, 0.3)',
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Visa, MasterCard, Amex',
      icon: '💳',
      color: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    {
      id: 'wallet',
      name: 'Mobile Wallet',
      description: 'Paytm, Amazon Pay',
      icon: '💰',
      color: 'rgba(255, 193, 7, 0.1)',
      borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'All major banks',
      icon: '🏦',
      color: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
  ];

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (selectedMethod === 'upi' && !upiId.trim()) {
        throw new Error('Please enter a valid UPI ID');
      }
      if (selectedMethod === 'card' && (!cardData.cardNumber || !cardData.cardExpiry || !cardData.cardCVV)) {
        throw new Error('Please fill all card details');
      }

      setStep('success');
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  // Method Selection Step
  if (step === 'method') {
    return (
      <motion.div
        className="ux-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginBottom: '32px' }}
          >
            <h1 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '28px' }}>
              Select Payment Method
            </h1>
            <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
              Choose your preferred way to pay
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {paymentMethods.map((method, idx) => (
              <motion.button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method.id);
                  setStep('details');
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '24px 16px',
                  backgroundColor: method.color,
                  border: `2px solid ${method.borderColor}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#fff',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = method.color.replace('0.1)', '0.2)');
                  e.currentTarget.style.borderColor = method.borderColor.replace('0.3)', '0.6)');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = method.color;
                  e.currentTarget.style.borderColor = method.borderColor;
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                  {method.icon}
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>
                  {method.name}
                </h3>
                <p style={{ margin: 0, color: '#aaa', fontSize: '12px' }}>
                  {method.description}
                </p>
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '16px' }}>
              Fare Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '13px' }}>
                <span>Base Fare</span>
                <span>₹{fareBreakdown.baseFare}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '13px' }}>
                <span>Distance ({bookingData.distance} km × ₹{bookingData.perKmRate}/km)</span>
                <span>₹{fareBreakdown.distanceFare}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#aaa',
                fontSize: '13px',
              }}>
                <span>Taxes & Charges</span>
                <span>₹{fareBreakdown.taxes}</span>
              </div>
             <motion.div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#22c55e',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>Total Amount</span>
                <span>₹{fareBreakdown.total}</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Payment Details Step
  if (step === 'details') {
    return (
      <motion.div
        className="ux-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <motion.button
              onClick={() => setStep('method')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'none',
                border: 'none',
                color: '#22c55e',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
              }}
            >
              ←
            </motion.button>
            <div>
              <h1 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '24px' }}>
                {selectedMethod === 'upi' && 'Enter UPI ID'}
                {selectedMethod === 'card' && 'Card Details'}
                {selectedMethod === 'wallet' && 'Mobile Wallet'}
                {selectedMethod === 'netbanking' && 'Net Banking'}
              </h1>
              <p style={{ margin: 0, color: '#aaa', fontSize: '12px' }}>
                {paymentMethods.find((m) => m.id === selectedMethod)?.description}
              </p>
            </div>
          </motion.div>

          <motion.form
            onSubmit={handlePaymentSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            {selectedMethod === 'upi' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
                  UPI ID
                </label>
                <input
                  type="text"
                  placeholder="yourphone@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="ux-input"
                  autoFocus
                  required
                />
              </motion.div>
            )}

            {selectedMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.cardNumber}
                    onChange={(e) =>
                      setCardData({ ...cardData, cardNumber: e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim() })
                    }
                    className="ux-input"
                    maxLength="19"
                    autoFocus
                    required
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardData.cardName}
                    onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                    className="ux-input"
                    required
                  />
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardData.cardExpiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setCardData({ ...cardData, cardExpiry: value });
                      }}
                      className="ux-input"
                      maxLength="5"
                      required
                    />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
                      CVV
                    </label>
                    <input
                      type="password"
                      placeholder="123"
                      value={cardData.cardCVV}
                      onChange={(e) => setCardData({ ...cardData, cardCVV: e.target.value.replace(/\D/g, '') })}
                      className="ux-input"
                      maxLength="4"
                      required
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {selectedMethod === 'wallet' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <p style={{ color: '#aaa', marginBottom: '16px' }}>
                  You will be redirected to your wallet provider to complete the payment.
                </p>
              </motion.div>
            )}

            {selectedMethod === 'netbanking' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
                  Select Your Bank
                </label>
                <select
                  className="ux-input"
                  defaultValue=""
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Choose a bank...</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                  <option value="bank">Kotak Bank</option>
                </select>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="ux-alert error"
                style={{ marginTop: '16px' }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="ux-btn primary full"
              style={{ marginTop: '24px' }}
              whileHover={!loading ? { scale: 1.05, y: -2 } : {}}
              whileTap={!loading ? { scale: 0.95 } : {}}
            >
              {loading ? (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Processing...
                </motion.span>
              ) : (
                `Pay ₹${fareBreakdown.total}`
              )}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              borderRadius: '8px',
            }}
          >
            <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
              🔒 Your payment information is secured and encrypted
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Success Step
  if (step === 'success') {
    return (
      <motion.div
        className="ux-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px 20px' }}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '60px',
            }}
          >
            ✓
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ margin: '0 0 8px 0', color: '#22c55e', fontSize: '28px' }}
          >
            Payment Successful!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: '#aaa', fontSize: '14px', margin: '0 0 32px 0' }}
          >
            Your ride is confirmed. Your driver is on the way.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left',
            }}
          >
            <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
              Receipt Details
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: '#aaa' }}>Booking ID</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{bookingData.bookingId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: '#aaa' }}>Amount Paid</span>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>₹{fareBreakdown.total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#aaa' }}>Time</span>
              <span style={{ color: '#fff' }}>{new Date().toLocaleString()}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ display: 'flex', gap: '12px' }}
          >
            <motion.button
              onClick={() => navigate('/track')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ux-btn primary"
              style={{ flex: 1 }}
            >
              Track Ride
            </motion.button>
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ux-btn ghost"
              style={{ flex: 1 }}
            >
              Go Home
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }
}
