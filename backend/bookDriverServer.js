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
  res.json({ success: true, booking });
});

app.get('/api/bookings', (req, res) => {
  res.json({ bookings });
});

app.listen(5000, () => console.log('BookDriver API running on port 5000'));
