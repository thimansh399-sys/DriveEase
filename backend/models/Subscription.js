const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  planType: {
    type: String,
    enum: ['office_commute', 'school_pickup', 'weekend_family', 'senior_care', 'custom'],
    required: true
  },
  planName: String,
  description: String,
  hoursPerDay: Number,
  daysPerMonth: Number,
  monthlyPrice: Number,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentId: String,
    status: String
  }],
  specialRequirements: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
