import React from 'react';

export default function MyBookings({ bookings, onDownload }) {
  if (!bookings?.length) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
        <p className="text-gray-400">No bookings yet.</p>
      </div>
    );
  }
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">My Bookings</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-2 px-3">Ride ID</th>
              <th className="py-2 px-3">Price</th>
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(ride => (
              <tr key={ride.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                <td className="py-2 px-3">{ride.id}</td>
                <td className="py-2 px-3">₹{ride.price}</td>
                <td className="py-2 px-3">{ride.date}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${ride.status === 'Completed' ? 'bg-emerald-500' : 'bg-gray-500'}`}>{ride.status}</span>
                </td>
                <td className="py-2 px-3">
                  <button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded shadow transition"
                    onClick={() => onDownload(ride)}
                  >
                    Download Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
