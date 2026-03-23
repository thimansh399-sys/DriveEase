import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/Browse.css';

function Browse() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [isOnline, setIsOnline] = useState(null);
  const [stats, setStats] = useState({ totalDrivers: 0 });
  const [state, setState] = useState('');
  const [cities, setCities] = useState([]);

  const states = ['Delhi', 'Maharashtra', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Rajasthan'];

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 10000); // 10 second refresh
    return () => clearInterval(interval);
  }, [city, pincode, isOnline, state]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      let query = '?status=approved';
      if (city) query += `&city=${city}`;
      if (pincode) query += `&pincode=${pincode}`;
      if (isOnline !== null) query += `&isOnline=${isOnline}`;

      const response = await api.getAllDrivers(query);
      setDrivers(response);
      setStats({ totalDrivers: response.length });
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (selectedState) => {
    try {
      const response = await api.getCitiesByState(selectedState);
      setCity(response[0]); // Default to the first city
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  useEffect(() => {
    if (state) {
      // Fetch cities based on selected state
      fetchCities(state);
    }
  }, [state]);

  return (
    <div className="section">
      <h1>Browse Drivers</h1>
      <div className="filters">
        <label htmlFor="state">State:</label>
        <select id="state" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        <label htmlFor="city">City:</label>
        <select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Select City</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <label htmlFor="pincode">Pincode:</label>
        <input
          type="text"
          id="pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          placeholder="Enter Pincode"
        />

        <label htmlFor="isOnline">Online Status:</label>
        <select id="isOnline" value={isOnline} onChange={(e) => setIsOnline(e.target.value)}>
          <option value="">All</option>
          <option value="true">Online</option>
          <option value="false">Offline</option>
        </select>
      </div>

      {loading ? (
        <p>Loading drivers...</p>
      ) : (
        <div>
          <h2>Total Drivers: {stats.totalDrivers}</h2>
          <ul>
            {drivers.map((driver) => (
              <li key={driver.id}>{driver.name} - {driver.city}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Browse;
