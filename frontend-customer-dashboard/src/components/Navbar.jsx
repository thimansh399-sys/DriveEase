import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('driveease_user');
    navigate('/login');
  };
  return (
    <nav className="bg-gray-800 px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-emerald-400">DriveEase</span>
        <ul className="hidden md:flex gap-6 ml-8">
          <li className="hover:text-emerald-400 transition cursor-pointer">Home</li>
          <li className="hover:text-emerald-400 transition cursor-pointer">My Bookings</li>
          <li className="hover:text-emerald-400 transition cursor-pointer">Track Ride</li>
          <li className="hover:text-emerald-400 transition cursor-pointer">Payments</li>
        </ul>
      </div>
      <div className="flex items-center gap-4">
        {user && <span>Hi, {user.name}</span>}
        <div className="relative group">
          <button className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold">Profile</button>
          <div className="absolute right-0 mt-2 w-32 bg-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 transition">
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-600" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
