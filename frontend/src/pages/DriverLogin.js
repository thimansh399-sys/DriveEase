import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DriverLogin.css';

export default function DriverLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // TODO: Replace with real API call
    setTimeout(() => {
      if (phone === '9999999999' && password === 'password') {
        navigate('/driver-dashboard');
      } else {
        setError('Invalid phone or password');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="driver-login-bg">
      <div className="driver-login-card">
        <div className="driver-login-header">
          <div className="driver-avatar">U</div>
          <div className="driver-info">
            <div className="driver-name">Driver Login</div>
            <div className="driver-location">
              <span className="location-dot" /> Kanpur
            </div>
            <div className="driver-status offline">
              <span className="status-dot" /> Offline
            </div>
          </div>
        </div>
        <form className="driver-login-form" onSubmit={handleLogin}>
          <label>Phone Number</label>
          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="driver-login-error">{error}</div>}
          <button type="submit" className="driver-login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
