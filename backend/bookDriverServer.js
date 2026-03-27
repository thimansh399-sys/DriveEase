const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let bookings = [];

app.post('/api/book-driver', (req, res) => {
  const { name, phone, pickup, drop, insurance, distance, fare, finalAmount } = req.body;
  const booking = {
    id: bookings.length + 1,
    name,
    phone,
    pickup,
    drop,
    insurance,
    distance,
    fare,
    finalAmount,
    status: 'CONFIRMED',
    createdAt: new Date(),
  };

  bookings.push(booking);
  return res.json({ success: true, booking });
});

app.get('/api/bookings', (req, res) => {
  return res.json({ bookings });
});

// Compatibility guard: if this legacy server is started by mistake,
// return a clear error instead of a confusing 404 for modern booking route.
app.post('/api/bookings/book-ride', (req, res) => {
  return res.status(503).json({
    error: 'Legacy booking server is running',
    message: 'Start backend/server.js for /api/bookings/book-ride support.',
  });
});

const PORT = Number(process.env.BOOK_DRIVER_PORT || process.env.PORT || 5001);
app.listen(PORT, () => {
  console.log(`Legacy BookDriver API running on port ${PORT}`);
  if (PORT === 5000) {
    console.warn('Warning: Port 5000 is usually used by backend/server.js.');
  }
});
