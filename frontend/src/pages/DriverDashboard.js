import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/DriverDashboard.css';

function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [earnings, setEarnings] = useState({});
  const [loading, setLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);

  useEffect(() => {
    fetchDriverData();
    const interval = setInterval(fetchDriverData, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const userId = localStorage.getItem('userId');
        const response = await api.api.getDriverEarnings(userId);
        setEarnings(response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      setOnlineStatus(!onlineStatus);
      // Call API to update status
      alert(`You are now ${!onlineStatus ? 'Online' : 'Offline'}`);
    } catch (error) {
      console.error('Error updating status:', error);
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
              borderBottom: activeTab === tab ? '3px solid #16a34a' : 'none'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-4">
          <div className="card" style={{ backgroundColor: '#f0f9ff', borderLeft: '4px solid #16a34a' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>Today's Earnings</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₹0</p>
          </div>
          <div className="card" style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Total Earnings</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₹{earnings.totalEarnings || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>Total Rides</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{earnings.totalRides || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#dbeafe', borderLeft: '4px solid #3b82f6' }}>
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
            <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
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
          <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p><strong>Bank Account:</strong> {earnings.bankDetails?.accountNumber || 'Not added'}</p>
            <p><strong>UPI:</strong> {earnings.upiId || 'Not added'}</p>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="card">
          <h3>Active Bookings</h3>
          <p style={{ color: '#666' }}>No active bookings right now.</p>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3>Driver Profile</h3>
          <p style={{ color: '#666' }}>Edit your profile and details here.</p>
          <button className="btn btn-primary">Edit Profile</button>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
