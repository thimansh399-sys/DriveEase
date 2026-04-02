import React, { useState, useEffect } from 'react';
import '../styles/DriverOnlineTimer.css';
import { buildApiUrl } from '../utils/network';

export default function DriverOnlineTimer({ driverId = null }) {
  const [timerData, setTimerData] = useState({
    isOnline: false,
    onlineStartTime: null,
    currentSessionHours: 0,
    currentSessionMinutes: 0,
    totalOnlineHoursMonth: 0,
    totalOnlineHoursAllTime: 0,
    totalRidesMonth: 0,
    totalRidesAllTime: 0,
    estimatedCommissionToday: 0,
    estimatedCommissionMonth: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (driverId) {
      fetchTimerData();
      // Update timer every minute
      const interval = setInterval(fetchTimerData, 60000);
      // Update display every second
      const secondInterval = setInterval(updateDisplayTime, 1000);
      return () => {
        clearInterval(interval);
        clearInterval(secondInterval);
      };
    }
  }, [driverId]);

  const fetchTimerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/driver-registration/${driverId}/timer`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTimerData(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching timer data:', error);
      setError('Failed to load timer data');
      setLoading(false);
    }
  };

  const updateDisplayTime = () => {
    if (timerData.isOnline && timerData.onlineStartTime) {
      const startTime = new Date(timerData.onlineStartTime);
      const now = new Date();
      const diffMs = now - startTime;
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;

      setTimerData(prev => ({
        ...prev,
        currentSessionHours: hours,
        currentSessionMinutes: minutes
      }));
    }
  };

  const handleToggleOnline = async (goOnline) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/driver-registration/${driverId}/online-status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isOnline: goOnline })
      });

      if (response.ok) {
        fetchTimerData();
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
      setError('Failed to update status');
    }
  };

  if (loading) {
    return <div className="timer-loading">Loading...</div>;
  }

  const commissionPerRide = timerData.estimatedCommissionToday / (timerData.totalRidesMonth || 1);

  return (
    <div className="driver-online-timer">
      {error && <div className="alert alert-error">{error}</div>}

      {/* Main Timer Display */}
      <div className={`timer-display ${timerData.isOnline ? 'online' : 'offline'}`}>
        <div className="timer-status">
          <div className={`status-indicator ${timerData.isOnline ? 'online' : 'offline'}`}></div>
          <span className="status-text">
            {timerData.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
          </span>
        </div>

        {timerData.isOnline && (
          <div className="current-session">
            <div className="time-display">
              <span className="hours">{String(timerData.currentSessionHours).padStart(2, '0')}</span>
              <span className="separator">:</span>
              <span className="minutes">{String(timerData.currentSessionMinutes).padStart(2, '0')}</span>
            </div>
            <p className="time-label">Current Session</p>
          </div>
        )}

        <button
          onClick={() => handleToggleOnline(!timerData.isOnline)}
          className={`toggle-btn ${timerData.isOnline ? 'btn-offline' : 'btn-online'}`}
        >
          {timerData.isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="timer-stats-grid">
        <card className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Today's Session</div>
            <div className="stat-value">
              {String(timerData.currentSessionHours).padStart(2, '0')}:
              {String(timerData.currentSessionMinutes).padStart(2, '0')}
            </div>
          </div>
        </card>

        <card className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-label">This Month</div>
            <div className="stat-value">{timerData.totalOnlineHoursMonth}h</div>
            <small>{timerData.totalRidesMonth} rides</small>
          </div>
        </card>

        <card className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">All Time</div>
            <div className="stat-value">{timerData.totalOnlineHoursAllTime}h</div>
            <small>{timerData.totalRidesAllTime} rides</small>
          </div>
        </card>

        <card className="stat-card commission">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Est. Commission Today</div>
            <div className="stat-value">₹{timerData.estimatedCommissionToday}</div>
            <small>~₹{commissionPerRide.toFixed(0)}/ride</small>
          </div>
        </card>
      </div>

      {/* Detailed Analytics */}
      <div className="timer-analytics">
        <h3>📊 Monthly Analytics</h3>
        
        <div className="analytics-row">
          <div className="analytics-item">
            <span className="label">Online Hours This Month</span>
            <span className="value">{timerData.totalOnlineHoursMonth} hours</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{
                  width: `${Math.min((timerData.totalOnlineHoursMonth / 160) * 100, 100)}%`
                }}
              ></div>
            </div>
            <small>Target: 160 hours/month</small>
          </div>
        </div>

        <div className="analytics-row">
          <div className="analytics-item">
            <span className="label">This Month Rides</span>
            <span className="value">{timerData.totalRidesMonth} Completed</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{
                  width: `${Math.min((timerData.totalRidesMonth / 100) * 100, 100)}%`
                }}
              ></div>
            </div>
            <small>Avg: {(timerData.totalRidesMonth / (timerData.totalOnlineHoursMonth || 1)).toFixed(1)} rides/hour</small>
          </div>
        </div>

        <div className="analytics-row">
          <div className="analytics-item">
            <span className="label">Estimated Commission This Month</span>
            <span className="value commission">₹{timerData.estimatedCommissionMonth}</span>
            <div className="commission-breakdown">
              <small>Based on {timerData.totalRidesMonth} rides</small>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="timer-tips">
        <h4>💡 Tips to Maximize Earnings</h4>
        <ul>
          <li>📍 Stay online during peak hours (8-9 AM, 5-6 PM) for more bookings</li>
          <li>⭐ Maintain higher ratings to get premium rides</li>
          <li>🚗 Complete 3+ rides per hour for higher commission tier</li>
          <li>📱 Keep your app active - no background mode</li>
          <li>💬 Professional communication improves customer ratings</li>
        </ul>
      </div>
    </div>
  );
}
