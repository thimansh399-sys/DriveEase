import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import '../styles/UnifiedUI.css';

const STATUS_LABELS = {
  pending: 'Driver response pending',
  confirmed: 'Driver accepted your ride',
  driver_assigned: 'Driver assigned',
  driver_arrived: 'Driver arrived at pickup',
  otp_verified: 'OTP verified',
  in_progress: 'Ride in progress',
  completed: 'Ride completed',
  cancelled: 'Ride cancelled'
};

const canConfirm = (status) => ['pending', 'driver_assigned'].includes(status);

const formatMoney = (value) => Number(value || 0).toFixed(2);
const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString();
};

export default function CustomerConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const loadBooking = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const response = await api.getBookingById(bookingId);
      if (!response || response.error) {
        throw new Error(response?.error || 'Booking not found');
      }
      setBooking(response);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load booking details.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (!bookingId) {
      setError('Invalid booking id');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const poll = async () => {
      if (!isMounted) return;
      await loadBooking(!booking);
    };

    poll();
    const interval = setInterval(() => {
      poll();
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const invoice = useMemo(() => {
    if (!booking) return null;
    return booking.invoice || {
      invoiceId: `INV-${booking.bookingId || booking._id || 'LIVE'}`,
      subtotal: Number(booking.estimatedPrice || 0),
      insurance: Number(booking.insuranceAmount || 0),
      total: Number(booking.finalPrice || booking.estimatedPrice || 0),
      paymentStatus: booking.paymentStatus || 'completed',
      paymentMethod: booking.paymentMethod || 'upi'
    };
  }, [booking]);

  const handleConfirmBooking = async () => {
    if (!booking?._id) return;
    try {
      setConfirming(true);
      const response = await api.confirmBooking(booking._id);
      if (!response?.success || !response?.booking) {
        throw new Error(response?.error || 'Booking confirmation failed');
      }
      setBooking((prev) => ({ ...(prev || {}), ...response.booking }));
      setActionMessage('Booking confirmed. OTP is now ready for ride start.');
    } catch (confirmError) {
      setActionMessage(confirmError.message || 'Unable to confirm booking.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!booking || !invoice) return;

    const driver = booking?.driverId || booking?.driver || null;
    const invoiceHtml = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>DriveEase Invoice ${invoice.invoiceId}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
      h1 { margin: 0 0 8px; }
      .muted { color: #475569; }
      .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-top: 14px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
      .row:last-child { border-bottom: none; }
      .strong { font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>DriveEase Ride Invoice</h1>
    <div class="muted">Invoice ID: ${invoice.invoiceId}</div>
    <div class="muted">Booking ID: ${booking.bookingId || booking._id}</div>
    <div class="muted">Generated At: ${new Date().toLocaleString()}</div>

    <div class="card">
      <div class="row"><span>Status</span><span class="strong">${booking.status || 'pending'}</span></div>
      <div class="row"><span>Pickup</span><span>${booking?.pickupLocation?.address || 'Not available'}</span></div>
      <div class="row"><span>Drop</span><span>${booking?.dropLocation?.address || 'Not available'}</span></div>
      <div class="row"><span>Ride Time</span><span>${formatDateTime(booking?.startDate)}</span></div>
      <div class="row"><span>Driver</span><span>${driver?.name || 'Pending assignment'}</span></div>
      <div class="row"><span>Driver Phone</span><span>${driver?.phone || 'Not assigned yet'}</span></div>
    </div>

    <div class="card">
      <div class="row"><span>Subtotal</span><span>INR ${formatMoney(invoice.subtotal)}</span></div>
      <div class="row"><span>Insurance</span><span>INR ${formatMoney(invoice.insurance)}</span></div>
      <div class="row"><span class="strong">Total</span><span class="strong">INR ${formatMoney(invoice.total)}</span></div>
      <div class="row"><span>Payment Method</span><span>${invoice.paymentMethod || 'upi'}</span></div>
      <div class="row"><span>Payment Status</span><span>${invoice.paymentStatus || 'pending'}</span></div>
    </div>
  </body>
</html>`;

    const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceId || 'DriveEase-Invoice'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="ux-page">
        <div className="ux-panel" style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
          <p className="ux-subtle">Loading live booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ux-page">
        <div className="ux-panel" style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div className="ux-alert error">{error}</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
            <Link className="ux-btn" to="/my-bookings">Back to My Bookings</Link>
            <button type="button" className="ux-btn primary" onClick={() => loadBooking(true)}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const status = booking?.status || 'pending';
  const driver = booking?.driverId || booking?.driver || null;

  return (
    <div className="ux-page">
      <div className="ux-container" style={{ maxWidth: '980px' }}>
        <div className="ux-header-row" style={{ alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Live Booking Confirmation</h2>
          <span className="ux-chip">#{booking?.bookingId || booking?._id?.slice(-6)}</span>
        </div>

        <div className="ux-panel" style={{ marginTop: '16px' }}>
          <p className="ux-subtle" style={{ marginTop: 0 }}>
            Status: <strong>{STATUS_LABELS[status] || status}</strong>
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span className={`ux-chip ${status === 'pending' ? 'warning' : ''}`}>Pending: {status === 'pending' ? 'Yes' : 'No'}</span>
            <span className={`ux-chip ${status === 'confirmed' ? 'success' : ''}`}>Confirmed: {status === 'confirmed' ? 'Yes' : 'No'}</span>
            <span className="ux-chip">Payment: {booking?.paymentStatus || 'pending'}</span>
          </div>

          <div className="ux-stat-grid" style={{ marginTop: '14px' }}>
            <div className="ux-stat-card">
              <h4>Pickup</h4>
              <p>{booking?.pickupLocation?.address || 'Not available'}</p>
            </div>
            <div className="ux-stat-card">
              <h4>Drop</h4>
              <p>{booking?.dropLocation?.address || 'Not available'}</p>
            </div>
            <div className="ux-stat-card">
              <h4>Invoice</h4>
              <p>{invoice?.invoiceId || 'Generating...'}</p>
            </div>
            <div className="ux-stat-card">
              <h4>Total Price</h4>
              <p>₹{formatMoney(invoice?.total || 0)}</p>
            </div>
            <div className="ux-stat-card">
              <h4>Ride Timing</h4>
              <p>{formatDateTime(booking?.startDate)}</p>
            </div>
          </div>

          {driver && (
            <div className="ux-alert" style={{ marginTop: '16px' }}>
              <strong>Assigned Driver:</strong> {driver.name || 'Driver'}
              {driver.phone ? ` • ${driver.phone}` : ''}
            </div>
          )}

          {canConfirm(status) && (
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="ux-btn primary"
                onClick={handleConfirmBooking}
                disabled={confirming}
              >
                {confirming ? 'Confirming...' : 'Confirm This Booking'}
              </button>
              <button type="button" className="ux-btn" onClick={() => loadBooking(true)}>Refresh Status</button>
            </div>
          )}

          {booking?.verification?.otp && status !== 'completed' && status !== 'cancelled' && (
            <div className="ux-alert success" style={{ marginTop: '16px' }}>
              <strong>Ride Start OTP: {booking.verification.otp}</strong>
              <div>Share this OTP only when the driver arrives at pickup.</div>
            </div>
          )}

          {actionMessage && (
            <div className="ux-alert" style={{ marginTop: '12px' }}>{actionMessage}</div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button type="button" className="ux-btn primary" onClick={() => navigate(`/track-booking/${booking?._id || bookingId}`)}>
              Track Live Ride
            </button>
            <button type="button" className="ux-btn" onClick={handleDownloadInvoice}>
              Download Invoice
            </button>
            <Link className="ux-btn" to="/my-bookings">Go to My Bookings</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
