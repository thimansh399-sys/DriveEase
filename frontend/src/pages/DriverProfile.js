import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/DriverProfile.css';

export default function DriverProfile() {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        setLoading(true);
        const response = await api.getDriverProfile();
        setDriver(response?.driver || response);
        setError('');
      } catch (err) {
        setError(err?.message || 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, []);

  if (loading) {
    return <div className="driver-profile-container"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="driver-profile-container"><p style={{ color: '#fca5a5' }}>Error: {error}</p></div>;
  }

  if (!driver) {
    return <div className="driver-profile-container"><p>No profile data available</p></div>;
  }

  const personalDetails = driver.personalDetails || {};
  const vehicleInfo = driver.vehicle || {};
  const documents = driver.documents || {};
  const bankDetails = driver.bankDetails || {};
  const rating = driver.rating || {};
  const experience = driver.experience || {};

  return (
    <div className="driver-profile-container">
      <div className="driver-profile-shell">
        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-photo-wrapper">
            {driver.profilePicture ? (
              <img src={driver.profilePicture} alt={driver.name} className="profile-photo" />
            ) : (
              <div className="profile-photo-placeholder">
                <span>📷</span>
              </div>
            )}
          </div>
          <div className="profile-header-info">
            <h1>{driver.name}</h1>
            <p className="profile-subtext">{personalDetails.city || '-'}, {personalDetails.state || '-'}</p>
            <p className="profile-contact">📱 {driver.phone}</p>
            <p className="profile-contact">✉️ {driver.email || 'N/A'}</p>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="stat-value">⭐ {rating.averageRating?.toFixed(1) || '0'}</div>
            <div className="stat-label">Rating ({rating.totalRatings || 0} reviews)</div>
          </div>
          <div className="profile-stat-card">
            <div className="stat-value">🚗 {experience.totalRides || 0}</div>
            <div className="stat-label">Total Rides</div>
          </div>
          <div className="profile-stat-card">
            <div className="stat-value">💰 ₹{(experience.totalEarnings || 0).toLocaleString()}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            👤 Personal Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'vehicle' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicle')}
          >
            🚗 Vehicle Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            🪪 Documents
          </button>
          <button
            className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            💰 Account Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="profile-tab-content">
              <h2>👤 Personal Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name</label>
                  <p>{driver.name || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <p>{driver.phone || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{driver.email || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label>Date of Birth</label>
                  <p>{personalDetails.dateOfBirth ? new Date(personalDetails.dateOfBirth).toLocaleDateString() : '-'}</p>
                </div>
                <div className="info-item">
                  <label>Address</label>
                  <p>{personalDetails.address || '-'}</p>
                </div>
                <div className="info-item">
                  <label>City</label>
                  <p>{personalDetails.city || '-'}</p>
                </div>
                <div className="info-item">
                  <label>State</label>
                  <p>{personalDetails.state || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Pincode</label>
                  <p>{personalDetails.pincode || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Blood Group</label>
                  <p>{personalDetails.bloodGroup || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Years of Experience</label>
                  <p>{experience.yearsOfExperience || '0'} years</p>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Info Tab */}
          {activeTab === 'vehicle' && (
            <div className="profile-tab-content">
              <h2>🚗 Vehicle Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Vehicle Model</label>
                  <p>{vehicleInfo.model || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Registration Number</label>
                  <p className="highlight">{vehicleInfo.registrationNumber || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Color</label>
                  <p>{vehicleInfo.color || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Seat Capacity</label>
                  <p>{vehicleInfo.seatCapacity || '-'} seats</p>
                </div>
                <div className="info-item">
                  <label>Insurance Expiry</label>
                  <p>{vehicleInfo.insuranceExpiry ? new Date(vehicleInfo.insuranceExpiry).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="profile-tab-content">
              <h2>🪪 Documents & Verification</h2>
              <div className="documents-grid">
                <div className="doc-card">
                  <h3>Driving License</h3>
                  <p><strong>License Number:</strong> {documents.drivingLicense?.number || '-'}</p>
                  <p><strong>Expiry Date:</strong> {documents.drivingLicense?.expiryDate ? new Date(documents.drivingLicense.expiryDate).toLocaleDateString() : '-'}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`badge ${documents.drivingLicense?.verified ? 'verified' : 'pending'}`}>
                      {documents.drivingLicense?.verified ? '✅ Verified' : '⏳ Pending Verification'}
                    </span>
                  </p>
                  {documents.drivingLicense?.file && (
                    <a href={documents.drivingLicense.file} target="_blank" rel="noopener noreferrer" className="doc-link">
                      View Document →
                    </a>
                  )}
                </div>

                <div className="doc-card">
                  <h3>Aadhaar / ID Proof</h3>
                  <p><strong>Aadhaar Number:</strong> {documents.aadhar?.number ? `****${documents.aadhar.number.slice(-4)}` : '-'}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`badge ${documents.aadhar?.verified ? 'verified' : 'pending'}`}>
                      {documents.aadhar?.verified ? '✅ Verified' : '⏳ Pending Verification'}
                    </span>
                  </p>
                  {documents.aadhar?.file && (
                    <a href={documents.aadhar.file} target="_blank" rel="noopener noreferrer" className="doc-link">
                      View Document →
                    </a>
                  )}
                </div>

                <div className="doc-card">
                  <h3>Selfie Verification</h3>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`badge ${documents.selfie?.verified ? 'verified' : 'pending'}`}>
                      {documents.selfie?.verified ? '✅ Verified' : '⏳ Pending Verification'}
                    </span>
                  </p>
                  {documents.selfie?.file && (
                    <a href={documents.selfie.file} target="_blank" rel="noopener noreferrer" className="doc-link">
                      View Document →
                    </a>
                  )}
                </div>

                <div className="doc-card">
                  <h3>Insurance Certificate</h3>
                  <p><strong>Expiry Date:</strong> {vehicleInfo.insuranceExpiry ? new Date(vehicleInfo.insuranceExpiry).toLocaleDateString() : '-'}</p>
                  <p style={{ color: '#888' }}>Upload via vehicle details section</p>
                </div>
              </div>
            </div>
          )}

          {/* Account Info Tab */}
          {activeTab === 'account' && (
            <div className="profile-tab-content">
              <h2>💰 Account & Payment Information</h2>
              <div className="account-section">
                <h3>UPI Payments</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>UPI ID</label>
                    <p className="highlight">{driver.upiId || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="account-section">
                <h3>Bank Account Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Account Holder Name</label>
                    <p>{bankDetails.accountHolder || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Account Number</label>
                    <p className="highlight">{bankDetails.accountNumber ? `****${bankDetails.accountNumber.slice(-4)}` : '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>IFSC Code</label>
                    <p>{bankDetails.ifscCode || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Bank Name</label>
                    <p>{bankDetails.bankName || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Verification Status</label>
                    <span className={`badge ${bankDetails.verified ? 'verified' : 'pending'}`}>
                      {bankDetails.verified ? '✅ Verified' : '⏳ Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="account-section">
                <h3>Earnings Summary</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Total Earnings</label>
                    <p className="highlight">₹{(experience.totalEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="info-item">
                    <label>Total Rides</label>
                    <p>{experience.totalRides || 0}</p>
                  </div>
                  <div className="info-item">
                    <label>Average Earning per Ride</label>
                    <p>₹{experience.totalRides > 0 ? (experience.totalEarnings / experience.totalRides).toFixed(2) : '0'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Dashboard Button */}
        <div className="profile-footer">
          <button
            onClick={() => navigate('/driver-dashboard')}
            className="btn-back-to-dashboard"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
