import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { buildAssetUrl } from '../utils/network';
import '../styles/DriverProfile.css';

export default function DriverProfile() {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [formData, setFormData] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState({
    aadhar: false,
    license: false,
    selfie: false
  });

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        setLoading(true);
        const response = await api.getDriverProfile();
        const driverData = response?.driver || response;
        setDriver(driverData);
        setFormData(JSON.parse(JSON.stringify(driverData)));
        setError('');
      } catch (err) {
        setError(err?.message || 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isEditing) return;
      try {
        const response = await api.getDriverProfile();
        const driverData = response?.driver || response;
        setDriver(driverData);
        setFormData(JSON.parse(JSON.stringify(driverData)));
      } catch (_) {
        // Ignore silent refresh failures; main fetch already handles errors.
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isEditing]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setSaveError('');
      setSaveSuccess('');

      const updatePayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        upiId: formData.upiId,
        personalDetails: formData.personalDetails || {},
        vehicle: formData.vehicle || {},
        bankDetails: formData.bankDetails || {},
        documents: formData.documents || {}
      };

      const response = await api.updateDriverProfile(updatePayload);
      
      if (response.error) {
        setSaveError(response.error);
      } else {
        setSaveSuccess('Profile updated successfully!');
        setDriver(formData);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      setSaveError(err?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(JSON.parse(JSON.stringify(driver)));
    setIsEditing(false);
    setSaveError('');
  };

  const handleDocumentUpload = async (type, file) => {
    if (!file || !driver?._id) return;

    try {
      setUploadingDoc((prev) => ({ ...prev, [type]: true }));
      setSaveError('');
      setSaveSuccess('');

      const result = await api.uploadDriverDocument(driver._id, type, file);
      if (result?.error) {
        throw new Error(result.error);
      }

      const refreshed = await api.getDriverProfile();
      const refreshedDriver = refreshed?.driver || refreshed;
      setDriver(refreshedDriver);
      setFormData(JSON.parse(JSON.stringify(refreshedDriver)));
      setSaveSuccess(`${type.toUpperCase()} uploaded successfully. Verification pending.`);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err?.message || `Failed to upload ${type}`);
    } finally {
      setUploadingDoc((prev) => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return <div className="driver-profile-container"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="driver-profile-container"><p style={{ color: '#fca5a5' }}>Error: {error}</p></div>;
  }

  if (!driver || !formData) {
    return <div className="driver-profile-container"><p>No profile data available</p></div>;
  }

  const personalDetails = (isEditing ? formData : driver).personalDetails || {};
  const vehicleInfo = (isEditing ? formData : driver).vehicle || {};
  const documents = (isEditing ? formData : driver).documents || {};
  const bankDetails = (isEditing ? formData : driver).bankDetails || {};
  const rating = (isEditing ? formData : driver).rating || {};
  const experience = (isEditing ? formData : driver).experience || {};
  const currentData = isEditing ? formData : driver;

  return (
    <div className="driver-profile-container">
      <div className="driver-profile-shell">
        {/* Header Section */}
        <div className="profile-header-wrapper">
          <div className="profile-header">
            <div className="profile-photo-wrapper">
              {currentData.profilePicture ? (
                <img src={buildAssetUrl(currentData.profilePicture)} alt={currentData.name} className="profile-photo" />
              ) : (
                <div className="profile-photo-placeholder">
                  <span>📷</span>
                </div>
              )}
            </div>
            <div className="profile-header-info">
              <h1>{currentData.name}</h1>
              <p className="profile-subtext">{personalDetails.city || '-'}, {personalDetails.state || '-'}</p>
              <p className="profile-contact">📱 {currentData.phone}</p>
              <p className="profile-contact">✉️ {currentData.email || 'N/A'}</p>
            </div>
          </div>

          {/* Edit/Save/Cancel Buttons */}
          <div className="profile-header-actions">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-edit-profile"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="btn-save-profile"
                >
                  {isSaving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="btn-cancel-profile"
                >
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="alert alert-success">
            ✅ {saveSuccess}
          </div>
        )}
        {saveError && (
          <div className="alert alert-error">
            ❌ {saveError}
          </div>
        )}

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
              {isEditing ? (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={personalDetails.dateOfBirth ? personalDetails.dateOfBirth.split('T')[0] : ''}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'dateOfBirth', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={personalDetails.address || ''}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'address', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={personalDetails.city || ''}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'city', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={personalDetails.state || ''}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'state', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={personalDetails.pincode || ''}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'pincode', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <input
                      type="text"
                      value={personalDetails.bloodGroup || ''}
                      onChange={(e) => handleNestedInputChange('personalDetails', 'bloodGroup', e.target.value)}
                      className="form-input"
                      placeholder="e.g., O+, AB-"
                    />
                  </div>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      value={formData.experience?.yearsOfExperience || ''}
                      onChange={(e) => handleNestedInputChange('experience', 'yearsOfExperience', parseInt(e.target.value) || 0)}
                      className="form-input"
                    />
                  </div>
                </div>
              ) : (
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p>{currentData.name || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{currentData.phone || '-'}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{currentData.email || 'Not provided'}</p>
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
                    <p>{formData.experience?.yearsOfExperience || '0'} years</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="profile-tab-content">
              <h2>🪪 Documents & Verification</h2>
              {isEditing ? (
                <div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Driving License Number</label>
                      <input
                        type="text"
                        value={documents.drivingLicense?.number || ''}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          documents: {
                            ...(prev.documents || {}),
                            drivingLicense: {
                              ...(prev.documents?.drivingLicense || {}),
                              number: e.target.value
                            }
                          }
                        }))}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Driving License Expiry</label>
                      <input
                        type="date"
                        value={documents.drivingLicense?.expiryDate ? documents.drivingLicense.expiryDate.split('T')[0] : ''}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          documents: {
                            ...(prev.documents || {}),
                            drivingLicense: {
                              ...(prev.documents?.drivingLicense || {}),
                              expiryDate: e.target.value
                            }
                          }
                        }))}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Aadhaar Number</label>
                      <input
                        type="text"
                        value={documents.aadhar?.number || ''}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          documents: {
                            ...(prev.documents || {}),
                            aadhar: {
                              ...(prev.documents?.aadhar || {}),
                              number: e.target.value
                            }
                          }
                        }))}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="documents-grid" style={{ marginTop: '20px' }}>
                    <div className="doc-card">
                      <h3>Upload Driving License</h3>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="form-input"
                        onChange={(e) => handleDocumentUpload('license', e.target.files?.[0])}
                        disabled={uploadingDoc.license}
                      />
                      <p style={{ color: '#9ca3af', fontSize: '13px' }}>{uploadingDoc.license ? 'Uploading...' : 'Upload clear front-side image or PDF'}</p>
                      {documents.drivingLicense?.file && (
                        <a href={buildAssetUrl(documents.drivingLicense.file)} target="_blank" rel="noopener noreferrer" className="doc-link">
                          View Current License →
                        </a>
                      )}
                    </div>

                    <div className="doc-card">
                      <h3>Upload Aadhaar</h3>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="form-input"
                        onChange={(e) => handleDocumentUpload('aadhar', e.target.files?.[0])}
                        disabled={uploadingDoc.aadhar}
                      />
                      <p style={{ color: '#9ca3af', fontSize: '13px' }}>{uploadingDoc.aadhar ? 'Uploading...' : 'Upload Aadhaar image or PDF'}</p>
                      {documents.aadhar?.file && (
                        <a href={buildAssetUrl(documents.aadhar.file)} target="_blank" rel="noopener noreferrer" className="doc-link">
                          View Current Aadhaar →
                        </a>
                      )}
                    </div>

                    <div className="doc-card">
                      <h3>Upload Selfie</h3>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-input"
                        onChange={(e) => handleDocumentUpload('selfie', e.target.files?.[0])}
                        disabled={uploadingDoc.selfie}
                      />
                      <p style={{ color: '#9ca3af', fontSize: '13px' }}>{uploadingDoc.selfie ? 'Uploading...' : 'Upload a clear selfie for verification'}</p>
                      {documents.selfie?.file && (
                        <a href={buildAssetUrl(documents.selfie.file)} target="_blank" rel="noopener noreferrer" className="doc-link">
                          View Current Selfie →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
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
                    <a href={buildAssetUrl(documents.drivingLicense.file)} target="_blank" rel="noopener noreferrer" className="doc-link">
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
                    <a href={buildAssetUrl(documents.aadhar.file)} target="_blank" rel="noopener noreferrer" className="doc-link">
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
                    <a href={buildAssetUrl(documents.selfie.file)} target="_blank" rel="noopener noreferrer" className="doc-link">
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
              )}
            </div>
          )}

          {/* Account Info Tab */}
          {activeTab === 'account' && (
            <div className="profile-tab-content">
              <h2>💰 Account & Payment Information</h2>
              {isEditing ? (
                <>
                  <div className="account-section">
                    <h3>UPI Payments</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>UPI ID</label>
                        <input
                          type="text"
                          value={formData.upiId || ''}
                          onChange={(e) => handleInputChange('upiId', e.target.value)}
                          className="form-input"
                          placeholder="e.g., name@upi"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="account-section">
                    <h3>Bank Account Details</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Account Holder Name</label>
                        <input
                          type="text"
                          value={bankDetails.accountHolder || ''}
                          onChange={(e) => handleNestedInputChange('bankDetails', 'accountHolder', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Account Number</label>
                        <input
                          type="text"
                          value={bankDetails.accountNumber || ''}
                          onChange={(e) => handleNestedInputChange('bankDetails', 'accountNumber', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>IFSC Code</label>
                        <input
                          type="text"
                          value={bankDetails.ifscCode || ''}
                          onChange={(e) => handleNestedInputChange('bankDetails', 'ifscCode', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          value={bankDetails.bankName || ''}
                          onChange={(e) => handleNestedInputChange('bankDetails', 'bankName', e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="account-section">
                    <h3>UPI Payments</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>UPI ID</label>
                        <p className="highlight">{currentData.upiId || 'Not set'}</p>
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
                </>
              )}

              <div className="account-section">
                <h3>Earnings Summary (Read-only)</h3>
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
