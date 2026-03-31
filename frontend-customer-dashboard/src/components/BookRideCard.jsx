import React, { useState } from 'react';

export default function BookRideCard({ onFindDriver }) {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-fade-in">
      <h3 className="text-lg font-semibold mb-2">Book a Ride</h3>
      <input
        className="bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        placeholder="Pickup Location"
        value={pickup}
        onChange={e => setPickup(e.target.value)}
      />
      <input
        className="bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        placeholder="Drop Location"
        value={drop}
        onChange={e => setDrop(e.target.value)}
      />
      <button
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow transition"
        onClick={() => onFindDriver(pickup, drop)}
      >
        Find Driver
      </button>
    </div>
  );
}
