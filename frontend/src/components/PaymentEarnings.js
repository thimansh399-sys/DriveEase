import React, { useState, useEffect } from 'react';
import '../styles/PaymentEarnings.css';

export default function PaymentEarnings({ bookingId = null, driverId = null, role = 'customer' }) {
  const [payment, setPayment] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingPayment();
    } else if (driverId && role === 'driver') {
      fetchDriverEarnings();
    }
  }, [bookingId, driverId, role]);

  const fetchBookingPayment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/bookings-enhanced/${bookingId}/payment`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayment(data);
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverEarnings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/driver-registration/${driverId}/earnings`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setError('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setError(null);

      if (paymentMethod === 'razorpay') {
        // Razorpay integration
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.head.appendChild(script);

        script.onload = () => {
          const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY,
            amount: payment.finalPrice * 100, // Amount in paise
            currency: 'INR',
            name: 'DriveEase Payment',
            description: `Payment for booking ${bookingId}`,
            handler: async (response) => {
              // Verify payment and update booking
              const token = localStorage.getItem('token');
              const verifyResponse = await fetch(
                `${process.env.REACT_APP_API_URL}/bookings-enhanced/${bookingId}/payment/verify`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature
                  })
                }
              );

              if (verifyResponse.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                fetchBookingPayment();
              }
            }
          };

          new window.Razorpay(options).open();
        };
      } else if (paymentMethod === 'upi') {
        // UPI Payment simulation
        const upiUrl = `upi://pay?pa=${process.env.REACT_APP_UPI_ID}&pn=DriveEase&am=${payment.finalPrice}&tn=Booking%20${bookingId}`;
        window.open(upiUrl);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdrawal = async () => {
    try {
      if (!withdrawalAmount || withdrawalAmount <= 0) {
        setError('Enter valid withdrawal amount');
        return;
      }

      if (withdrawalAmount > earnings.availableBalance) {
        setError('Insufficient balance');
        return;
      }

      setProcessing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/driver-registration/${driverId}/withdrawal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount: parseFloat(withdrawalAmount) })
        }
      );

      if (response.ok) {
        setSuccess(true);
        setWithdrawalAmount('');
        setTimeout(() => setSuccess(false), 3000);
        fetchDriverEarnings();
      } else {
        setError('Withdrawal request failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError('Error processing withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="payment-loading">Loading...</div>;
  }

  return (
    <div className="payment-earnings-container">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">✓ Transaction successful!</div>}

      {/* Customer Payment Section */}
      {role === 'customer' && payment && (
        <section className="payment-section">
          <h3>💳 Complete Your Payment</h3>

          <div className="payment-details">
            <div className="detail-row">
              <span>Booking ID:</span>
              <strong>{payment.bookingId}</strong>
            </div>
            <div className="detail-row">
              <span>Ride Duration:</span>
              <strong>{payment.duration}</strong>
            </div>
            <div className="detail-row">
              <span>Distance:</span>
              <strong>{payment.distance} km</strong>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="price-breakdown">
            <h4>Price Breakdown</h4>
            {payment.breakdown && (
              <>
                <div className="breakdown-row">
                  <span>Base Fare:</span>
                  <span>₹{payment.breakdown.baseFare}</span>
                </div>
                <div className="breakdown-row">
                  <span>Distance Charge:</span>
                  <span>₹{payment.breakdown.distanceCharge}</span>
                </div>
                {payment.breakdown.nightSurcharge > 0 && (
                  <div className="breakdown-row">
                    <span>Night Surcharge (20%):</span>
                    <span>₹{payment.breakdown.nightSurcharge}</span>
                  </div>
                )}
                {payment.breakdown.peakSurcharge > 0 && (
                  <div className="breakdown-row">
                    <span>Peak Hour Surcharge (10%):</span>
                    <span>₹{payment.breakdown.peakSurcharge}</span>
                  </div>
                )}
                <div className="breakdown-row total">
                  <strong>Total Amount:</strong>
                  <strong>₹{payment.finalPrice}</strong>
                </div>
              </>
            )}
          </div>

          {!payment.paid && (
            <div className="payment-methods">
              <h4>Select Payment Method</h4>
              <div className="method-grid">
                <label className="payment-method">
                  <input
                    type="radio"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="method-label">📱 UPI</span>
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="method-label">💳 Card/Wallet</span>
                </label>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="btn btn-primary btn-lg"
              >
                {processing ? 'Processing...' : `Pay ₹${payment.finalPrice}`}
              </button>
            </div>
          )}

          {payment.paid && (
            <div className="payment-success">
              <div className="success-icon">✓</div>
              <p>Payment received successfully!</p>
              <p className="receipt-id">Receipt: {payment.receiptId}</p>
            </div>
          )}
        </section>
      )}

      {/* Driver Earnings Section */}
      {role === 'driver' && earnings && (
        <section className="earnings-section">
          <h3>💰 Your Earnings</h3>

          {/* Summary Cards */}
          <div className="earnings-summary">
            <card className="summary-card">
              <div className="card-label">Today's Earnings</div>
              <div className="card-value">₹{earnings.todayEarnings}</div>
              <p className="card-detail">{earnings.todayRides} rides</p>
            </card>
            <card className="summary-card">
              <div className="card-label">This Month</div>
              <div className="card-value">₹{earnings.monthlyEarnings}</div>
              <p className="card-detail">{earnings.monthlyRides} rides</p>
            </card>
            <card className="summary-card">
              <div className="card-label">Available Balance</div>
              <div className="card-value" style={{ color: '#16a34a' }}>
                ₹{earnings.availableBalance}
              </div>
              <p className="card-detail">Ready to withdraw</p>
            </card>
            <card className="summary-card">
              <div className="card-label">Commission Rate</div>
              <div className="card-value">{earnings.commissionRate}%</div>
              <p className="card-detail">Per ride</p>
            </card>
          </div>

          {/* Earnings Breakdown */}
          <div className="earnings-breakdown">
            <h4>Earnings Breakdown</h4>
            <div className="breakdown-row">
              <span>Gross Earnings:</span>
              <strong>₹{earnings.grossEarnings}</strong>
            </div>
            <div className="breakdown-row">
              <span>Commission ({earnings.commissionRate}%):</span>
              <strong>-₹{earnings.totalCommission}</strong>
            </div>
            <div className="breakdown-row total">
              <strong>Net Earnings:</strong>
              <strong>₹{earnings.netEarnings}</strong>
            </div>
          </div>

          {/* Withdrawal */}
          <div className="withdrawal-section">
            <h4>🏦 Withdraw Earnings</h4>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder={`Max: ₹${earnings.availableBalance}`}
                className="form-input"
              />
            </div>
            <button
              onClick={handleWithdrawal}
              disabled={processing || !withdrawalAmount}
              className="btn btn-primary btn-lg"
            >
              {processing ? 'Processing...' : `Withdraw ₹${withdrawalAmount || 0}`}
            </button>
          </div>

          {/* Recent Rides */}
          <div className="recent-rides">
            <h4>Recent Rides</h4>
            {earnings.recentRides && earnings.recentRides.length > 0 ? (
              <table className="rides-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Distance</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.recentRides.map((ride) => (
                    <tr key={ride.bookingId}>
                      <td>{ride.bookingId}</td>
                      <td>{ride.customerName}</td>
                      <td>{ride.distance} km</td>
                      <td>₹{ride.amount}</td>
                      <td>
                        <span className={`badge ${ride.status}`}>
                          {ride.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No rides yet</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
