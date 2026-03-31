// src/pages/DriversPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    fetch('/api/drivers')
      .then(res => res.json())
      .then(data => {
        setDrivers(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load drivers');
        setLoading(false);
      });
  }, []);

  const filtered = drivers.filter(driver =>
    (!city || driver.city?.toLowerCase().includes(city.toLowerCase())) &&
    (!state || driver.state?.toLowerCase().includes(state.toLowerCase())) &&
    (!pincode || driver.pincode?.includes(pincode)) &&
    (!search || driver.name?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="text-center py-12">Loading drivers...</div>;
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-black px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-600 mb-6 text-center">Find Your Trusted Driver</h1>
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <input className="px-4 py-2 rounded bg-white shadow" placeholder="Search by name" value={search} onChange={e => setSearch(e.target.value)} />
        <input className="px-4 py-2 rounded bg-white shadow" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
        <input className="px-4 py-2 rounded bg-white shadow" placeholder="State" value={state} onChange={e => setState(e.target.value)} />
        <input className="px-4 py-2 rounded bg-white shadow" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} />
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(driver => (
          <div key={driver._id} className="bg-white rounded-xl shadow-lg p-5 flex flex-col gap-2 animate-fade-in hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-3 h-3 rounded-full ${driver.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              <span className="font-bold text-lg text-gray-900">{driver.name}</span>
            </div>
            <div className="text-gray-700 text-sm">{driver.city}, {driver.state}</div>
            <div className="text-gray-500 text-xs">Pincode: {driver.pincode}</div>
            <div className="flex gap-2 flex-wrap text-xs mt-2">
              {driver.verified && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Verified</span>}
              {driver.badges?.map(b => <span key={b} className="bg-gray-200 text-gray-700 px-2 py-1 rounded">{b}</span>)}
            </div>
            <button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow font-semibold transition"
              onClick={() => navigate(`/drivers/${driver._id}`)}
            >
              View Profile
            </button>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center text-gray-400 mt-12">No drivers found for your filters.</div>}
    </div>
  );
}
