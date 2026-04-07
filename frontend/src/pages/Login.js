import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import api from '../utils/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('customer');
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isCustomer = role === 'customer' || role === 'user';
  const canRegister = isCustomer;

  const handleRegister = async (e) => {
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
    setSuccess('');

    try {
      const response = await api.registerCustomer({
        phone,
        name: name.trim(),
        email: email.trim()
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      setMode('login');
      setError('');
      setSuccess('Registration successful. Please login now.');
    } catch (registerError) {
      setError(registerError.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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
    setSuccess('');

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
      const response = await api.directLogin({
        phone,
        name: name.trim(),
        role,
      });

      if (response?.error || !response?.token) {
        throw new Error(response?.error || 'Login failed');
      }

      const sessionUser = {
        id: response.user?.id,
        name: response.user?.name || name.trim(),
        phone: response.user?.phone || phone,
        role: response.user?.role || role,
      };

      if (role === 'driver') {
        localStorage.setItem('driver', JSON.stringify(sessionUser));
      } else {
        localStorage.setItem('user', JSON.stringify(sessionUser));
      }

      localStorage.setItem('userRole', response.user?.role || role);
      localStorage.setItem('token', response.token);
      if (onLogin) onLogin(response.token, response.user?.role || role);

      const pendingDraftRaw = localStorage.getItem('pendingRideDraft');
      if ((role === 'customer' || role === 'user') && pendingDraftRaw) {
        try {
          const draft = JSON.parse(pendingDraftRaw);
          localStorage.removeItem('pendingRideDraft');
          const search = new URLSearchParams({
            pickup: draft?.pickup || '',
            drop: draft?.drop || '',
          });

          if (draft?.rideType) {
            search.set('rideType', draft.rideType);
          }

          if (draft?.totalHours) {
            search.set('totalHours', String(draft.totalHours));
          }

          navigate(`/book-ride?${search.toString()}`);
          return;
        } catch (_) {
          localStorage.removeItem('pendingRideDraft');
        }
      }

      navigate(role === 'admin' ? '/admin' : role === 'driver' ? '/driver-dashboard' : '/customer-dashboard');
    } catch (error) {
      setError(error.message || 'Direct login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card-modern">
          <div className="login-modern-hero">
            <span className="login-modern-kicker">Trusted Driver Platform</span>
            <h2 className="login-modern-title">Welcome to DriveEase 🚗</h2>
            <p className="login-modern-subtitle">Safe rides, verified drivers</p>
          </div>

          <div className="login-role-toggle" role="tablist" aria-label="Login role">
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className={`login-role-btn ${role === 'customer' ? 'active' : ''}`}
            >
              Customer
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('driver');
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className={`login-role-btn ${role === 'driver' ? 'active' : ''}`}
            >
              Driver
            </button>
          </div>

          <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="login-modern-form">
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

            {mode === 'register' && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className="login-modern-input"
              />
            )}

            {error && <div className="login-modern-error">{error}</div>}
            {success && <div className="login-modern-error" style={{ color: '#86efac', borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.12)' }}>{success}</div>}

            <button type="submit" className="login-modern-submit" disabled={loading}>
              {loading ? (mode === 'register' ? 'Registering...' : 'Logging in...') : (mode === 'register' ? 'Register' : 'Login')}
            </button>

            {canRegister && (
              <button
                type="button"
                className="login-secondary-action"
                onClick={() => {
                  setMode((prevMode) => (prevMode === 'login' ? 'register' : 'login'));
                  setError('');
                  setSuccess('');
                }}
              >
                {mode === 'login' ? 'New user? Register first' : 'Already registered? Back to login'}
              </button>
            )}

            {role === 'driver' && (
              <button
                type="button"
                className="login-secondary-action"
                onClick={() => navigate('/register-driver')}
              >
                New driver? Register as Driver
              </button>
            )}
          </form>

          <p className="login-modern-footer">
            {role === 'customer'
              ? (mode === 'register'
                  ? 'Create your customer account first, then login.'
                  : 'First time user? Please register first.')
              : 'Driver account required before login.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
