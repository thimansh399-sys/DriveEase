const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  pickupLocation: {
    address: String,
    latitude: Number,
    longitude: Number,
    city: String,
    state: String,
    pincode: String
  },
  dropLocation: {
    address: String,
    latitude: Number,
    longitude: Number,
    city: String,
    state: String,
    pincode: String
  },
  bookingType: {
    type: String,
    enum: ['hourly', 'daily', 'outstation', 'subscription'],
    default: 'daily'
  },
  startDate: Date,
  endDate: Date,
  numberOfDays: Number,
  totalHours: Number,
  estimatedDistance: Number,
  estimatedPrice: Number,
  finalPrice: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'driver_assigned', 'driver_arrived', 'otp_verified', 'in_progress', 'ON_TRIP', 'completed', 'cancelled'],
    default: 'pending'
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiresAt: {
    type: Date,
    default: null
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  fareRatePerKm: {
    type: Number,
    default: 15
  },
  distance: {
    type: Number,
    default: 0
  },
  fare: {
    type: Number,
    default: 0
  },
  rideStartTime: {
    type: Date,
    default: null
  },
  rideEndTime: {
    type: Date,
    default: null
  },
  currentDriverLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },
  lastDriverLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'net_banking', 'wallet'],
    default: 'upi'
  },
  paymentId: String,
  insuranceOpted: {
    type: Boolean,
    default: false
  },
  insuranceAmount: {
    type: Number,
    default: 0
  },
  insuranceType: {
    type: String,
    enum: ['none', 'per_ride', 'monthly']
  },
  driverInsuranceOpted: {
    type: Boolean,
    default: false
  },
  driverInsuranceAmount: {
    type: Number,
    default: 0
  },
  rejectedByDrivers: [{
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    action: {
      type: String,
      enum: ['reject', 'decline'],
      default: 'reject'
    },
    reason: {
      type: String,
      default: ''
    },
    rejectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  route: {
    type: String,
    default: null
  },
  feedback: {
    rating: Number,
    comment: String,
    date: Date
  },
  emergency: {
    sosCalled: { type: Boolean, default: false },
    sosTime: Date,
    sosDetails: String
  },
  helplineUsed: {
    type: Boolean,
    default: false
  },
  // OTP verification for ride start
  verification: {
    otp: String,
    otpGenerated: Date,
    otpExpiry: Date,
    otpSharedWithDriver: { type: Boolean, default: false },
    otpSharedAt: Date,
    otpSharedByCustomer: { type: Boolean, default: false },
    otpVerified: { type: Boolean, default: false },
    otpVerificationTime: Date
  },
  // Post-ride payment tracking
  rideCompletion: {
    actualStartTime: Date,
    actualEndTime: Date,
    actualDistance: Number,
    finalCalculatedPrice: Number,
    paymentReceivedTime: Date,
    paymentVerified: { type: Boolean, default: false }
  },
  // Ride flow - commission & plan info
  rideFlow: {
    driverPlan: { type: String, enum: ['ZERO', 'GROWTH', 'ELITE'], default: 'ZERO' },
    baseFare: Number,
    peakMultiplier: { type: Number, default: 1.0 },
    finalFare: Number,
    commissionRate: Number,
    commissionAmount: Number,
    driverEarning: Number,
    isPeakRide: { type: Boolean, default: false },
    allocationScore: Number,
    driverDistance: Number
  },
  // Timestamps in IST
  timestamps: {
    bookingCreatedIST: String, // Format: DD-MM-YYYY HH:mm:ss IST
    rideStartIST: String,
    rideEndIST: String,
    paymentReceivedIST: String
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
