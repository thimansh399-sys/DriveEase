import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/DriverDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [earnings, setEarnings] = useState({});
  const [loading, setLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [newBookingCount, setNewBookingCount] = useState(0);

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'earnings') {
      fetchDriverData();
    }
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  // Poll for new bookings every 10 seconds
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDriverProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const driver = await api.getDriverById(userId);
        if (driver && !driver.error) {
          setDriverInfo(driver);
          setOnlineStatus(driver.isOnline || false);
        }
      }
    } catch (error) {
      console.error('Error fetching driver profile:', error);
    }
  };

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      const response = await api.getDriverEarnings();
      if (response && !response.error) {
        setEarnings(response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.getDriverBookings();
      if (Array.isArray(response)) {
        const pending = response.filter(b => b.status === 'pending').length;
        setNewBookingCount(pending);
        setBookings(response);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      const response = await api.respondToBooking(bookingId, action);
      if (response && !response.error) {
        alert(`Booking ${action}ed successfully!`);
        fetchBookings();
      } else {
        alert(response?.error || `Failed to ${action} booking`);
      }
    } catch (error) {
      alert(`Failed to ${action} booking`);
    }
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !onlineStatus;
    try {
      const response = await api.updateDriverStatus({ isOnline: newStatus });
      if (response && !response.error) {
        setOnlineStatus(newStatus);
        if (response.driver) setDriverInfo(response.driver);
      } else {
        alert(response?.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#16a34a';
      case 'cancelled': return '#ef4444';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#666';
    }
  };

  return (
    <div className="section">
      <h1 style={{ marginBottom: '30px' }}>🚗 Driver Dashboard</h1>

      {/* Online Status Toggle */}
      <div className="card" style={{ marginBottom: '30px', backgroundColor: onlineStatus ? '#dcfce7' : '#f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0' }}>Your Status</h3>
            <p style={{ margin: '0', color: '#666' }}>Currently <strong>{onlineStatus ? '🟢 Online' : '🔘 Offline'}</strong></p>
          </div>
          <button
            onClick={toggleOnlineStatus}
            className="btn"
            style={{
              backgroundColor: onlineStatus ? '#ef4444' : '#16a34a',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {onlineStatus ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
        {['dashboard', 'earnings', 'bookings', 'profile'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn"
            style={{
              backgroundColor: activeTab === tab ? '#16a34a' : 'transparent',
              color: activeTab === tab ? 'white' : '#666',
              borderRadius: '0',
              borderBottom: activeTab === tab ? '3px solid #16a34a' : 'none',
              position: 'relative'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'bookings' && newBookingCount > 0 && (
              <span style={{
                position: 'absolute', top: '-8px', right: '-8px',
                backgroundColor: '#ef4444', color: '#fff', borderRadius: '50%',
                width: '22px', height: '22px', fontSize: '12px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {newBookingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-4">
          <div className="card" style={{ backgroundColor: '#1a2332', borderLeft: '4px solid #16a34a' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>Today's Earnings</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₹0</p>
          </div>
          <div className="card" style={{ backgroundColor: '#1a2e1a', borderLeft: '4px solid #10b981' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Total Earnings</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₹{earnings.totalEarnings || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#2e2a1a', borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>Total Rides</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{earnings.totalRides || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>Online Hours</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>0 hrs</p>
          </div>
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="card">
          <h3>Earnings & Withdrawals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div style={{ padding: '20px', backgroundColor: '#1a2332', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 10px 0', color: '#666' }}>Available Balance</p>
              <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>
                ₹{earnings.totalEarnings || 0}
              </p>
            </div>
            <div>
              <button className="btn btn-primary" style={{ width: '100%' }}>
                Request Withdrawal
              </button>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Minimum withdrawal: ₹100
              </p>
            </div>
          </div>

          <h4>Payment Methods</h4>
          <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p><strong>Bank Account:</strong> {earnings.bankDetails?.accountNumber || 'Not added'}</p>
            <p><strong>UPI:</strong> {earnings.upiId || 'Not added'}</p>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          {/* New Booking Notifications */}
          {bookings.filter(b => b.status === 'pending').length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 15px', color: '#f59e0b' }}>🔔 New Booking Requests</h3>
              {bookings.filter(b => b.status === 'pending').map(booking => (
                <div key={booking._id} className="card" style={{
                  marginBottom: '16px', borderLeft: '4px solid #f59e0b',
                  backgroundColor: '#1a1a2e', animation: 'pulse 2s infinite'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px', color: '#ffffff' }}>
                        📋 Booking #{booking.bookingId || booking._id.slice(-6)}
                      </h4>
                      <p style={{ margin: '4px 0', color: '#e0e0e0' }}>
                        <strong>👤 Customer:</strong> {booking.customerId?.name || 'N/A'} — {booking.customerId?.phone || 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0', color: '#e0e0e0' }}>
                        <strong>📍 Pickup:</strong> {booking.pickupLocation?.address || 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0', color: '#e0e0e0' }}>
                        <strong>📍 Drop:</strong> {booking.dropLocation?.address || 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0', color: '#e0e0e0' }}>
                        <strong>📅 Date:</strong> {booking.startDate ? new Date(booking.startDate).toLocaleString('en-IN') : 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0', color: '#e0e0e0' }}>
                        <strong>🚗 Type:</strong> {booking.bookingType} | <strong>Days:</strong> {booking.numberOfDays || 1}
                      </p>
                      {booking.notes && <p style={{ margin: '4px 0', color: '#666' }}><strong>📝 Notes:</strong> {booking.notes}</p>}
                      <p style={{ margin: '4px 0', color: '#16a34a', fontWeight: 'bold' }}>
                        💰 Est. Price: ₹{booking.estimatedPrice || booking.finalPrice || 0}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn"
                        style={{ backgroundColor: '#16a34a', color: '#fff', padding: '10px 24px', fontWeight: 'bold' }}
                        onClick={() => handleBookingAction(booking._id, 'accept')}
                      >
                        ✅ Accept
                      </button>
                      <button
                        className="btn"
                        style={{ backgroundColor: '#ef4444', color: '#fff', padding: '10px 24px', fontWeight: 'bold' }}
                        onClick={() => handleBookingAction(booking._id, 'reject')}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Bookings History */}
          <h3 style={{ margin: '0 0 15px' }}>📋 All Bookings</h3>
          {bookings.length === 0 ? (
            <div className="card">
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No bookings yet. Go online to receive booking requests!</p>
            </div>
          ) : (
            bookings.filter(b => b.status !== 'pending').map(booking => (
              <div key={booking._id} className="card" style={{ marginBottom: '12px', borderLeft: `4px solid ${getStatusColor(booking.status)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                      #{booking.bookingId || booking._id.slice(-6)} — {booking.customerId?.name || 'Customer'}
                    </p>
                    <p style={{ margin: '2px 0', color: '#666', fontSize: '13px' }}>
                      {booking.pickupLocation?.address || 'N/A'} → {booking.dropLocation?.address || 'N/A'}
                    </p>
                    <p style={{ margin: '2px 0', color: '#666', fontSize: '13px' }}>
                      {booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-IN') : ''} • {booking.bookingType} • ₹{booking.finalPrice || booking.estimatedPrice || 0}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    backgroundColor: getStatusColor(booking.status) + '22',
                    color: getStatusColor(booking.status),
                    border: `1px solid ${getStatusColor(booking.status)}44`
                  }}>
                    {booking.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3>Driver Profile</h3>
          
          {/* Profile Picture */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={driverInfo?.profilePicture 
                  ? `http://localhost:5000/${driverInfo.profilePicture}` 
                  : 'https://randomuser.me/api/portraits/men/31.jpg'}
                alt="Profile"
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #16a34a' }}
              />
              <label style={{
                position: 'absolute', bottom: '0', right: '0',
                backgroundColor: '#16a34a', color: '#fff', borderRadius: '50%',
                width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '18px', border: '2px solid #fff'
              }}>
                📷
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB allowed'); return; }
                    try {
                      const res = await api.updateProfilePicture(file);
                      if (res.profilePicture) {
                        setDriverInfo(prev => ({ ...prev, profilePicture: res.profilePicture }));
                        alert('Profile picture updated!');
                      } else {
                        alert(res.error || 'Upload failed');
                      }
                    } catch { alert('Upload failed'); }
                  }}
                />
              </label>
            </div>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>Click 📷 to change photo</p>
          </div>

          {/* Driver Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Name</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.name || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Phone</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.phone || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Email</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.email || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Status</p>
              <p style={{ margin: 0, fontWeight: 'bold', color: driverInfo?.status === 'approved' ? '#16a34a' : '#f59e0b' }}>
                {driverInfo?.status?.toUpperCase() || 'PENDING'}
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Aadhaar</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.aadhaarNumber || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>License</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{driverInfo?.licenseNumber || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
