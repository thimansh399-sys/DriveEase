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

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const HOURLY_BASE_FARE = 99;
const HOURLY_RATE = 120;
const DAILY_MIN_FARE = 699;
const DAILY_MAX_FARE = 999;
const OUTSTATION_RATE_PER_KM = 12;
const OUTSTATION_RATE_PER_DAY = 1200;
const NIGHT_CHARGE = 100;
const WAITING_RATE_PER_MIN = 2;
const DEFAULT_FREE_WAITING_MINUTES = 10;
const OVERTIME_RATE_PER_HOUR = 100;

const resolveFreeWaitingMinutes = () => {
  const configured = Number(process.env.RIDE_FREE_WAITING_MINUTES);
  if (Number.isFinite(configured) && configured >= 0) {
    return Math.floor(configured);
  }
  return DEFAULT_FREE_WAITING_MINUTES;
};

const calculateDailyFixedFare = (hours) => {
  const safeHours = Number.isFinite(Number(hours)) ? Number(hours) : 8;

  if (safeHours <= 8) {
    return DAILY_MIN_FARE;
  }

  if (safeHours >= 12) {
    return DAILY_MAX_FARE;
  }

  const ratio = (safeHours - 8) / 4;
  return roundMoney(DAILY_MIN_FARE + ((DAILY_MAX_FARE - DAILY_MIN_FARE) * ratio));
};

const isNightWindow = (dateValue) => {
  const bookingDate = new Date(dateValue || Date.now());
  const hour = bookingDate.getHours();
  return hour >= 22 || hour < 6;
};

const calculateRideBill = ({
  bookingType = 'daily',
  distance = 0,
  hours = 8,
  days = 1,
  bookingTime = new Date(),
  waitingMinutes = 0,
  overtimeHours = 0,
  freeWaitingMinutes = resolveFreeWaitingMinutes(),
  insuranceAmount = 0,
} = {}) => {
  const normalizedType = String(bookingType || 'daily').toLowerCase();
  const normalizedDistance = Math.max(0, Number(distance) || 0);
  const normalizedHours = Math.max(0, Number(hours) || 0);
  const normalizedDays = Math.max(1, Number(days) || 1);
  const normalizedWaitingMinutes = Math.max(0, Number(waitingMinutes) || 0);
  const normalizedOvertimeHours = Math.max(0, Number(overtimeHours) || 0);

  let baseFare = 0;
  let pricingRule = '';

  if (normalizedType === 'hourly') {
    const billedHours = Math.max(1, Math.ceil(normalizedHours || 1));
    baseFare = HOURLY_BASE_FARE + (billedHours * HOURLY_RATE);
    pricingRule = 'Hourly: INR 99 base + INR 120/hour';
  } else if (normalizedType === 'daily') {
    baseFare = calculateDailyFixedFare(normalizedHours || 8);
    pricingRule = 'Daily (8-12 hrs): INR 699-INR 999 fixed';
  } else if (normalizedType === 'outstation') {
    const byDistance = normalizedDistance * OUTSTATION_RATE_PER_KM;
    const byDay = normalizedDays * OUTSTATION_RATE_PER_DAY;
    baseFare = Math.max(byDistance, byDay);
    pricingRule = 'Outstation: INR 12/km OR INR 1200/day (higher of the two)';
  } else {
    baseFare = calculateDailyFixedFare(normalizedHours || 8);
    pricingRule = 'Defaulted to daily fixed tariff';
  }

  const nightCharge = isNightWindow(bookingTime) ? NIGHT_CHARGE : 0;
  const chargeableWaitingMinutes = Math.max(0, Math.ceil(normalizedWaitingMinutes) - Number(freeWaitingMinutes || 0));
  const waitingCharge = chargeableWaitingMinutes * WAITING_RATE_PER_MIN;
  const overtimeCharge = Math.ceil(normalizedOvertimeHours) * OVERTIME_RATE_PER_HOUR;
  const normalizedInsurance = roundMoney(insuranceAmount);

  const estimatedPrice = roundMoney(baseFare + nightCharge + waitingCharge + overtimeCharge);
  const finalPrice = roundMoney(estimatedPrice + normalizedInsurance);

  return {
    estimatedPrice,
    finalPrice,
    breakdown: {
      pricingRule,
      baseFare: roundMoney(baseFare),
      addOns: {
        nightCharge: roundMoney(nightCharge),
        waitingCharge: roundMoney(waitingCharge),
        overtimeCharge: roundMoney(overtimeCharge),
      },
      inputs: {
        distanceKm: roundMoney(normalizedDistance),
        hours: roundMoney(normalizedHours),
        days: roundMoney(normalizedDays),
        waitingMinutes: roundMoney(normalizedWaitingMinutes),
        freeWaitingMinutes: Number(freeWaitingMinutes || 0),
        chargeableWaitingMinutes,
        overtimeHours: roundMoney(normalizedOvertimeHours),
      },
      insuranceAmount: normalizedInsurance,
      estimatedPrice,
      finalPrice,
    },
  };
};

const calculatePrice = (distance, hours, bookingType) => {
  return calculateRideBill({
    bookingType,
    distance,
    hours,
  }).estimatedPrice;
};

module.exports = {
  generateOTP,
  verifyOTP,
  generateBookingId,
  calculateDistance,
  calculatePrice,
  calculateRideBill
};
