import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DriverRegistration.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function DriverRegistrationFlow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [driverId, setDriverId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    phone: '',
    email: '',
    bloodGroup: '',
    yearsOfExperience: '0',
    // Step 2: Document Uploads
    aadharFile: null,
    licenseFile: null,
    selfieFile: null
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Step 1: Submit Basic Info
  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    setCurrentStep(2);
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }));
    setError('');
  };

  // Step 2: Register Driver (after document uploads)
  const handleDocumentsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Validate file uploads
    if (!formData.aadharFile || !formData.licenseFile || !formData.selfieFile) {
      setError('Aadhaar, License, and Selfie files are required');
      setLoading(false);
      return;
    }
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('phone', formData.phone);
      form.append('email', formData.email);
      form.append('city', 'Kanpur');
      form.append('state', 'Uttar Pradesh');
      form.append('pincode', '208001');
      form.append('bloodGroup', formData.bloodGroup);
      form.append('yearsOfExperience', formData.yearsOfExperience);
      form.append('aadharFile', formData.aadharFile);
      form.append('licenseFile', formData.licenseFile);
      form.append('selfieFile', formData.selfieFile);

      const response = await fetch(
        `${API_BASE_URL}/drivers/register`,
        {
          method: 'POST',
          body: form
        }
      );
      if (!response.ok) throw new Error('Registration failed');
      const data = await response.json();
      setDriverId(data.driverId);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h1>DriveEase Driver Registration</h1>
          <p>Complete steps to become a verified driver</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-title">Basic Info</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-title">Documents</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-title">Success</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <form onSubmit={handleBasicInfoSubmit}>
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

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Continue to Vehicle Details'}
            </button>
          </form>
        )}

        {/* Step 2: Document Uploads */}
        {currentStep === 2 && (
          <form onSubmit={handleDocumentsSubmit} encType="multipart/form-data">
            <div className="form-group">
              <label>Aadhaar Card (PDF/JPG/PNG) *</label>
              <input
                type="file"
                name="aadharFile"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Driving License (PDF/JPG/PNG) *</label>
              <input
                type="file"
                name="licenseFile"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Selfie Photo (JPG/PNG) *</label>
              <input
                type="file"
                name="selfieFile"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />
            </div>

            <div className="button-group">
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Registration Success */}
        {currentStep === 3 && (
          <div className="registration-success">
            <h2>Registration Submitted!</h2>
            <p>Your driver registration has been submitted for admin approval.</p>
            <p>You will be notified once your account is approved.</p>
          </div>
        )}
      </div>
    </div>
  );
}