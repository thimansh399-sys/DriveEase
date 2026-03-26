import React, { useEffect, useState } from "react";
import api from "../utils/api";
import "../styles/Drivers.css";

// Fallback mock data
const mockDrivers = [
  {
    id: 1,
    name: "Rahul Sharma",
    rating: 4.8,
    rides: 120,
    experience: 5,
    location: "Lucknow",
    price: 80,
    available: true,
    profileImg: "https://randomuser.me/api/portraits/men/32.jpg",
    phone: "9876543210",
    vehicle: "Maruti Suzuki Dzire",
    license: "UP32AB1234",
    languages: ["Hindi", "English"],
    verified: true,
  },
  {
    id: 2,
    name: "Amit Verma",
    rating: 4.3,
    rides: 80,
    experience: 3,
    location: "Delhi",
    price: 70,
    available: false,
    profileImg: "https://randomuser.me/api/portraits/men/45.jpg",
    phone: "9876501234",
    vehicle: "Hyundai Xcent",
    license: "DL01CD5678",
    languages: ["Hindi"],
    verified: false,
  },
];

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState(null); // For profile modal
  const [booking, setBooking] = useState(null); // For booking modal

  const fetchDrivers = async () => {
    try {
      const res = await api.getAllDrivers('?status=all');
      if (Array.isArray(res) && res.length > 0) {
        setDrivers(
          res.map((d, i) => ({
            id: d._id || i,
            name: d.name,
            rating: d.rating?.averageRating ?? 0,
            rides: d.rating?.totalRatings ?? 0,
            experience: d.experience?.yearsOfExperience ?? 0,
            location: d.personalDetails?.city || d.location || "-",
            price: d.price || 80,
            available: d.isOnline ?? false,
            status: d.status || 'pending',
            profileImg: (() => {
              const pic = d.profilePicture || d.documents?.selfie?.file;
              if (!pic) return `https://randomuser.me/api/portraits/men/${i+30}.jpg`;
              if (pic.startsWith('http')) return pic;
              const relative = pic.replace(/^.*uploads[\/\\]/, 'uploads/');
              return `http://localhost:5000/${relative}`;
            })(),
            phone: d.phone || "-",
            vehicle: d.vehicle?.model || d.vehicle?.registrationNumber || "-",
            license: d.licenseNumber || d.license || "-",
            languages: d.languages?.length > 0 ? d.languages : ["Hindi"],
            verified: d.status === 'approved' || d.isVerified,
          }))
        );
      } else {
        setDrivers(mockDrivers);
      }
    } catch {
      setDrivers(mockDrivers);
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers on mount + auto-refresh every 5 seconds for live status
  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) &&
      d.rating >= rating
  );

  return (
    <div className="drivers-container">
      <div className="drivers-header">
        <h2>🚗 Find Your Driver</h2>
        <div className="filters">
          <input
            placeholder="Search driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select onChange={(e) => setRating(Number(e.target.value))}>
            <option value="0">All Ratings</option>
            <option value="4">4★+</option>
            <option value="4.5">4.5★+</option>
          </select>
        </div>
      </div>

      <div className="cards">
        {loading ? (
          <div className="empty">Loading drivers...</div>
        ) : filtered.length > 0 ? (
          filtered.map((d) => (
            <div className="card" key={d.id}>
              <div className="profile-row">
                <img
                  src={d.profileImg}
                  alt={d.name}
                  className="profile-img"
                  onError={e => e.target.src = "https://randomuser.me/api/portraits/men/31.jpg"}
                />
                <div className="top">
                  <h3>{d.name}</h3>
                  <span className={d.available ? "badge online" : "badge offline"}>
                    {d.available ? "🟢 Online" : "🔘 Offline"}
                  </span>
                </div>
              </div>
              <p>⭐ {d.rating} ({d.rides} rides)</p>
              <p>🚘 {d.experience} yrs experience</p>
              <p>📍 {d.location}</p>
              <p>🗣️ {d.languages.join(", ")}</p>
              <div className="bottom">
                <h4>₹{d.price}/hr</h4>
                <button onClick={() => setBooking(d)} disabled={!d.available}>
                  {d.available ? "Book Now" : "Unavailable"}
                </button>
                <button className="profile-btn" onClick={() => setSelected(d)}>
                  View Profile
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            😔 No drivers available <br />
            Try changing filters
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <img src={selected.profileImg} alt={selected.name} className="modal-img" />
            <h2>{selected.name}</h2>
            <p><b>Phone:</b> {selected.phone}</p>
            <p><b>Vehicle:</b> {String(selected.vehicle || '-')}</p>
            <p><b>License:</b> {String(selected.license || '-')}</p>
            <p><b>Experience:</b> {selected.experience} yrs</p>
            <p><b>Languages:</b> {Array.isArray(selected.languages) ? selected.languages.join(", ") : "Hindi"}</p>
            <p><b>Verified:</b> {selected.verified ? "Yes" : "No"}</p>
            <button onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {booking && (
        <div className="modal-overlay" onClick={() => setBooking(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Book {booking.name}</h2>
            <form className="booking-form" onSubmit={e => { e.preventDefault(); alert("Booking request sent!"); setBooking(null); }}>
              <label>
                Your Name
                <input required placeholder="Enter your name" />
              </label>
              <label>
                Pickup Location
                <input required placeholder="Enter pickup location" />
              </label>
              <label>
                Drop Location
                <input required placeholder="Enter drop location" />
              </label>
              <label>
                Date & Time
                <input required type="datetime-local" />
              </label>
              <button type="submit">Confirm Booking</button>
              <button type="button" onClick={() => setBooking(null)} style={{ marginLeft: 10 }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}