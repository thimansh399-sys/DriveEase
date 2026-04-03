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
const isProductionRuntime = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
const mongoUri = process.env.MONGODB_URI || (!isProductionRuntime ? 'mongodb://localhost:27017/driveease' : '');

let isConnectingDb = false;
let reconnectTimer = null;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

const scheduleReconnect = () => {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectDB();
  }, 5000);
};

const connectDB = async () => {
  if (isConnectingDb || mongoose.connection.readyState === 1) return;

  if (!mongoUri) {
    console.error('MongoDB connection error: MONGODB_URI is not set in environment.');
    scheduleReconnect();
    return;
  }

  isConnectingDb = true;
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    scheduleReconnect();
  } finally {
    isConnectingDb = false;
  }
};

connectDB();

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Retrying connection...');
  scheduleReconnect();
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB runtime error:', error);
});

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

// Liveness check
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: 'DriveEase API is running',
    database: dbStateMap[readyState] || 'unknown'
  });
});

// Readiness check
app.get('/api/ready', (req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({
    ready: ok,
    database: ok ? 'connected' : 'unavailable'
  });
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
