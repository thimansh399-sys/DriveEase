import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AvailableDrivers.css';
import { buildApiUrl, buildAssetUrl } from '../utils/network';

export default function AvailableDriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    minRating: 0,
    onlineOnly: false
  });
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);


  // Fetch all drivers - publicly accessible, with polling for auto-refresh
  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(buildApiUrl('/public/available'));
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Backend server not accessible. API returned non-JSON response.');
        }
        throw new Error('Failed to fetch drivers');
      }
      
      const data = await response.json();
      setDrivers(data || []);
      setFilteredDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError(error.message || 'Unable to fetch drivers. Please try again later.');
      setDrivers([]);
      setFilteredDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = drivers;

    if (filters.city) {
      filtered = filtered.filter(d => 
        d.currentLocation?.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter(d => (d.rating?.averageRating || 0) >= filters.minRating);
    }

    if (filters.onlineOnly) {
      filtered = filtered.filter(d => d.isOnline);
    }

    setFilteredDrivers(filtered);
  }, [filters, drivers]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBookNow = (driver) => {
    setSelectedDriver(driver);
    // Redirect to integrated booking page with driver pre-selected
    navigate(`/book-driver?driverId=${driver._id}`);
  };

  return (
    <div className="available-drivers-container">
      {/* Floating Filter Button */}
      <button
        className="floating-filter-btn"
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          background: '#22c55e',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 60,
          height: 60,
          boxShadow: '0 4px 16px rgba(34,197,94,0.18)',
          fontSize: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setShowFilterModal(true)}
        aria-label="Open Filters"
      >
        <span role="img" aria-label="filter">🔍</span>
      </button>

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="filter-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="filter-modal"
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              minWidth: 320,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              color: '#222',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 28,
                color: '#888',
                cursor: 'pointer',
              }}
              onClick={() => setShowFilterModal(false)}
              aria-label="Close"
            >×</button>
            <h2 style={{ marginBottom: 18, fontWeight: 700, fontSize: 22 }}>Filter Drivers</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>
                <input
                  type="checkbox"
                  name="onlineOnly"
                  checked={filters.onlineOnly}
                  onChange={e => setFilters(f => ({ ...f, onlineOnly: e.target.checked }))}
                  style={{ marginRight: 8 }}
                />
                Online Only
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Minimum Rating</label>
              <select
                name="minRating"
                value={filters.minRating}
                onChange={e => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))}
                style={{ marginLeft: 12, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
              >
                <option value={0}>All Ratings</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>City</label>
              <input
                type="text"
                name="city"
                placeholder="Enter city name"
                value={filters.city}
                onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                style={{ marginLeft: 12, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button
                style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowFilterModal(false)}
              >Apply</button>
              <button
                style={{ background: '#f3f4f6', color: '#222', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 500, cursor: 'pointer' }}
                onClick={() => { setFilters({ city: '', minRating: 0, onlineOnly: false }); setShowFilterModal(false); }}
              >Reset</button>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="drivers-hero">
        <div className="hero-content">
          <h1>Available Drivers in Your City</h1>
          <p>Choose from verified, professional drivers ready to serve you</p>
        </div>
      </div>

      <div className="drivers-wrapper">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <h3>Filter Drivers</h3>
          
          <div className="filter-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              placeholder="Enter city name"
              value={filters.city}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Minimum Rating</label>
            <select
              name="minRating"
              value={filters.minRating}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value={0}>All Ratings</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>

          <div className="filter-group checkbox">
            <label>
              <input
                type="checkbox"
                name="onlineOnly"
                checked={filters.onlineOnly}
                onChange={handleFilterChange}
              />
              <span>Online Now</span>
            </label>
          </div>

          <button className="filter-reset" onClick={() => {
            setFilters({ city: '', minRating: 0, onlineOnly: false });
          }}>
            Reset Filters
          </button>
        </div>

        {/* Drivers Grid */}
        <div className="drivers-content">
          {error && (
            <div className="no-drivers" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ color: '#fca5a5', fontWeight: 'bold', marginBottom: '16px' }}>⚠️ {error}</p>
              <button 
                onClick={fetchDrivers}
                style={{ padding: '10px 20px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Retry
              </button>
            </div>
          )}

          {!error && loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading available drivers...</p>
            </div>
          )}

          {!error && !loading && filteredDrivers.length === 0 && (
            <div className="no-drivers">
              <p>No drivers available with selected filters</p>
              <button onClick={() => setFilters({ city: '', minRating: 0, onlineOnly: false })}>
                Clear Filters
              </button>
            </div>
          )}

          <div className="drivers-grid">
            {filteredDrivers.map(driver => (
              <div key={driver._id} className="driver-card">
                {/* Online Badge */}
                {driver.isOnline && (
                  <div className="online-badge">
                    <span className="online-dot"></span>
                    Online
                  </div>
                )}

                {/* Profile Section */}
                <div className="driver-profile">
                  <div className="profile-image">
                    {driver.profilePicture ? (
                      <img
                        src={buildAssetUrl(driver.profilePicture)}
                        alt={driver.name}
                        onError={(event) => {
                          event.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
                        }}
                      />
                    ) : (
                      <div className="profile-placeholder">
                        <span>{driver.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  <div className="profile-info">
                    <h3>{driver.name}</h3>
                    <div className="rating">
                      <span className="stars">
                        {'⭐'.repeat(Math.floor(driver.rating?.averageRating || 0))}
                      </span>
                      <span className="rating-value">
                        {(driver.rating?.averageRating || 0).toFixed(1)} ({driver.rating?.totalRatings || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="vehicle-info">
                  <div className="info-item">
                    <span className="label">Vehicle</span>
                    <span className="value">{driver.vehicle?.model || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Register #</span>
                    <span className="value">{driver.vehicle?.registrationNumber || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Seats</span>
                    <span className="value">{driver.vehicle?.seatCapacity || 4}</span>
                  </div>
                </div>

                {/* Experience & Trips */}
                <div className="experience-info">
                  <div className="experience-card">
                    <span className="experience-label">Experience</span>
                    <span className="experience-value">{driver.experience?.yearsOfExperience || 0} years</span>
                  </div>
                  <div className="experience-card">
                    <span className="experience-label">Completed Rides</span>
                    <span className="experience-value">{driver.experience?.totalRides || 0}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="location-info">
                  <span className="location-icon">📍</span>
                  <span>
                    {driver.currentLocation?.city || driver.personalDetails?.city}, {driver.currentLocation?.state || driver.personalDetails?.state}
                  </span>
                </div>

                {/* Services Badge */}
                <div className="services-badges">
                  {driver.training?.etiquetteTraining && (
                    <span className="badge etiquette">Etiquette Trained</span>
                  )}
                  {driver.training?.safetyTraining && (
                    <span className="badge safety">Safety Trained</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="driver-actions">
                  <button
                    className="btn-view-profile"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    View Profile
                  </button>
                  <button
                    className="btn-book-now"
                    onClick={() => handleBookNow(driver)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedDriver && (
        <div className="profile-modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedDriver(null)}>×</button>
            
            <div className="modal-content">
              <div className="modal-header">
                {selectedDriver.profilePicture ? (
                  <img 
                    src={buildAssetUrl(selectedDriver.profilePicture)}
                    alt={selectedDriver.name}
                    className="modal-profile-image"
                    onError={(event) => {
                      event.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
                    }}
                  />
                ) : (
                  <div className="profile-placeholder-large">
                    <span>{selectedDriver.name?.charAt(0)}</span>
                  </div>
                )}
                <div className="modal-header-info">
                  <h2>{selectedDriver.name}</h2>
                  <div className="rating">
                    <span className="stars">
                      {'⭐'.repeat(Math.floor(selectedDriver.rating?.averageRating || 0))}
                    </span>
                    <span className="rating-value">
                      {(selectedDriver.rating?.averageRating || 0).toFixed(1)} ({selectedDriver.rating?.totalRatings || 0})
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-details">
                <div className="detail-section">
                  <h4>Vehicle Information</h4>
                  <p><strong>Model:</strong> {selectedDriver.vehicle?.model}</p>
                  <p><strong>Registration:</strong> {selectedDriver.vehicle?.registrationNumber}</p>
                  <p><strong>Color:</strong> {selectedDriver.vehicle?.color}</p>
                  <p><strong>Capacity:</strong> {selectedDriver.vehicle?.seatCapacity} seats</p>
                </div>

                <div className="detail-section">
                  <h4>Experience & Statistics</h4>
                  <p><strong>Experience:</strong> {selectedDriver.experience?.yearsOfExperience} years</p>
                  <p><strong>Total Rides:</strong> {selectedDriver.experience?.totalRides}</p>
                  <p><strong>Total Earnings:</strong> ₹{selectedDriver.experience?.totalEarnings?.toLocaleString() || '0'}</p>
                </div>

                <div className="detail-section">
                  <h4>Location</h4>
                  <p>{selectedDriver.currentLocation?.city || selectedDriver.personalDetails?.city}, {selectedDriver.currentLocation?.state || selectedDriver.personalDetails?.state}</p>
                  <p>Pincode: {selectedDriver.currentLocation?.pincode || selectedDriver.personalDetails?.pincode}</p>
                </div>

                <div className="detail-section">
                  <h4>Certifications</h4>
                  <div className="certifications">
                    {selectedDriver.training?.etiquetteTraining && (
                      <span className="cert-badge">✓ Etiquette Training</span>
                    )}
                    {selectedDriver.training?.safetyTraining && (
                      <span className="cert-badge">✓ Safety Training</span>
                    )}
                    {selectedDriver.backgroundVerification?.status === 'verified' && (
                      <span className="cert-badge">✓ Background Check</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-book-now-modal" onClick={() => handleBookNow(selectedDriver)}>
                  Book This Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
