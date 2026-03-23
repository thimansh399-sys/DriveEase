import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const statsRes = await api.getAdminStats();
        setStats(statsRes);
      } else if (activeTab === 'bookings') {
        const bookingsRes = await api.getAllBookings();
        setBookings(bookingsRes);
      } else if (activeTab === 'registrations') {
        const regsRes = await api.getDriverRegistrations('all');
        setRegistrations(regsRes);
      } else if (activeTab === 'customers') {
        // Fetch customers
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDriver = async (driverId) => {
    try {
      await api.approveDriver(driverId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving driver:', error);
    }
  };

  const handleRejectDriver = async (driverId) => {
    try {
      await api.rejectDriver(driverId, 'Documents not verified');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting driver:', error);
    }
  };

  const handleExportBookings = async () => {
    try {
      const blob = await api.exportBookingsToExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bookings.csv');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  useEffect(() => {
    const playNotificationSound = (soundUrl) => {
      const audio = new Audio(soundUrl);
      audio.play().catch((error) => console.error('Error playing notification sound:', error));
    };

    // Simulate a notification alert
    const simulateNotification = () => {
      playNotificationSound('/notification.mp3');
      alert('New booking received!');
    };

    // Example: Trigger notification every 30 seconds
    const interval = setInterval(simulateNotification, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="section">
      <h1 style={{ marginBottom: '30px' }}>🔐 Admin Dashboard (Password Protected)</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
        {['dashboard', 'bookings', 'drivers', 'registrations', 'customers'].map(tab => (
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

      {loading && <div className="loading">Loading...</div>}

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-4">
          <div className="card" style={{ backgroundColor: '#f0f9ff', borderLeft: '4px solid #16a34a' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>Total Drivers</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{stats.totalDrivers || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Total Customers</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{stats.totalCustomers || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>Total Bookings</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{stats.totalBookings || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: '#dbeafe', borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>Total Earnings</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>₹{stats.totalEarnings || 0}</p>
          </div>
        </div>
      )}

      {/* Bookings */}
      {activeTab === 'bookings' && (
        <>
          <button onClick={handleExportBookings} className="btn btn-primary" style={{ marginBottom: '20px' }}>
            📥 Export to Excel
          </button>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Booking ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Driver</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{booking.bookingId}</td>
                  <td style={{ padding: '12px' }}>{booking.customerId?.name}</td>
                  <td style={{ padding: '12px' }}>{booking.driverId?.name || 'Unassigned'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: booking.status === 'completed' ? '#dcfce7' : '#fef3c7',
                      color: booking.status === 'completed' ? '#15803d' : '#92400e'
                    }}>
                      {booking.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>₹{booking.finalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Driver Registrations */}
      {activeTab === 'registrations' && (
        <div className="grid grid-1">
          {registrations.map(driver => (
            <div key={driver._id} className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
                <div>
                  <h3>{driver.name}</h3>
                  <p>Phone: {driver.phone}</p>
                  <p>Status: <span style={{ fontWeight: 'bold', color: driver.status === 'approved' ? '#16a34a' : '#f59e0b' }}>{driver.status}</span></p>
                </div>
                <div>
                  <p><strong>Documents:</strong></p>
                  <p>✓ Aadhar: {driver.documents.aadhar.verified ? 'Verified' : 'Pending'}</p>
                  <p>✓ PAN: {driver.documents.pancard.verified ? 'Verified' : 'Pending'}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleApproveDriver(driver._id)} className="btn btn-primary">
                    Approve
                  </button>
                  <button onClick={() => handleRejectDriver(driver._id)} className="btn btn-danger">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
