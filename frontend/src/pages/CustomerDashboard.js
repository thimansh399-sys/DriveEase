import { useEffect, useState } from "react";
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings');
  const [activeRide, setActiveRide] = useState({ driver: 'Rahul', status: 'On the way' });
  const [bookings, setBookings] = useState([
    { id: 1, amount: 250, status: 'completed', date: '2024-03-01' },
    { id: 2, amount: 180, status: 'completed', date: '2024-03-10' },
  ]);
  const [payHistory, setPayHistory] = useState([
    { id: 1, amount: 250, date: '2024-03-01' },
    { id: 2, amount: 180, date: '2024-03-10' },
  ]);
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'Rahul Singh', city: 'Kanpur', state: 'UP', pincode: '208001', available: true },
    { id: 2, name: 'Amit Verma', city: 'Lucknow', state: 'UP', pincode: '226001', available: false },
  ]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({ driverId: '', date: '', pickup: '', drop: '' });
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      window.location.href = "/login";
    } else {
      setUser(storedUser);
    }
    // In real app, fetch active ride and bookings from API here
  }, []);

  if (!user) return <div style={{color:"white"}}>Loading...</div>;

  // Booking form handlers
  const handleBookingInput = (e) => {
    const { name, value } = e.target;
    setBookingDetails((prev) => ({ ...prev, [name]: value }));
  };
  const handleBookRide = (e) => {
    e.preventDefault();
    // Simulate booking creation and confirmation
    const newBookingId = Math.floor(Math.random() * 1000000);
    const newBooking = {
      id: newBookingId,
      amount: 200,
      status: 'confirmed',
      date: bookingDetails.date,
      driver: drivers.find(d => d.id === Number(bookingDetails.driverId))?.name || '',
      pickup: bookingDetails.pickup,
      drop: bookingDetails.drop,
    };
    setBookings((prev) => [{ ...newBooking }, ...prev]);
    setBookingConfirmation({ bookingId: newBookingId });
    setShowBookingForm(false);
    setActiveTab('bookings');
  };


  return (
    <div className="customer-dashboard">
      <h2 className="cdash-title">Welcome, {user.name}</h2>
      <div className="cdash-tabs">
        <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}>Booking History</button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
        <button className={activeTab === 'pay' ? 'active' : ''} onClick={() => setActiveTab('pay')}>Pay History</button>
        <button className="cdash-book-btn" onClick={() => { setShowBookingForm(true); setBookingConfirmation(null); }}>Book Ride</button>
      </div>

      {/* Booking Confirmation Modal */}
      {bookingConfirmation && (
        <div className="cdash-modal">
          <div className="cdash-modal-content">
            <h3>Booking Confirmed!</h3>
            <p>Your booking ID: <b>{bookingConfirmation.bookingId}</b></p>
            <button onClick={() => setBookingConfirmation(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="cdash-modal">
          <div className="cdash-modal-content">
            <h3>Book a Ride</h3>
            <form onSubmit={handleBookRide}>
              <label>Driver:
                <select name="driverId" value={bookingDetails.driverId} onChange={handleBookingInput} required>
                  <option value="">Select Driver</option>
                  {drivers.filter(d => d.available).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.city})</option>
                  ))}
                </select>
              </label>
              <label>Date:
                <input type="date" name="date" value={bookingDetails.date} onChange={handleBookingInput} required />
              </label>
              <label>Pickup Location:
                <input type="text" name="pickup" value={bookingDetails.pickup} onChange={handleBookingInput} required />
              </label>
              <label>Drop Location:
                <input type="text" name="drop" value={bookingDetails.drop} onChange={handleBookingInput} required />
              </label>
              <button type="submit">Confirm Booking</button>
              <button type="button" onClick={() => setShowBookingForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="cdash-tab-content">
        {activeTab === 'bookings' && (
          <div>
            <h3>Booking History</h3>
            {bookings.length === 0 ? <div>No bookings yet.</div> : (
              <table className="cdash-table">
                <thead>
                  <tr><th>ID</th><th>Date</th><th>Driver</th><th>Pickup</th><th>Drop</th><th>Status</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.id}</td>
                      <td>{b.date}</td>
                      <td>{b.driver || '-'}</td>
                      <td>{b.pickup || '-'}</td>
                      <td>{b.drop || '-'}</td>
                      <td>{b.status}</td>
                      <td>₹{b.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {activeTab === 'profile' && (
          <div>
            <h3>Profile</h3>
            <div className="cdash-profile">
              <div><b>Name:</b> {user.name}</div>
              <div><b>Phone:</b> {user.phone}</div>
              <div><b>Role:</b> {user.role}</div>
            </div>
          </div>
        )}
        {activeTab === 'pay' && (
          <div>
            <h3>Pay History</h3>
            {payHistory.length === 0 ? <div>No payments yet.</div> : (
              <table className="cdash-table">
                <thead>
                  <tr><th>ID</th><th>Date</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {payHistory.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.date}</td>
                      <td>₹{p.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
