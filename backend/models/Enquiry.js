const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: String,
  phone: String,
  email: String,
  enquiryType: {
    type: String,
    enum: ['subscription', 'general', 'support', 'complaint'],
    default: 'general'
  },
  message: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  adminResponse: String,
  adminResponseDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
