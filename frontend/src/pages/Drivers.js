import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOnlineDrivers = async () => {
    setLoading(true);
    try {
      const response = await api.getAllDrivers('?isOnline=true');
      setDrivers(Array.isArray(response) ? response : []);
    } catch (err) {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineDrivers();
    const interval = setInterval(fetchOnlineDrivers, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Online Drivers</h1>
      {loading ? (
        <p>Loading drivers...</p>
      ) : drivers.length === 0 ? (
        <p>No drivers are online right now.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {drivers.map(driver => (
            <div key={driver._id} style={{ border: '1px solid #16a34a', borderRadius: 12, padding: 20, minWidth: 320, background: '#10151a', color: '#fff', boxShadow: '0 2px 8px #16a34a22', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                <span style={{ fontSize: 13, color: '#16a34a' }}>Online</span>
              </span>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 22 }}>{driver.name}</h2>
              <div style={{ marginBottom: 6 }}><b>City:</b> {driver.personalDetails?.city || '-'} ({driver.personalDetails?.state || '-'})</div>
              <div style={{ marginBottom: 6 }}><b>Phone:</b> {driver.phone || '-'}</div>
              <div style={{ marginBottom: 6 }}><b>Experience:</b> {driver.experience?.yearsOfExperience || '-'} yrs</div>
              <div style={{ marginBottom: 6 }}><b>Languages:</b> {driver.languages?.join(', ') || '-'}</div>
              <div style={{ marginBottom: 6 }}><b>Rating:</b> {driver.rating?.averageRating || '-'} ({driver.rating?.totalRatings || 0} ratings)</div>
              <div style={{ marginBottom: 6 }}><b>License No:</b> {driver.licenseNumber || '-'}</div>
              <div style={{ marginBottom: 6 }}><b>Vehicle Type:</b> {driver.vehicleType || '-'}</div>
              <div style={{ marginBottom: 6 }}><b>Verified:</b> {driver.isVerified ? 'Yes' : 'No'}</div>
              <div style={{ marginBottom: 6 }}><b>Subscription:</b> {driver.subscription?.planName || 'None'}</div>
              <div style={{ marginTop: 12 }}>
                <button style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => window.location.href = `/drivers/${driver._id}`}>View Profile</button>
                <button style={{ background: '#222', color: '#16a34a', border: '1px solid #16a34a', borderRadius: 6, padding: '8px 18px', fontWeight: 600, marginLeft: 10, cursor: 'pointer' }} onClick={() => window.location.href = `/booking/${driver._id}`}>Book Now</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}