import React from 'react';

export default function ActiveRideCard({ ride, onTrack, onCall }) {
  if (!ride) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
        <p className="text-gray-400">No active ride.</p>
      </div>
    );
  }
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-2 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Driver: {ride.driverName}</h3>
          <p className="text-emerald-400 font-medium">Status: {ride.status}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow transition"
            onClick={onTrack}
          >
            Live Tracking
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow transition"
            onClick={onCall}
          >
            Call Driver
          </button>
        </div>
      </div>
    </div>
  );
}
