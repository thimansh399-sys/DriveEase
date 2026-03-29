import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/AdminAnalytics.css';

function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [topDrivers, setTopDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [days, setDays] = useState(30);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/dashboard/summary', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchTrend = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/analytics/trends/rides?period=${period}&days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) setTrend(data.trend);
    } catch (error) {
      console.error('Error fetching trend:', error);
    } finally {
      setLoading(false);
    }
  }, [days, period]);

  const fetchTopDrivers = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/drivers/top?limit=10', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) setTopDrivers(data.drivers);
    } catch (error) {
      console.error('Error fetching top drivers:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTopDrivers();
  }, [fetchStats, fetchTopDrivers]);

  useEffect(() => {
    setLoading(true);
    fetchTrend();
  }, [fetchTrend]);

  return (
    <div className="admin-analytics-page">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Analytics Dashboard
      </motion.h1>

      {/* Summary Cards */}
      {stats && (
        <div className="analytics-summary-grid">
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{stats.totalBookings}</div>
            <div className="stat-change">
              Completed: {stats.completedBookings} | Cancelled:{' '}
              {stats.cancelledBookings}
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
            <div className="stat-change">Avg Fare: ₹{stats.avgFare}</div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-label">Cancellation Rate</div>
            <div className="stat-value">{stats.cancellationRate}%</div>
            <div className="stat-change">
              {stats.cancelledBookings} of {stats.totalBookings} bookings
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="stat-label">Active Drivers</div>
            <div className="stat-value">{stats.activeDrivers}</div>
            <div className="stat-change">
              Customers: {stats.activeCustomers}
            </div>
          </motion.div>
        </div>
      )}

      {/* Trend Chart */}
      <motion.div
        className="analytics-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="section-header">
          <h2>Rides Trend</h2>
          <div className="filter-controls">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <select value={days} onChange={(e) => setDays(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading trend data...</div>
        ) : trend && trend.length > 0 ? (
          <div className="trend-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Completed</th>
                  <th>Cancelled</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item._id}</td>
                    <td>{item.totalRides}</td>
                    <td>{item.completedRides}</td>
                    <td>{item.cancelledRides}</td>
                    <td>₹{Math.round(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">No data available</div>
        )}
      </motion.div>

      {/* Top Drivers */}
      <motion.div
        className="analytics-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="section-header">
          <h2>Top Performing Drivers</h2>
        </div>

        {topDrivers.length > 0 ? (
          <div className="drivers-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Driver Name</th>
                  <th>Total Rides</th>
                  <th>Earnings</th>
                  <th>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((driver, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      {driver.driverInfo?.[0]?.fullName || 'N/A'}
                    </td>
                    <td>{driver.totalRides}</td>
                    <td>₹{Math.round(driver.totalEarnings)}</td>
                    <td>⭐ {driver.avgRating?.toFixed(1) || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">No driver data available</div>
        )}
      </motion.div>
    </div>
  );
}

export default AdminAnalytics;
