import React from 'react';

export default function NearbyDrivers({ drivers, onBook }) {
  if (!drivers?.length) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
        <p className="text-gray-400">No nearby drivers.</p>
      </div>
    );
  }
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Nearby Drivers</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {drivers.map(driver => (
          <div
            key={driver.id}
            className="bg-gray-700 rounded-lg p-4 flex flex-col gap-2 shadow hover:scale-105 transition-transform"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{driver.name}</p>
                <p className="text-gray-400 text-sm">{driver.city}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${driver.status === 'Available' ? 'bg-emerald-500' : 'bg-gray-500'}`}>{driver.status}</span>
            </div>
            <button
              className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded shadow transition"
              disabled={driver.status !== 'Available'}
              onClick={() => onBook(driver)}
            >
              Book
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
