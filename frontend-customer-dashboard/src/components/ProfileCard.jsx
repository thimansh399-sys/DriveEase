import React from 'react';

export default function ProfileCard({ user, onEdit }) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-2">Profile</h3>
      <div className="flex flex-col gap-2">
        <div>
          <span className="text-gray-400">Name:</span>
          <span className="ml-2 font-bold">{user?.name || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-400">Phone:</span>
          <span className="ml-2">{user?.phone || 'N/A'}</span>
        </div>
        <button
          className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded shadow transition"
          onClick={onEdit}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
