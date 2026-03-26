require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');

// Routes
const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/drivers');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const driverRegistrationRoutes = require('./routes/driverRegistration');
const bookingsEnhancedRoutes = require('./routes/bookingsEnhanced');
const adminDashboardRoutes = require('./routes/adminDashboard');
const publicRoutes = require('./routes/public');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', require('express').static(require('path').join(__dirname, 'uploads')));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/driveease', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/driver-registration', driverRegistrationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings-enhanced', bookingsEnhancedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'DriveEase API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`DriveEase API running on port ${PORT}`);
});
