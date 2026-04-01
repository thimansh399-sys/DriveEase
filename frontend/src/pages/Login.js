import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('phoneNumber');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const [displayedOtp, setDisplayedOtp] = useState(''); // unused

  // Direct login without OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Direct login: store user and navigate
      localStorage.setItem("user", JSON.stringify({ name: name || "Customer", phone, role }));
      if (onLogin) onLogin(null, role);
      navigate(role === 'admin' ? '/admin' : role === 'driver' ? '/driver-dashboard' : '/customer-dashboard');
    } catch (err) {
      setError('Direct login failed.');
    } finally {
      setLoading(false);
    }
  };

  // No OTP verification needed
  // const handleVerifyOTP = async (e) => { /* unused */ };

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
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
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
