import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import '../styles/Login.css';
import api from '../utils/api';
=======
>>>>>>> f5ee9e1 (Build frontend: production build output)

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
<<<<<<< HEAD
=======
  // const [displayedOtp, setDisplayedOtp] = useState('');
>>>>>>> 0bf5313 (Cleanup: Remove unused variables and fix ESLint warnings)

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
<<<<<<< HEAD
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

      navigate(role === 'admin' ? '/admin' : role === 'driver' ? '/driver-dashboard' : '/customer-dashboard');
    } catch (error) {
      setError(error.message || 'Direct login failed.');
=======
    setLoading(true);
    setError('');
    try {
      // Direct login: store user and navigate
      localStorage.setItem("user", JSON.stringify({ name: name || "Customer", phone, role }));
      if (onLogin) onLogin(null, role);
      navigate(role === 'admin' ? '/admin' : role === 'driver' ? '/driver-dashboard' : '/customer-dashboard');
    } catch (err) {
      setError('Direct login failed.');
>>>>>>> 0bf5313 (Cleanup: Remove unused variables and fix ESLint warnings)
    } finally {
      setLoading(false);
    }
  };
<<<<<<< HEAD
=======

  // No OTP verification needed
  // const handleVerifyOTP = async (e) => {
  //   e.preventDefault();
  //   if (!name.trim()) {
  //     setError('Please enter your name');
  //     return;
  //   }
  //   setLoading(true);
  //   setError('');
  //   try {
  //     localStorage.setItem("user", JSON.stringify({ name, phone, role }));
  //     if (onLogin) onLogin(null, role);
  //     navigate(role === 'admin' ? '/admin' : role === 'driver' ? '/driver-dashboard' : '/customer-dashboard');
  //   } catch (err) {
  //     setError('Direct login failed.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
>>>>>>> 0bf5313 (Cleanup: Remove unused variables and fix ESLint warnings)

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
