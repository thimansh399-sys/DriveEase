import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LOCATIONIQ_TOKEN = process.env.REACT_APP_LOCATIONIQ_TOKEN || 'YOUR_LOCATIONIQ_TOKEN';

function LocationPicker({ position, setPosition, label }) {
  useMapEvents({
    click(e) {
      setPosition({ ...position, latitude: e.latlng.lat, longitude: e.latlng.lng });
    }
  });
  return <Marker position={[position.latitude, position.longitude]} />;
}

function Booking() {
  const navigate = useNavigate();
  const { driverId } = useParams();
  const [bookingData, setBookingData] = useState({
    bookingType: 'daily',
    numberOfDays: 1,
    startDate: '',
    insuranceOpted: false,
    insuranceType: 'per_ride'
  });
  const [locations, setLocations] = useState({
    pickup: { address: '', latitude: 28.6139, longitude: 77.2090 },
    drop: { address: '', latitude: 28.7041, longitude: 77.1025 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [filters, setFilters] = useState({ city: '', pincode: '', onlineOnly: false });

  // Try to get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocations(locs => ({
            ...locs,
            pickup: { ...locs.pickup, latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          }));
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // ...other hooks and handlers...

  const [tab, setTab] = useState('daily');
  return (
    <div className="booking-container" style={{ background: '#111', minHeight: '100vh', paddingTop: 40 }}>
      <div className="booking-content" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="booking-header" style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: '#27ae60', fontWeight: 900, fontSize: 36, letterSpacing: 1 }}>Book a Driver</h1>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          {['daily', 'rental', 'outstation'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? '#27ae60' : '#222',
                color: tab === t ? '#fff' : '#aaa',
                border: 'none',
                borderRadius: '20px 20px 0 0',
                padding: '10px 32px',
                fontWeight: 700,
                fontSize: 16,
                marginRight: 8,
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {/* Booking Card */}
        <form className="booking-form" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(39,174,96,0.08)', padding: 32 }}>
          {/* Pickup & Drop */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#222', marginBottom: 6, display: 'block' }}>Pickup Location</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f6f6f6', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ color: '#27ae60', fontSize: 20, marginRight: 8 }}>📍</span>
                <input className="form-input" type="text" placeholder="Current Location" style={{ border: 'none', background: 'transparent', flex: 1, fontSize: 15 }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#222', marginBottom: 6, display: 'block' }}>Drop Location</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f6f6f6', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ color: '#111', fontSize: 20, marginRight: 8 }}>🏁</span>
                <input className="form-input" type="text" placeholder="Enter Location" style={{ border: 'none', background: 'transparent', flex: 1, fontSize: 15 }} />
              </div>
            </div>
          </div>
          {/* Date, Time, Days */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#222', marginBottom: 6, display: 'block' }}>Date</label>
              <input className="form-input" type="date" style={{ width: '100%', borderColor: '#27ae60', borderRadius: 8, padding: '8px 12px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#222', marginBottom: 6, display: 'block' }}>Time</label>
              <input className="form-input" type="time" style={{ width: '100%', borderColor: '#27ae60', borderRadius: 8, padding: '8px 12px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#222', marginBottom: 6, display: 'block' }}>No. of Days</label>
              <input className="form-input" type="number" min="1" style={{ width: '100%', borderColor: '#27ae60', borderRadius: 8, padding: '8px 12px' }} />
            </div>
          </div>
          {/* Book Button */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(90deg,#27ae60 60%,#111 100%)', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 8, padding: '14px 48px', border: 'none', boxShadow: '0 4px 16px rgba(39,174,96,0.12)', cursor: 'pointer', letterSpacing: 1 }} type="submit">
              Book Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Booking;
