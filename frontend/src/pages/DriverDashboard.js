import React, { useEffect, useState } from "react";

export default function DriverDashboard() {
  const [driver, setDriver] = useState({});
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
    amount: "",
  });

  // Fetch driver data
  useEffect(() => {
    fetchDriver();
    fetchStats();
  }, []);

  const fetchDriver = async () => {
    const res = await fetch("http://localhost:5000/api/driver/profile");
    const data = await res.json();
    setDriver(data);
    setIsOnline(data.isOnline);
  };

  const fetchStats = async () => {
    const res = await fetch("http://localhost:5000/api/driver/stats");
    const data = await res.json();
    setStats(data);
  };

  // Toggle Online/Offline
  const toggleStatus = async () => {
    await fetch("http://localhost:5000/api/driver/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isOnline: !isOnline }),
    });

    setIsOnline(!isOnline);
  };

  // Withdraw request
  const handleWithdraw = async () => {
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
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">{driver.name}</h2>
          <p className="text-green-600">✔ {driver.city}</p>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={toggleStatus}
            className={`px-4 py-2 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            } text-white`}
          >
            {isOnline ? "Online" : "Offline"}
          </button>

          <button className="text-red-500">Logout</button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h3 className="text-green-600 text-xl">₹{stats.earnings}</h3>
          <p>Net Earnings</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h3 className="text-blue-600 text-xl">{stats.trips}</h3>
          <p>Total Trips</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h3 className="text-orange-500 text-xl">₹{stats.commission}</h3>
          <p>Commission</p>
        </div>
      </div>

      {/* WITHDRAW */}
      <div className="bg-white p-6 rounded-xl shadow max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Request Withdrawal</h2>

        {/* Toggle */}
        <div className="flex mb-4">
          <button
            onClick={() => setMethod("upi")}
            className={`flex-1 p-2 ${
              method === "upi" ? "bg-green-500 text-white" : "bg-gray-200"
            }`}
          >
            UPI ID
          </button>

          <button
            onClick={() => setMethod("bank")}
            className={`flex-1 p-2 ${
              method === "bank" ? "bg-green-500 text-white" : "bg-gray-200"
            }`}
          >
            Bank Transfer
          </button>
        </div>

        <input
          type="text"
          placeholder="Account Holder Name"
          className="w-full mb-3 p-2 border rounded"
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        {method === "upi" && (
          <input
            type="text"
            placeholder="UPI ID"
            className="w-full mb-3 p-2 border rounded"
            onChange={(e) =>
              setForm({ ...form, upi: e.target.value })
            }
          />
        )}

        <input
          type="number"
          placeholder="Amount"
          className="w-full mb-4 p-2 border rounded"
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
        />

        <button
          onClick={handleWithdraw}
          className="w-full bg-green-600 text-white py-2 rounded-lg"
        >
          Request Withdrawal
        </button>
      </div>
    </div>
  );
}
