import React, { useCallback, useEffect, useState } from 'react';
import { buildApiUrl, buildAssetUrl } from '../utils/network';

const STATUS_ALL = 'all';
const STATUS_ONLINE = 'online';
const STATUS_OFFLINE = 'offline';

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: '#facc15', fontSize: 14, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>
          {i <= full ? '★' : i === full + 1 && half ? '⯨' : '☆'}
        </span>
      ))}
    </span>
  );
}

export default function DriverDirectory() {
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (areaFilter) params.set('area', areaFilter);
      if (statusFilter !== STATUS_ALL) params.set('onlineStatus', statusFilter);
      params.set('_ts', String(Date.now()));

      const url = buildApiUrl(`/public/drivers-directory?${params.toString()}`);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch driver directory');
      const data = await res.json();
      setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Unable to load driver directory.');
      setDrivers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, areaFilter, statusFilter]);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  const onlineCount = drivers.filter((d) => d.isOnline).length;
  const offlineCount = drivers.length - onlineCount;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Driver Directory</h1>
          <p style={styles.subtitle}>
            Browse all registered drivers — see availability, area, and ratings at a glance.
          </p>
          {!loading && (
            <div style={styles.statsRow}>
              <StatBadge label="Total" value={total} color="#60a5fa" />
              <StatBadge label="Online" value={onlineCount} color="#4ade80" />
              <StatBadge label="Offline" value={offlineCount} color="#94a3b8" />
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={styles.filtersRow}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by name or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            style={{ ...styles.searchInput, maxWidth: 180 }}
            type="text"
            placeholder="Filter by area/city..."
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
          />
          <div style={styles.statusTabs}>
            {[
              { key: STATUS_ALL, label: 'All' },
              { key: STATUS_ONLINE, label: '🟢 Online' },
              { key: STATUS_OFFLINE, label: '⚫ Offline' },
            ].map(({ key, label }) => (
              <button
                key={key}
                style={{
                  ...styles.tabBtn,
                  ...(statusFilter === key ? styles.tabBtnActive : {}),
                }}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading && drivers.length === 0 ? (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={{ color: '#94a3b8', marginTop: 12 }}>Loading drivers...</p>
          </div>
        ) : error ? (
          <div style={styles.errorBox}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <p style={{ margin: '8px 0 0' }}>{error}</p>
            <button style={styles.retryBtn} onClick={fetchDrivers}>Retry</button>
          </div>
        ) : drivers.length === 0 ? (
          <div style={styles.center}>
            <span style={{ fontSize: 40 }}>🔍</span>
            <p style={{ color: '#94a3b8', marginTop: 10 }}>No drivers found matching your filters.</p>
          </div>
        ) : (
          <>
            {/* Table — desktop */}
            <div className="ddir-table" style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['#', 'Driver', 'Phone', 'Area / City', 'Status', 'Rating', 'Rides'].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver, idx) => (
                    <tr key={driver._id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.rowNum}>{idx + 1}</span></td>
                      <td style={styles.td}>
                        <div style={styles.driverCell}>
                          <DriverAvatar driver={driver} />
                          <span style={styles.driverName}>{driver.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.phone}>{driver.phone}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.area}>
                          {[driver.area, driver.state].filter(Boolean).join(', ') || '—'}
                        </span>
                        {driver.serviceAreas?.length > 0 && (
                          <div style={styles.serviceAreas}>
                            {driver.serviceAreas.slice(0, 2).map((a) => (
                              <span key={a} style={styles.areaChip}>{a}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <StatusBadge isOnline={driver.isOnline} />
                      </td>
                      <td style={styles.td}>
                        <div>
                          <StarRating rating={driver.rating} />
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            {driver.rating > 0 ? driver.rating.toFixed(1) : 'No rating'}
                            {driver.totalRatings > 0 && ` (${driver.totalRatings})`}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.rides}>{driver.totalRides}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile */}
            <div className="ddir-cards" style={styles.cardGrid}>
              {drivers.map((driver, idx) => (
                <div key={driver._id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <DriverAvatar driver={driver} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.cardName}>{driver.name}</div>
                      <div style={styles.cardPhone}>{driver.phone}</div>
                    </div>
                    <StatusBadge isOnline={driver.isOnline} />
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Area</span>
                    <span style={styles.cardVal}>
                      {[driver.area, driver.state].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Rating</span>
                    <span style={styles.cardVal}>
                      <StarRating rating={driver.rating} />
                      {' '}
                      {driver.rating > 0 ? driver.rating.toFixed(1) : 'No rating'}
                    </span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Total Rides</span>
                    <span style={styles.cardVal}>{driver.totalRides}</span>
                  </div>
                  {driver.serviceAreas?.length > 0 && (
                    <div style={styles.serviceAreas}>
                      {driver.serviceAreas.slice(0, 3).map((a) => (
                        <span key={a} style={styles.areaChip}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DriverAvatar({ driver, size = 36 }) {
  const [imgError, setImgError] = useState(false);
  const src = driver.profilePicture && !imgError
    ? buildAssetUrl(driver.profilePicture)
    : null;

  const initials = (driver.name || 'D')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return src ? (
    <img
      src={src}
      alt={driver.name}
      onError={() => setImgError(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ isOnline }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: isOnline ? 'rgba(74,222,128,0.15)' : 'rgba(148,163,184,0.15)',
        color: isOnline ? '#4ade80' : '#94a3b8',
        border: `1px solid ${isOnline ? 'rgba(74,222,128,0.4)' : 'rgba(148,163,184,0.3)'}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: isOnline ? '#4ade80' : '#94a3b8',
          boxShadow: isOnline ? '0 0 6px #4ade80' : 'none',
        }}
      />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.08)` }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 10% 10%, rgba(34,197,94,0.08), transparent 35%), #0b0f19',
    color: '#fff',
    paddingTop: 80,
    paddingBottom: 40,
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 16px',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: '0 0 8px',
    background: 'linear-gradient(135deg, #4ade80, #22c55e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    margin: '0 0 20px',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  filtersRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 22,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 160,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  statusTabs: {
    display: 'flex',
    gap: 6,
  },
  tabBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    background: 'rgba(34,197,94,0.18)',
    border: '1px solid rgba(34,197,94,0.5)',
    color: '#4ade80',
  },
  center: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #22c55e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
  errorBox: {
    textAlign: 'center',
    padding: '40px 20px',
    borderRadius: 14,
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
  },
  retryBtn: {
    marginTop: 14,
    padding: '8px 22px',
    borderRadius: 8,
    border: 'none',
    background: '#22c55e',
    color: '#000',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
  },
  /* Table (visible on md+) */
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    display: 'block',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    padding: '13px 16px',
    textAlign: 'left',
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background 0.15s',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
  rowNum: {
    color: '#475569',
    fontWeight: 600,
    fontSize: 13,
  },
  driverCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  driverName: {
    fontWeight: 600,
    color: '#f1f5f9',
  },
  phone: {
    fontFamily: 'monospace',
    color: '#cbd5e1',
    fontSize: 13,
  },
  area: {
    color: '#e2e8f0',
    fontWeight: 500,
  },
  serviceAreas: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  areaChip: {
    padding: '2px 8px',
    borderRadius: 999,
    background: 'rgba(96,165,250,0.12)',
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: 500,
  },
  rides: {
    color: '#a5b4fc',
    fontWeight: 600,
  },
  /* Cards (mobile, hidden on table view) */
  cardGrid: {
    display: 'none',
    gridTemplateColumns: '1fr',
    gap: 12,
  },
  card: {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(255,255,255,0.04)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardName: {
    fontWeight: 700,
    fontSize: 15,
    color: '#f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardPhone: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 500,
  },
  cardVal: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: 500,
  },
};

// Inject spin keyframe & responsive rules once
if (typeof document !== 'undefined' && !document.getElementById('driver-dir-styles')) {
  const el = document.createElement('style');
  el.id = 'driver-dir-styles';
  el.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 680px) {
      .ddir-table { display: none !important; }
      .ddir-cards { display: grid !important; }
    }
  `;
  document.head.appendChild(el);
}
