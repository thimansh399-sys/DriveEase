import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/DriverRegister.css';

function DriverRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [displayedOtp, setDisplayedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [driverData, setDriverData] = useState({
    dateOfBirth: '',
    address: '',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '',
    vehicle: 'Honda City',
    registrationNumber: '',
    bankAccount: '',
    ifscCode: '',
    upiId: ''
  });

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter valid phone');
      return;
    }

    setLoading(true);
    try {
      const response = await api.sendOTP(phone, 'driver');
      setDisplayedOtp(response.otp);
      setStep('otp');
      setError('');
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.verifyOTP(phone, otp, name, 'driver');
      setStep('documents');
      setSuccess('OTP verified! Now register your documents.');
      setError('');
    } catch (err) {
      setError('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverDataChange = (field, value) => {
    setDriverData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        phone,
        name,
        ...driverData,
        registrationFee: { amount: 150, paid: false }
      };
      const response = await api.registerDriver(payload);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess('Registration submitted! Your documents are under review.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError('Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h1 className="section-title">🚗 Register as DriveEase Driver</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Step 1: Phone & OTP */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP}>
            <h3>Step 1: Verify Your Phone</h3>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <h3>Step 2: Verify OTP</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">OTP</label>
              <input
                type="text"
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
              />
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>OTP: {displayedOtp}</small>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        )}

        {/* Step 3: Documents & Details */}
        {step === 'documents' && (
          <form onSubmit={handleSubmit}>
            <h3>Step 3: Personal & Vehicle Details</h3>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={driverData.dateOfBirth}
                  onChange={(e) => handleDriverDataChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={driverData.city}
                  onChange={(e) => handleDriverDataChange('city', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <input
                type="text"
                className="form-input"
                value={driverData.vehicle}
                onChange={(e) => handleDriverDataChange('vehicle', e.target.value)}
                placeholder="e.g. Honda City"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Registration Number</label>
              <input
                type="text"
                className="form-input"
                value={driverData.registrationNumber}
                onChange={(e) => handleDriverDataChange('registrationNumber', e.target.value)}
                placeholder="e.g. DL-01-AB-1234"
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Bank Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={driverData.bankAccount}
                  onChange={(e) => handleDriverDataChange('bankAccount', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={driverData.ifscCode}
                  onChange={(e) => handleDriverDataChange('ifscCode', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                type="text"
                className="form-input"
                value={driverData.upiId}
                onChange={(e) => handleDriverDataChange('upiId', e.target.value)}
                placeholder="your.name@bankname"
              />
            </div>

            <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
              <strong>📄 Document Upload Note:</strong> You'll be asked to upload Aadhar, PAN, Driving License, and Selfie after registration completion for verification.
            </div>

            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              <strong>💳 Registration Fee:</strong> ₹150 (One-time) - Payment link will be sent after registration.
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default DriverRegister;
