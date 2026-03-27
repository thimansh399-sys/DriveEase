import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AvailableDrivers.css';

export default function AvailableDriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    minRating: 0,
    onlineOnly: false
  });
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Fetch all drivers - publicly accessible
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/public/available`
      );
      
      if (!response.ok) throw new Error('Failed to fetch drivers');
      
      const data = await response.json();
      setDrivers(data);
      setFilteredDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
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
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading available drivers...</p>
            </div>
          )}

          {!loading && filteredDrivers.length === 0 && (
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
                      <img src={driver.profilePicture} alt={driver.name} />
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
                <img 
                  src={selectedDriver.profilePicture || 'https://via.placeholder.com/120'} 
                  alt={selectedDriver.name}
                  className="modal-profile-image"
                />
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
