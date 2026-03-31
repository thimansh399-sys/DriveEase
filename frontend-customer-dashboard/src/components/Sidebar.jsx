import React from 'react';

const menuItems = [
  { label: 'Dashboard', icon: '🏠' },
  { label: 'Book Ride', icon: '🚗' },
  { label: 'My Rides', icon: '📝' },
  { label: 'Payments', icon: '💳' },
  { label: 'Profile', icon: '👤' },
];

export default function Sidebar({ className = '' }) {
  return (
    <aside className={`bg-gray-800 text-white w-56 min-h-full py-8 px-4 shadow-lg rounded-r-3xl ${className}`}>
      <ul className="space-y-6">
        {menuItems.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-600 transition cursor-pointer"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
