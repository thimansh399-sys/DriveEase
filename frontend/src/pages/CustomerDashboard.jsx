import React from 'react';
import '../styles/Dashboard.css';







// Sidebar Component


// Sidebar
function Sidebar() {
  // Determine active tab from location
  const [activeTab, setActiveTab] = React.useState('profile');
  React.useEffect(() => {
    if (window.location.pathname.includes('my-bookings')) setActiveTab('bookings');
    else setActiveTab('profile');
  }, []); // window.location.pathname is not a valid dep

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">🚗</span>
        <span className="brand-name">DriveEase</span>
      </div>
      <div className={activeTab === 'profile' ? 'sidebar-active' : 'sidebar-link'}>
        <a href="/customer-dashboard" className="sidebar-btn">
          <span className="sidebar-icon">👤</span>
          <span>Profile</span>
        </a>
      </div>
      <div className={activeTab === 'bookings' ? 'sidebar-active' : 'sidebar-link'}>
        <a href="/my-bookings" className="sidebar-btn">
          <span className="sidebar-icon">📖</span>
          <span>My Bookings</span>
        </a>
      </div>
      <button
        style={{marginTop:'24px', padding:'10px 28px', borderRadius:'8px', background:'#ff2e63', color:'#fff', border:'none', fontWeight:600, fontSize:'1rem', cursor:'pointer', boxShadow:'0 2px 8px #ff2e6344', width:'90%', marginLeft:'5%'}}
        onClick={handleLogout}
      >
        Logout
      </button>
    </aside>
  );
}

// Top Bar
function TopBar({ user }) {
  return (
    <div className="topbar">
      <h2>My Profile</h2>
      <div className="user-greeting">
        Hi, {user?.name || "User"} <span role="img" aria-label="wave">👋</span>
      </div>
    </div>
  );
}

// Stats Section
function Stats({ bookings }) {
  const totalRides = bookings.length;
  const totalSpent = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const rating = 4.8; // Static for now
  const activeRides = bookings.filter(b => b.status && b.status !== "completed").length;

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-value">{totalRides}</div>
        <div className="stat-label">Total Rides</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">₹{totalSpent.toLocaleString()}</div>
        <div className="stat-label">Total Spent</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{rating} <span className="star">★</span></div>
        <div className="stat-label">Rating</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{activeRides}</div>
        <div className="stat-label">Active Ride</div>
      </div>
    </div>
  );
}

// Profile Card
function ProfileCard({ user }) {
  return (
    <div className="profile-card glass">
      <div className="profile-icon">👤</div>
      <div>
        <div className="profile-label">Name</div>
        <div className="profile-value">{user?.name || ""}</div>
      </div>
      <div>
        <div className="profile-label">Phone</div>
        <div className="profile-value">{user?.phone || ""}</div>
      </div>
    </div>
  );
}

// Ride History Card
function RideHistory({ bookings }) {
  return (
    <div className="ride-history glass">
      <h3>Recent Rides</h3>
      {bookings.length === 0 ? (
        <div className="ride-item empty">No rides yet</div>
      ) : (
        bookings.slice(0, 5).map((b, i) => (
          <div className="ride-item" key={b._id || i}>
            <div>
              <span className="ride-driver">{b.driver || "-"}</span>
              <span className={`ride-status ${b.status}`}>{b.status}</span>
            </div>
            <div className="ride-amount">₹{b.amount || "-"}</div>
          </div>
        ))
      )}
    </div>
  );
}

export default function CustomerDashboard() {
  const [user, setUser] = React.useState(null);
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}" );
    const token = localStorage.getItem("token");
    setUser(storedUser);

    if (storedUser?.phone && token) {
      setLoading(true);
      fetch(`http://localhost:5000/api/bookings/${storedUser.phone}`, {
        headers: { Authorization: "Bearer " + token }
      })
        .then(res => res.json())
        .then(data => setBookings(Array.isArray(data) ? data : []))
        .catch(() => setError("Failed to load bookings"))
        .finally(() => setLoading(false));
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, []);

  return (
    <div className="dashboard-root">
      <Sidebar />
      <main className="dashboard-main">
        <TopBar user={user} />
        <Stats bookings={bookings} />
        <ProfileCard user={user} />
        <button
          className="my-bookings-btn"
          style={{margin: '20px 0', padding: '12px 32px', fontSize: '1.1rem', borderRadius: '8px', background: '#1aff8c', color: '#111', border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #1aff8c44'}}
          onClick={() => window.location.href = '/my-bookings'}
        >
          My Bookings
        </button>
        {loading ? <div>Loading...</div> : <RideHistory bookings={bookings} />}
        {error && <div style={{color:'red'}}>{error}</div>}
      </main>
    </div>
  );
}
