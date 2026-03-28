
import React, { useState } from 'react';
import { DEFAULT_LOCATION, STATE_OPTIONS, getAreasByCity, getCitiesByState } from '../utils/locationData';
import '../styles/DriverRegistration.css';
import { buildApiUrl } from '../utils/network';

export default function DriverRegistrationFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    bloodGroup: '',
    yearsOfExperience: '0',
    aadhaarNumber: '',
    licenseNumber: '',
    state: DEFAULT_LOCATION.state,
    city: DEFAULT_LOCATION.city,
    area: DEFAULT_LOCATION.area,
    pincode: ''
  });
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const cityOptions = getCitiesByState(formData.state);
  const areaOptions = getAreasByCity(formData.state, formData.city);


  // Unified input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  // Unified submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.name || !formData.phone || !formData.aadhaarNumber || !formData.licenseNumber) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (!selfieFile) {
      setError('Selfie photo is required for verification');
      setLoading(false);
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('phone', formData.phone);
      formPayload.append('email', formData.email);
      formPayload.append('bloodGroup', formData.bloodGroup);
      formPayload.append('yearsOfExperience', formData.yearsOfExperience);
      formPayload.append('aadhaarNumber', formData.aadhaarNumber);
      formPayload.append('licenseNumber', formData.licenseNumber);
      formPayload.append('state', formData.state);
      formPayload.append('city', formData.city);
      formPayload.append('area', formData.area);
      formPayload.append('pincode', formData.pincode);
      formPayload.append('selfie', selfieFile);

      const res = await fetch(buildApiUrl('/driver-registration/register-driver'), {
        method: 'POST',
        body: formPayload
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(data.message || 'Registration Success ✅');
    } catch (err) {
      setError(err.message || 'Upload Failed ❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h1>DriveEase Driver Registration</h1>
          <p>Complete all details to become a verified driver</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="10-digit mobile number"
              maxLength="10"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                min="0"
                max="50"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Aadhaar Number *</label>
            <input
              type="text"
              name="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={handleInputChange}
              placeholder="Enter Aadhaar Number"
              maxLength="12"
              required
            />
          </div>
          <div className="form-group">
            <label>Driving License Number *</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              placeholder="Enter Driving License Number"
              maxLength="20"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>State *</label>
              <select name="state" value={formData.state} onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value, city: '', area: '' }))} required>
                <option value="">Select State</option>
                {STATE_OPTIONS.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>City *</label>
              <select name="city" value={formData.city} onChange={handleInputChange} required disabled={!formData.state}>
                <option value="">Select City</option>
                {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Area / Locality</label>
              <select name="area" value={formData.area} onChange={handleInputChange} disabled={!formData.city}>
                <option value="">Select Area</option>
                {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="6-digit pincode"
                maxLength="6"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Selfie Photo * (for verification)</label>
            <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
              {selfiePreview ? (
                <div>
                  <img src={selfiePreview} alt="Selfie Preview" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%', marginBottom: '10px' }} />
                  <p style={{ color: '#16a34a', fontWeight: 'bold' }}>✅ Selfie uploaded</p>
                  <button type="button" onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', marginTop: '5px' }}>Remove</button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '40px', margin: '0' }}>📸</p>
                  <p style={{ color: '#666' }}>Click to upload your selfie</p>
                  <p style={{ color: '#999', fontSize: '12px' }}>JPG, PNG — Max 5MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Selfie must be less than 5MB');
                      return;
                    }
                    setSelfieFile(file);
                    setSelfiePreview(URL.createObjectURL(file));
                    setError('');
                  }
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}