import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser } from '../utils/localStorage';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    saveUser({ name, phone });
    navigate('/customer-dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col gap-6 w-full max-w-md animate-fade-in"
      >
        <h2 className="text-2xl font-bold text-emerald-400 text-center mb-2">Customer Login</h2>
        <input
          className="bg-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="bg-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Phone Number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg shadow font-semibold transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
