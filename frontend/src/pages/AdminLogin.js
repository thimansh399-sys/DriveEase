import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.adminLogin(password);

      if (response?.error || !response?.token) {
        throw new Error(response?.error || 'Incorrect password');
      }

      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('token', response.token);
      localStorage.setItem('userRole', 'admin');
      navigate('/admin');
    } catch (loginError) {
      setError(loginError.message || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}

export default AdminLogin;
