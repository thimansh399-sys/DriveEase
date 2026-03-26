import React, { useState } from 'react';
// NOTE: For real map/autocomplete, integrate Google Maps or Mapbox as needed

const insuranceOptions = [
  { label: 'No Insurance', value: 0 },
  { label: 'Basic Insurance (+₹50)', value: 50 },
  { label: 'Premium Insurance (+₹100)', value: 100 },
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  // Dummy: always returns 10km for demo
  return 10;
}

export default function BookDriver() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    pickup: '',
    drop: '',
    insurance: 0,
    distance: 0,
    fare: 0,
    finalAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Step 1: User Details
  const handleDetails = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 2: Pickup/Drop (simulate map)
  const handleLocation = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 3: Calculate Distance & Fare
  const calculateFare = () => {
    // For demo, static coordinates
    const distance = haversineDistance(0, 0, 0, 0); // Replace with real coords
    const baseFare = 100;
    const perKm = 15;
    const fare = baseFare + distance * perKm;
    const finalAmount = fare + Number(form.insurance);
    setForm({ ...form, distance, fare, finalAmount });
    setStep(4);
  };

  // Step 4: Confirm Booking
  const handleConfirm = async () => {
    setLoading(true);
    setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/book-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) setSuccess('Booking Confirmed!');
      else setSuccess('Booking Failed!');
    } catch {
      setSuccess('Booking Failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', background: '#fff', padding: 24, borderRadius: 12 }}>
      <h2>Book a Driver</h2>
      {step === 1 && (
        <div>
          <input name="name" placeholder="Your Name" value={form.name} onChange={handleDetails} style={inputStyle} />
          <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleDetails} style={inputStyle} />
          <button onClick={() => setStep(2)} disabled={!form.name || !form.phone}>Next</button>
        </div>
      )}
      {step === 2 && (
        <div>
          <input name="pickup" placeholder="Pickup Location" value={form.pickup} onChange={handleLocation} style={inputStyle} />
          <input name="drop" placeholder="Drop Location" value={form.drop} onChange={handleLocation} style={inputStyle} />
          {/* Map/Autocomplete integration can go here */}
          <button onClick={() => setStep(1)}>Back</button>
          <button onClick={() => setStep(3)} disabled={!form.pickup || !form.drop}>Next</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <div>
            <label>Insurance:</label>
            <select name="insurance" value={form.insurance} onChange={handleDetails} style={inputStyle}>
              {insuranceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setStep(2)}>Back</button>
          <button onClick={calculateFare}>Calculate Fare</button>
        </div>
      )}
      {step === 4 && (
        <div>
          <h3>Fare Summary</h3>
          <p>Distance: {form.distance} km</p>
          <p>Base Fare: ₹100</p>
          <p>Per Km: ₹15</p>
          <p>Insurance: ₹{form.insurance}</p>
          <p><b>Final Amount: ₹{form.finalAmount}</b></p>
          <button onClick={() => setStep(3)}>Back</button>
          <button onClick={handleConfirm} disabled={loading}>{loading ? 'Booking...' : 'Confirm Booking'}</button>
          {success && <div style={{ marginTop: 16, color: success.includes('Confirmed') ? 'green' : 'red' }}>{success}</div>}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  margin: '12px 0',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
};
