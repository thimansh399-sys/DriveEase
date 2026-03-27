import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/Login.css';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('phoneNumber');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [displayedOtp, setDisplayedOtp] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.sendOTP(phone, role);
      if (response.error) {
        setError(response.error);
      } else {
        setDisplayedOtp(response.otp || '');
        setStep('otp');
      }
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.verifyOTP(phone, otp, name, role);
      if (response.error) {
        setError(response.error);
      } else {
        localStorage.setItem('userId', response.user.id);
        onLogin(response.token, response.user.role);
        navigate(response.user.role === 'admin' ? '/admin' : response.user.role === 'driver' ? '/driver-dashboard' : '/browse');
      }
    } catch (err) {
      setError(err?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.adminLogin(adminPassword);
      if (response.error) {
        setError(response.error);
      } else {
        localStorage.setItem('userId', 'admin');
        onLogin(response.token, 'admin');
        navigate('/admin');
      }
    } catch (err) {
      setError(err?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-car-decoration left">[CAB IN]</div>
      <div className="login-car-decoration right">[CAB UP]</div>

      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">{role === 'driver' ? 'Driver Login Portal' : 'Login to DriveEase'}</h2>
          <p className="login-subtitle">
            {role === 'driver'
              ? 'Start and get earn with verified rides across your city.'
              : 'Safe rides, verified drivers, and instant booking.'}
          </p>

          <div className="login-banner-strip">
            <span>Book Your Driver Today</span>
            <span>GPS Tracked Every Ride</span>
            <span>24/7 Support Available</span>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Role Selection */}
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label className="form-label">I am a:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => { setRole('customer'); setStep('phoneNumber'); }}
                className="btn"
                style={{
                  backgroundColor: role === 'customer' ? '#16a34a' : 'rgba(100,116,139,0.25)',
                  color: '#fff',
                  fontWeight: 'bold'
                }}
              >
                Customer
              </button>
              <button
                onClick={() => { setRole('driver'); setStep('phoneNumber'); }}
                className="btn"
                style={{
                  backgroundColor: role === 'driver' ? '#16a34a' : 'rgba(100,116,139,0.25)',
                  color: '#fff',
                  fontWeight: 'bold'
                }}
              >
                Driver
              </button>
            </div>
          </div>

          {step === 'phoneNumber' && (
            <form onSubmit={handleSendOTP} className="login-form">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="login-form">
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">OTP</label>
                <input
                  type="text"
                  className="form-input otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                />
                <small style={{ color: '#94a3b8', marginTop: '5px', display: 'block' }}>OTP: {displayedOtp}</small>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP & Login'}
              </button>
              <button
                type="button"
                className="btn"
                style={{ width: '100%', marginTop: '10px', backgroundColor: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' }}
                onClick={() => { setStep('phoneNumber'); setOtp(''); }}
              >
                Change Phone Number
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            {role === 'customer' && 'New customer? OTP will create your account automatically.'}
            {role === 'driver' && 'New driver? Register, verify documents, and start earning.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
