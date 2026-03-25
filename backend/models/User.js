const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ['customer', 'driver', 'admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  profilePicture: {
    type: String,
    default: null
  },
  savedAddresses: [{
    label: String,
    address: String,
    latitude: Number,
    longitude: Number,
    city: String,
    state: String,
    pincode: String
  }],
  familyMembers: [{
    name: String,
    phone: String,
    relationship: String,
    canTrack: Boolean,
    spendingLimit: Number
  }],
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalRidesAmount: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('User', userSchema);
