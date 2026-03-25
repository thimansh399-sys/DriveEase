const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Simple in-memory OTP store (use Redis in production)
const otpStore = new Map();

const generateOTP = (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  return otp;
};

const verifyOTP = (phone, otp) => {
  const stored = otpStore.get(phone);
  if (!stored) return false;
  if (stored.expiresAt < Date.now()) {
    otpStore.delete(phone);
    return false;
  }
  if (stored.otp !== otp) return false;
  otpStore.delete(phone);
  return true;
};

const generateBookingId = () => {
  return 'DE' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};

const calculatePrice = (distance, hours, bookingType) => {
  let basePrice = 100;
  let perKmRate = 15;
  let perHourRate = 100;

  if (bookingType === 'hourly') {
    return (hours * perHourRate) + (distance * perKmRate);
  } else if (bookingType === 'daily') {
    return Math.max(1000, (hours * perHourRate) + (distance * perKmRate));
  } else if (bookingType === 'outstation') {
    return (distance * perKmRate * 2);
  }
  return basePrice;
};

module.exports = {
  generateOTP,
  verifyOTP,
  generateBookingId,
  calculateDistance,
  calculatePrice
};
