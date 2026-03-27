import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { downloadInvoice } from '../utils/invoiceUtils';
import '../styles/MyBookings.css';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b', icon: '⏳', class: 'status-pending' },
  confirmed: { label: 'Confirmed', color: '#3b82f6', icon: '✅', class: 'status-confirmed' },
  driver_assigned: { label: 'Assigned', color: '#8b5cf6', icon: '🚗', class: 'status-assigned' },
  driver_arrived: { label: 'Arrived', color: '#06b6d4', icon: '📍', class: 'status-arrived' },
  otp_verified: { label: 'OTP Verified', color: '#22c55e', icon: '🔑', class: 'status-otp' },
  in_progress: { label: 'On Trip', color: '#22c55e', icon: '🟢', class: 'status-progress' },
  completed: { label: 'Completed', color: '#10b981', icon: '✔️', class: 'status-completed' },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: '❌', class: 'status-cancelled' },
  rejected: { label: 'Rejected', color: '#f97316', icon: '↩️', class: 'status-rejected' },
};

const ACTIVE_STATUSES = ['pending', 'confirmed', 'driver_assigned', 'driver_arrived', 'otp_verified', 'in_progress'];

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [expandedId, setExpandedId] = useState(null);
  const [ratingByBooking, setRatingByBooking] = useState({});
  const [commentByBooking, setCommentByBooking] = useState({});
  const [feedbackBusy, setFeedbackBusy] = useState('');
  const role = (localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase();
  const isDriverView = role === 'driver';

  const fetchMyBookings = useCallback(async () => {
    try {
      const response = isDriverView ? await api.getDriverBookings() : await api.getMyBookings();
      const list = response?.bookings || response || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [isDriverView]);

  useEffect(() => {
    fetchMyBookings();
    const interval = setInterval(fetchMyBookings, 8000);
    return () => clearInterval(interval);
  }, [fetchMyBookings]);

  const handleCancel = async (bookingId) => {
    if (window.confirm('Cancel this booking?')) {
      try {
        await api.cancelBooking(bookingId);
        fetchMyBookings();
      } catch (error) {
        console.error('Error cancelling booking:', error);
      }
    }
  };

  const handleSubmitFeedback = async (bookingId) => {
    const rating = Number(ratingByBooking[bookingId] || 0);
    const comment = String(commentByBooking[bookingId] || '').trim();

    if (!rating || rating < 1 || rating > 5) {
      alert('Please choose a rating between 1 and 5.');
      return;
    }

    try {
      setFeedbackBusy(bookingId);
      const response = await api.addFeedback(bookingId, { rating, comment });
      if (response?.error) {
        throw new Error(response.error);
      }
      await fetchMyBookings();
      alert('Thanks! Your feedback was submitted.');
    } catch (error) {
      alert(error.message || 'Unable to submit feedback.');
    } finally {
      setFeedbackBusy('');
    }
  };

  const sortByRecency = (list, preferRejectionTime = false) => {
    return [...list].sort((a, b) => {
      const aTime = new Date(
        preferRejectionTime
          ? (a.rejectedAt || a.updatedAt || a.createdAt || 0)
          : (a.updatedAt || a.startDate || a.createdAt || 0)
      ).getTime();
      const bTime = new Date(
        preferRejectionTime
          ? (b.rejectedAt || b.updatedAt || b.createdAt || 0)
          : (b.updatedAt || b.startDate || b.createdAt || 0)
      ).getTime();
      return bTime - aTime;
    });
  };

  const activeBookings = sortByRecency(
    bookings.filter((b) => ACTIVE_STATUSES.includes(b.status) && !b.rejectedByCurrentDriver)
  );
  const completedBookings = sortByRecency(bookings.filter((b) => b.status === 'completed'));
  const cancelledBookings = sortByRecency(bookings.filter(
    (b) =>
      b.status === 'cancelled' ||
      b.status === 'rejected' ||
      b.rejectedByCurrentDriver ||
      /declin|reject/i.test(String(b.notes || ''))
  ), true);

  const filtered = tab === 'active' ? activeBookings : tab === 'completed' ? completedBookings : cancelledBookings;

  const getStatusInfo = (status) => STATUS_CONFIG[status] || { label: status, color: '#666', icon: '•', class: '' };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  const getStatusSteps = (currentStatus) => {
    const allSteps = ['pending', 'confirmed', 'driver_assigned', 'driver_arrived', 'in_progress', 'completed'];
    const currentIdx = allSteps.indexOf(currentStatus);
    return allSteps.map((s, i) => ({
      ...getStatusInfo(s),
      key: s,
      done: i <= currentIdx,
      current: i === currentIdx,
    }));
  };

  return (
    <div className="mb-page">
      <div className="mb-container">
        {/* Header */}
        <div className="mb-header">
          <h1 className="mb-title">My <span>{isDriverView ? 'Rides' : 'Bookings'}</span></h1>
          <p className="mb-subtitle">
            {isDriverView ? 'Active, completed and rejected rides in one place' : 'Track all your rides in one place'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-tabs">
          <button className={`mb-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
            🟢 Active
            {activeBookings.length > 0 && <span className="mb-tab-count">{activeBookings.length}</span>}
          </button>
          <button className={`mb-tab ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>
            ✔️ Completed
            {completedBookings.length > 0 && <span className="mb-tab-count">{completedBookings.length}</span>}
          </button>
          <button className={`mb-tab ${tab === 'cancelled' ? 'active' : ''}`} onClick={() => setTab('cancelled')}>
            ❌ Cancelled/Rejected
            {cancelledBookings.length > 0 && <span className="mb-tab-count">{cancelledBookings.length}</span>}
          </button>
        </div>

        {tab === 'cancelled' && (
          <p className="mb-sort-hint">Sorted by latest activity</p>
        )}

        {/* Content */}
        {loading ? (
          <div className="mb-loading">
            <div className="mb-spinner"></div>
            <p>Loading your bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mb-empty">
            <span className="mb-empty-icon">{tab === 'active' ? '🚗' : tab === 'completed' ? '✅' : '📋'}</span>
            <h3>{tab === 'active' ? 'No active rides' : tab === 'completed' ? 'No completed rides yet' : 'No cancelled/rejected rides'}</h3>
            {tab === 'active' && <p>Book a ride to get started! <Link to="/browse" className="mb-link">Browse Drivers →</Link></p>}
          </div>
        ) : (
          <div className="mb-list">
            {filtered.map(booking => {
              const st = getStatusInfo(booking.status);
              const isExpanded = expandedId === booking._id;
              const fare = booking.rideFlow?.finalFare || booking.finalPrice || booking.estimatedPrice || 0;
              const counterpart = isDriverView ? booking.customer : booking.driver;
              const counterpartLabel = isDriverView ? 'Customer' : 'Driver';

              return (
                <div
                  key={booking._id}
                  className={`mb-card ${isExpanded ? 'expanded' : ''} ${tab === 'active' ? 'card-active' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : booking._id)}
                >
                  {/* Top Row */}
                  <div className="mb-card-top">
                    <div className="mb-card-id">
                      <span className="mb-booking-id">#{booking.bookingId || booking._id?.slice(-6)}</span>
                      <span className="mb-card-date">{formatDate(booking.createdAt)}</span>
                    </div>
                    <div className="mb-card-right">
                      {booking.insurance?.opted && (
                        <span className="mb-insurance-badge">🛡️ Insured</span>
                      )}
                      <span className={`mb-status ${st.class}`}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="mb-route">
                    <div className="mb-route-point">
                      <span className="mb-dot pickup"></span>
                      <span className="mb-route-text">{booking.pickupLocation?.address || 'Pickup'}</span>
                    </div>
                    <div className="mb-route-line"></div>
                    <div className="mb-route-point">
                      <span className="mb-dot drop"></span>
                      <span className="mb-route-text">{booking.dropLocation?.address || 'Drop'}</span>
                    </div>
                  </div>

                  {/* Driver + Fare Row */}
                  <div className="mb-info-row">
                    <div className="mb-driver-info">
                      {counterpart ? (
                        <>
                          <div className="mb-driver-avatar">
                            {counterpart.profilePicture
                              ? <img src={`http://localhost:5000/${counterpart.profilePicture}`} alt="" />
                              : <span>🧑</span>
                            }
                          </div>
                          <div>
                            <span className="mb-driver-name">{counterpartLabel}: {counterpart.name || '-'}</span>
                            <span className="mb-driver-phone">{counterpart.phone || '-'}</span>
                          </div>
                        </>
                      ) : (
                        <span className="mb-no-driver">{isDriverView ? 'Customer details not available' : 'Assigning driver...'}</span>
                      )}
                    </div>
                    <div className="mb-fare">
                      <span className="mb-fare-amount">₹{fare}</span>
                      {booking.insurance?.opted && (
                        <span className="mb-fare-insurance">+₹{booking.insurance.amount} insurance</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mb-expanded">
                      {/* Live Status Tracker */}
                      {ACTIVE_STATUSES.includes(booking.status) && (
                        <div className="mb-status-tracker">
                          <h4>Ride Progress</h4>
                          <div className="mb-tracker-steps">
                            {getStatusSteps(booking.status).map((step, i) => (
                              <div key={step.key} className={`mb-tracker-step ${step.done ? 'done' : ''} ${step.current ? 'current' : ''}`}>
                                <div className="mb-tracker-dot">{step.done ? '✓' : (i + 1)}</div>
                                <span className="mb-tracker-label">{step.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Details Grid */}
                      <div className="mb-details-grid">
                        <div className="mb-detail-item">
                          <span className="mb-detail-label">Booking ID</span>
                          <span className="mb-detail-value">{booking.bookingId || booking._id?.slice(-6)}</span>
                        </div>
                        <div className="mb-detail-item">
                          <span className="mb-detail-label">Type</span>
                          <span className="mb-detail-value">{booking.bookingType?.toUpperCase()}</span>
                        </div>
                        <div className="mb-detail-item">
                          <span className="mb-detail-label">Distance</span>
                          <span className="mb-detail-value">{booking.estimatedDistance || '—'} km</span>
                        </div>
                        <div className="mb-detail-item">
                          <span className="mb-detail-label">Date</span>
                          <span className="mb-detail-value">{formatDate(booking.startDate)} {formatTime(booking.startDate)}</span>
                        </div>
                        <div className="mb-detail-item">
                          <span className="mb-detail-label">Payment</span>
                          <span className="mb-detail-value">{booking.paymentStatus || 'pending'}</span>
                        </div>
                        {counterpart?.name && (
                          <div className="mb-detail-item">
                            <span className="mb-detail-label">{counterpartLabel}</span>
                            <span className="mb-detail-value">{counterpart.name}</span>
                          </div>
                        )}
                        {booking.driver?.rating > 0 && (
                          <div className="mb-detail-item">
                            <span className="mb-detail-label">Driver Rating</span>
                            <span className="mb-detail-value">⭐ {booking.driver.rating}</span>
                          </div>
                        )}
                        {booking.rideFlow?.isPeakRide && (
                          <div className="mb-detail-item">
                            <span className="mb-detail-label">Peak Ride</span>
                            <span className="mb-detail-value" style={{color: '#f59e0b'}}>🔥 Yes</span>
                          </div>
                        )}
                      </div>

                      {!isDriverView && booking.verification?.otp && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <div className="mb-insurance-info">
                          <span>🔐</span>
                          <div>
                            <strong>Ride Start OTP: {booking.verification.otp}</strong>
                            <p>Share this OTP with the driver only after the driver arrives.</p>
                          </div>
                        </div>
                      )}

                      {booking.invoice && !isDriverView && (
                        <div className="mb-insurance-info">
                          <span>🧾</span>
                          <div>
                            <strong>{booking.invoice.invoiceId}</strong>
                            <p>Paid ₹{booking.invoice.total} via {String(booking.invoice.paymentMethod || 'upi').toUpperCase()}</p>
                          </div>
                        </div>
                      )}

                      {booking.notes && (
                        <div className="mb-feedback">
                          <span>📝 Ride Notes</span>
                          <p>{booking.notes}</p>
                        </div>
                      )}

                      {/* Insurance Info */}
                      {booking.insurance?.opted && (
                        <div className="mb-insurance-info">
                          <span>🛡️</span>
                          <div>
                            <strong>₹5 Lakh Accidental Cover</strong>
                            <p>Insurance: ₹{booking.insurance.amount} • {booking.insurance.type === 'per_ride' ? 'Per Ride' : booking.insurance.type}</p>
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {booking.feedback?.rating && (
                        <div className="mb-feedback">
                          <span>⭐ {booking.feedback.rating}/5</span>
                          {booking.feedback.comment && <p>{booking.feedback.comment}</p>}
                        </div>
                      )}

                      {!isDriverView && booking.status === 'completed' && !booking.feedback?.rating && (
                        <div className="mb-feedback" onClick={(event) => event.stopPropagation()}>
                          <span>Rate This Ride</span>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={`${booking._id}-rating-${value}`}
                                type="button"
                                className="mb-btn track"
                                style={{ padding: '6px 10px' }}
                                onClick={() => setRatingByBooking((prev) => ({ ...prev, [booking._id]: value }))}
                              >
                                {value}⭐
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={commentByBooking[booking._id] || ''}
                            onChange={(event) => setCommentByBooking((prev) => ({ ...prev, [booking._id]: event.target.value.slice(0, 180) }))}
                            placeholder="Share your ride feedback (optional)"
                            style={{
                              width: '100%',
                              marginTop: '10px',
                              borderRadius: '10px',
                              padding: '10px',
                              background: 'rgba(15,23,42,0.8)',
                              color: '#fff',
                              border: '1px solid rgba(148,163,184,0.25)'
                            }}
                          />
                          <button
                            type="button"
                            className="mb-btn track"
                            style={{ marginTop: '10px' }}
                            disabled={feedbackBusy === booking._id}
                            onClick={() => handleSubmitFeedback(booking._id)}
                          >
                            {feedbackBusy === booking._id ? 'Submitting...' : 'Submit Feedback'}
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mb-actions">
                        {!isDriverView && booking.status === 'pending' && (
                          <button className="mb-btn cancel" onClick={(e) => { e.stopPropagation(); handleCancel(booking._id); }}>
                            ❌ Cancel Request
                          </button>
                        )}
                        {!isDriverView && ACTIVE_STATUSES.includes(booking.status) && (
                          <Link to={`/track-booking/${booking._id}`} className="mb-btn track" onClick={(e) => e.stopPropagation()}>
                            📍 Track Booking
                          </Link>
                        )}
                        {!isDriverView && ACTIVE_STATUSES.includes(booking.status) && (
                          <Link to={`/booking-confirmation/${booking._id}`} className="mb-btn track" onClick={(e) => e.stopPropagation()}>
                            ✅ Confirm & OTP
                          </Link>
                        )}
                        {!isDriverView && (booking.status === 'confirmed' || booking.status === 'driver_assigned') && (
                          <button className="mb-btn cancel" onClick={(e) => { e.stopPropagation(); handleCancel(booking._id); }}>
                            ❌ Cancel Booking
                          </button>
                        )}
                        {!isDriverView && booking.status === 'completed' && (
                          <button className="mb-btn track" onClick={(e) => { e.stopPropagation(); downloadInvoice(booking, 'customer'); }}>
                            🧾 Download Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expand indicator */}
                  <div className="mb-expand-hint">
                    {isExpanded ? '▲ Less' : '▼ Details'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookings;
