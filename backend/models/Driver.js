const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    sparse: true
  },
  aadhaarNumber: {
    type: String
  },
  licenseNumber: {
    type: String
  },
  profilePicture: {
    type: String,
    default: null
  },
  documents: {
    aadhar: {
      number: String,
      file: String,
      verified: { type: Boolean, default: false }
    },
    // PAN card removed as per new requirements
    drivingLicense: {
      number: String,
      file: String,
      expiryDate: Date,
      verified: { type: Boolean, default: false }
    },
    selfie: {
      file: String,
      verified: { type: Boolean, default: false }
    }
  },
  personalDetails: {
    dateOfBirth: Date,
    address: String,
    city: String,
    state: String,
    pincode: String,
    bloodGroup: String
  },
  vehicle: {
    model: String,
    registrationNumber: String,
    color: String,
    seatCapacity: Number,
    insuranceExpiry: Date,
    // Vehicle type removed - now part of Booking preferences
    seatsAvailable: { type: Number, default: 0 }
  },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    verified: { type: Boolean, default: false }
  },
  upiId: String,
  experience: {
    yearsOfExperience: Number,
    totalRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  rating: {
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  training: {
    etiquetteTraining: { type: Boolean, default: false },
    safetyTraining: { type: Boolean, default: false },
    trainingCertificate: String
  },
  languages: [String],
  serviceAreas: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'blocked', 'offline', 'online'],
    default: 'pending'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  availabilityStatus: {
    type: String,
    enum: ['AVAILABLE', 'BUSY'],
    default: 'AVAILABLE'
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    city: String,
    state: String,
    pincode: String,
    lastUpdated: Date
  },
  onlineHours: [{
    date: Date,
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  }],
  registrationFee: {
    amount: { type: Number, default: 150 },
    paid: { type: Boolean, default: false },
    paymentId: String,
    paymentDate: Date
  },
  backgroundVerification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending'
    },
    verificationDate: Date,
    verificationDetails: String
  },
  medicalFitness: {
    status: {
      type: String,
      enum: ['pending', 'fit', 'unfit'],
      default: 'pending'
    },
    certficateFile: String,
    expiryDate: Date
  },
  // Device-based single login tracking
  activeSession: {
    deviceId: String,
    loginTime: Date,
    lastActivityTime: Date,
    ipAddress: String,
    deviceInfo: String
  },
  // Payment verification for registration
  paymentVerification: {
    registrationFeeAmount: { type: Number, default: 150 },
    screenshotUrl: String,
    screenshotSubmissionTime: Date,
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verificationTime: Date,
    adminNotes: String
  },
  // Commission and earnings tracking
  commission: {
    rate: { type: Number, default: 0.1 }, // 10% commission
    totalCommissionEarned: { type: Number, default: 0 },
    totalEarningsAfterCommission: { type: Number, default: 0 }
  },
  // Subscription Plan
  plan: {
    type: {
      type: String,
      enum: ['ZERO', 'GROWTH', 'ELITE'],
      default: 'ZERO'
    },
    subscribedAt: Date,
    expiresAt: Date,
    autoRenew: { type: Boolean, default: false }
  },
  // Ride Allocation Metrics
  acceptanceRate: { type: Number, default: 100 }, // percentage
  ridesToday: { type: Number, default: 0 },
  ridesThisWeek: { type: Number, default: 0 },
  ridesThisMonth: { type: Number, default: 0 },
  monthlyEarnings: { type: Number, default: 0 },
  lastRideAt: Date,
  lastActiveAt: { type: Date, default: Date.now },
  inactiveDays: { type: Number, default: 0 },
  // Online hours tracking for analytics
  onlineStatus: {
    isCurrentlyOnline: { type: Boolean, default: false },
    onlineStartTime: Date,
    totalOnlineHoursThisMonth: { type: Number, default: 0 },
    totalOnlineHoursAllTime: { type: Number, default: 0 }
  },
  totalHours: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Driver', driverSchema);
