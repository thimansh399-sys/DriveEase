import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

export default function DriverEarnings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await api.getDriverEarnings();
        if (!active) return;
        if (response?.error) {
          throw new Error(response.error);
        }
        setData(response || null);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Unable to load earnings right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const total = Number(data?.totalEarnings || data?.earnings?.total || 0);
    const today = Number(data?.todayEarnings || data?.earnings?.today || 0);
    const pending = Number(data?.pendingSettlement || data?.earnings?.pending || 0);
    return {
      total: total.toFixed(0),
      today: today.toFixed(0),
      pending: pending.toFixed(0),
    };
  }, [data]);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#f8fafc', marginBottom: '8px' }}>Driver Earnings</h1>
      <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: '18px' }}>
        Earnings overview and payout visibility.
      </p>

      {loading ? <p style={{ color: '#cbd5e1' }}>Loading earnings...</p> : null}
      {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Total Earnings</p>
            <h2 style={{ margin: '8px 0 0', color: '#86efac' }}>INR {stats.total}</h2>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Today</p>
            <h2 style={{ margin: '8px 0 0', color: '#93c5fd' }}>INR {stats.today}</h2>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Pending Settlement</p>
            <h2 style={{ margin: '8px 0 0', color: '#fcd34d' }}>INR {stats.pending}</h2>
          </div>
        </div>
      )}
    </div>
  );
}
