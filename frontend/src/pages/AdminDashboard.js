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

  // Real-time fetch for drivers and bookings
  useEffect(() => {
    let interval;
    if (['drivers', 'live'].includes(activeTab)) {
      const fetchDrivers = async () => {
        const allDrivers = await api.getAllDrivers();
        setDrivers(allDrivers);
      };
      fetchDrivers();
      interval = setInterval(fetchDrivers, 10000);
    }
    if (activeTab === 'bookings') {
      const fetchBookings = async () => {
        const allBookings = await api.getAllBookings();
        setBookings(allBookings);
      };
      fetchBookings();
      interval = setInterval(fetchBookings, 10000);
    }
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
        {['dashboard', 'bookings', 'drivers', 'registrations', 'customers', 'live', 'enquiries'].map(tab => (
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
      {/* Drivers */}
      {activeTab === 'drivers' && (
        <div className="grid grid-1">
          {drivers.map(driver => (
            <div key={driver._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{driver.name}</h3>
                  <p>Phone: {driver.phone}</p>
                  <p>Status: <span style={{ fontWeight: 'bold', color: driver.status === 'approved' ? '#16a34a' : '#f59e0b' }}>{driver.status}</span></p>
                  <p>Online: {driver.isOnline ? 'Yes' : 'No'}</p>
                  <p>City: {driver.personalDetails?.city}</p>
                  <p>Income: ₹{driver.experience?.totalEarnings || 0}</p>
                  <p>Trips: {driver.experience?.totalRides || 0}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleApproveDriver(driver._id)} className="btn btn-primary">Approve</button>
                  <button onClick={() => handleRejectDriver(driver._id)} className="btn btn-danger">Reject</button>
                  <button onClick={() => api.removeDriver(driver._id).then(fetchDashboardData)} className="btn btn-danger">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Drivers */}
      {activeTab === 'live' && (
        <div className="grid grid-1">
          {drivers.filter(d => d.isOnline).length === 0 && <div>No drivers online.</div>}
          {drivers.filter(d => d.isOnline).map(driver => (
            <div key={driver._id} className="card">
              <h3>{driver.name} ({driver.personalDetails?.city})</h3>
              <p>Phone: {driver.phone}</p>
              <p>Status: <span style={{ fontWeight: 'bold', color: '#16a34a' }}>Online</span></p>
              <p>Current Location: {driver.currentLocation?.latitude}, {driver.currentLocation?.longitude}</p>
              <p>Trips: {driver.experience?.totalRides || 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Customers */}
      {activeTab === 'customers' && (
        <div className="grid grid-1">
          {/* Placeholder: Implement customer management here */}
          <div>Customer management coming soon.</div>
        </div>
      )}

      {/* Enquiries */}
      {activeTab === 'enquiries' && (
        <div className="grid grid-1">
          {/* Placeholder: Implement enquiry management here */}
          <div>Enquiry management coming soon.</div>
        </div>
      )}

      {loading && <div className="loading">Loading...</div>}

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-4">
          <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderLeft: '4px solid #16a34a' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>Total Drivers</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{stats.totalDrivers || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Total Customers</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{stats.totalCustomers || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>Total Bookings</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{stats.totalBookings || 0}</p>
          </div>
          <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderLeft: '4px solid #3b82f6' }}>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderBottom: '2px solid rgba(34, 197, 94, 0.1)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Booking ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Driver</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id} style={{ borderBottom: '1px solid rgba(34, 197, 94, 0.06)' }}>
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
                      backgroundColor: booking.status === 'completed' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: booking.status === 'completed' ? '#4ade80' : '#fbbf24'
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

      {/* Driver Registrations - Enhanced */}
      {activeTab === 'registrations' && (
        <div className="grid grid-1">
          {registrations.map(driver => (
            <div key={driver._id} className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', alignItems: 'center' }}>
                {/* Driver Info */}
                <div>
                  <h3>{driver.name}</h3>
                  <p>Phone: {driver.phone}</p>
                  <p>Status: <span style={{ fontWeight: 'bold', color: driver.status === 'approved' ? '#16a34a' : driver.status === 'rejected' ? '#dc2626' : '#f59e0b' }}>{driver.status}</span></p>
                  <p>City: {driver.personalDetails?.city}</p>
                  <p>Registered: {new Date(driver.createdAt).toLocaleString()}</p>
                </div>
                {/* Payment & Documents */}
                <div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>💳 Payment Screenshot:</strong><br />
                    {driver.paymentVerification?.screenshotUrl ? (
                      <a href={driver.paymentVerification.screenshotUrl} target="_blank" rel="noopener noreferrer">
                        <img src={driver.paymentVerification.screenshotUrl} alt="Payment Screenshot" style={{ maxWidth: '120px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '6px' }} />
                      </a>
                    ) : (
                      <span style={{ color: '#f59e0b' }}>Not uploaded</span>
                    )}
                    <div>Status: <span style={{ color: driver.paymentVerification?.status === 'verified' ? '#16a34a' : driver.paymentVerification?.status === 'rejected' ? '#dc2626' : '#f59e0b' }}>{driver.paymentVerification?.status || 'pending'}</span></div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>📄 Documents:</strong>
                    <ul style={{ paddingLeft: '18px', margin: 0 }}>
                      <li>Aadhar: <span style={{ color: driver.documents?.aadhar?.verified ? '#16a34a' : '#f59e0b' }}>{driver.documents?.aadhar?.verified ? 'Verified' : 'Pending'}</span></li>
                      <li>PAN: <span style={{ color: driver.documents?.pan?.verified ? '#16a34a' : '#f59e0b' }}>{driver.documents?.pan?.verified ? 'Verified' : 'Pending'}</span></li>
                      <li>License: <span style={{ color: driver.documents?.drivingLicense?.verified ? '#16a34a' : '#f59e0b' }}>{driver.documents?.drivingLicense?.verified ? 'Verified' : 'Pending'}</span></li>
                      <li>Selfie: <span style={{ color: driver.documents?.selfie?.verified ? '#16a34a' : '#f59e0b' }}>{driver.documents?.selfie?.verified ? 'Verified' : 'Pending'}</span></li>
                    </ul>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => handleApproveDriver(driver._id)}
                    className="btn btn-primary"
                    disabled={
                      driver.status === 'approved' ||
                      driver.paymentVerification?.status !== 'verified' ||
                      !driver.documents?.aadhar?.verified ||
                      !driver.documents?.pan?.verified ||
                      !driver.documents?.drivingLicense?.verified ||
                      !driver.documents?.selfie?.verified
                    }
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectDriver(driver._id)}
                    className="btn btn-danger"
                    disabled={driver.status === 'rejected'}
                  >
                    Reject
                  </button>
                  {/* Optionally: Add verify/reject buttons for payment/documents here for full workflow */}
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
