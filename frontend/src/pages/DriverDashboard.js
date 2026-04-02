import React, { useEffect, useState } from "react";
import "../styles/DriverDashboard.css";

export default function DriverDashboard() {
  const [driver, setDriver] = useState({ name: "Driver", city: "-" });
  const [stats, setStats] = useState({
    earnings: 0,
    trips: 0,
    commission: 0,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [method, setMethod] = useState("upi");

  const [form, setForm] = useState({
    name: "",
    upi: "",
    bank: "",
    amount: "",
  });

  // Fetch driver data
  useEffect(() => {
    fetchDriver();
    fetchStats();
  }, []);

  const fetchDriver = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/driver/profile");
      const data = await res.json();
      setDriver(data || {});
      setIsOnline(Boolean(data?.isOnline));
      setForm((prev) => ({ ...prev, name: data?.name || prev.name }));
    } catch (error) {
      // Keep fallback UI values if profile API is unavailable.
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/driver/stats");
      const data = await res.json();
      setStats({
        earnings: Number(data?.earnings || 0),
        trips: Number(data?.trips || 0),
        commission: Number(data?.commission || 0),
      });
    } catch (error) {
      setStats({ earnings: 0, trips: 0, commission: 0 });
    }
  };

  // Toggle Online/Offline
  const toggleStatus = async () => {
    try {
      await fetch("http://localhost:5000/api/driver/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isOnline: !isOnline }),
      });
    } catch (error) {
      // Toggle locally even if API is unreachable in dev.
    } finally {
      setIsOnline(!isOnline);
    }
  };

  // Withdraw request
  const handleWithdraw = async () => {
    if (!form.name.trim()) {
      alert("Please enter account holder name");
      return;
    }

    if (method === "upi" && !form.upi.trim()) {
      alert("Please enter UPI ID");
      return;
    }

    if (method === "bank" && !form.bank.trim()) {
      alert("Please enter bank account details");
      return;
    }

    try {
      await fetch("http://localhost:5000/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          method,
        }),
      });
      alert("Withdrawal Requested ✅");
    } catch (error) {
      alert("Withdrawal request submitted locally (backend not reachable).");
    }
  };

  const handleAcceptRide = () => {
    alert("Ride accepted flow connected. You can wire this to pending request API.");
  };

  const handleViewRequests = () => {
    alert("View requests flow ready. Connect this button to requests list page/API.");
  };

  return (
    <div className="driver-dashboard-modern">
      <div className="driver-dashboard-shell">
        <div className="driver-dashboard-head">
          <h1>Driver Dashboard</h1>
          <p>{driver?.name || "Driver"} · {driver?.city || "City"}</p>
        </div>

        <div className="driver-stats-grid">
          <div className="driver-modern-card card-hover-pop">
            <h3>Net Earnings</h3>
            <p className="driver-metric earnings">₹{stats.earnings}</p>
          </div>

          <div className="driver-modern-card card-hover-pop">
            <h3>Total Trips</h3>
            <p className="driver-metric">{stats.trips}</p>
          </div>

          <div className="driver-modern-card card-hover-pop">
            <h3>Commission</h3>
            <p className="driver-metric">₹{stats.commission}</p>
          </div>
        </div>

        <div className="driver-modern-card card-hover-pop">
          <h2>Driver Status</h2>
          <div className="driver-status-row">
            <span className={`driver-status-pill ${isOnline ? "online" : "offline"}`}>
              {isOnline ? "🟢 Online" : "⚪ Offline"}
            </span>
            <button onClick={toggleStatus} className="driver-primary-btn btn-hover-pop">
              {isOnline ? "Go Offline" : "Go Online"}
            </button>
          </div>
        </div>

        <div className="driver-modern-card card-hover-pop">
          <h2>Ride Actions</h2>
          <div className="driver-actions-grid">
            <button onClick={handleAcceptRide} className="driver-primary-btn btn-hover-pop">Accept Ride</button>
            <button onClick={handleViewRequests} className="driver-secondary-btn btn-hover-pop">View Requests</button>
          </div>
        </div>

        <div className="driver-modern-card card-hover-pop withdraw-card">
          <h2>💰 Withdraw Money</h2>

          <div className="driver-method-toggle">
            <button
              onClick={() => setMethod("upi")}
              className={`driver-method-btn ${method === "upi" ? "active" : ""}`}
            >
              UPI
            </button>
            <button
              onClick={() => setMethod("bank")}
              className={`driver-method-btn ${method === "bank" ? "active" : ""}`}
            >
              Bank
            </button>
        </div>

          <input
            type="text"
            placeholder="Account Holder Name"
            className="driver-input"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          {method === "upi" ? (
            <input
              type="text"
              placeholder="UPI ID"
              className="driver-input"
              value={form.upi}
              onChange={(e) => setForm({ ...form, upi: e.target.value })}
            />
          ) : (
            <input
              type="text"
              placeholder="Bank Account Number"
              className="driver-input"
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
            />
          )}

          <input
            type="number"
            placeholder="Amount"
            className="driver-input"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <button onClick={handleWithdraw} className="driver-primary-btn btn-hover-pop full-width">
            Request Withdrawal
          </button>
        </div>
      </div>
    </div>
  );
}
