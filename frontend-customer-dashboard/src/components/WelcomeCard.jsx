import React from 'react';

export default function WelcomeCard({ user }) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-2 animate-fade-in">
      <h2 className="text-xl font-semibold">Welcome back, {user?.name || 'User'} 👋</h2>
      <p className="text-gray-400">Phone: {user?.phone || 'N/A'}</p>
    </div>
  );
}
