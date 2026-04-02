import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Enforce single-role login: clear other role's session/token
      if (role === 'driver') {
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
      } else if (role === 'customer' || role === 'user') {
        localStorage.removeItem('driver');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
      }
      localStorage.setItem('user', JSON.stringify({ name: name.trim(), phone, role }));
      localStorage.setItem('userRole', role);
      localStorage.setItem('token', 'demo-token');
      if (onLogin) onLogin('demo-token', role);

      navigate(role === 'admin' ? '/admin' : role === 'driver' ? '/driver-dashboard' : '/customer-dashboard');
    } catch (error) {
      setError('Direct login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card-modern">
          <h2 className="login-modern-title">Welcome to DriveEase 🚗</h2>
          <p className="login-modern-subtitle">Safe rides, verified drivers</p>

          <div className="login-role-toggle" role="tablist" aria-label="Login role">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`login-role-btn ${role === 'customer' ? 'active' : ''}`}
            >
              Customer
            </button>

            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`login-role-btn ${role === 'driver' ? 'active' : ''}`}
            >
              Driver
            </button>
          </div>

          <form onSubmit={handleLogin} className="login-modern-form">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Phone Number"
              className="login-modern-input"
            />

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="login-modern-input"
            />

            {error && <div className="login-modern-error">{error}</div>}

            <button type="submit" className="login-modern-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="login-modern-footer">
            {role === 'customer'
              ? 'New user? Account will be created automatically'
              : 'New driver? Account will be created and onboarding starts after login'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
