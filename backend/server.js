const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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
const rideFlowRoutes = require('./routes/rideFlow');
const supportTicketsRoutes = require('./routes/supportTickets');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS Middleware
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: ["http://localhost:3002", "https://mydriveease.in"],
    credentials: true
  }));
} else {
  app.use(cors({
    origin: '*',
    credentials: true
  }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

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
app.use('/api/ride', rideFlowRoutes);
app.use('/api/support-tickets', supportTicketsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'DriveEase API is running' });
});

if (require('fs').existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }

    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`DriveEase API running on port ${PORT}`);
});
