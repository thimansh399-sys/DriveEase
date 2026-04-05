/**
 * OTP and booking verification utilities
 */

const crypto = require('crypto');

/**
 * Generate a random 6-digit OTP
 * @returns {String} - 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a unique booking confirmation code
 * @param {String} bookingId - MongoDB booking ID
 * @param {String} customerId - Customer ID for uniqueness
 * @returns {String} - Unique booking code
 */
function generateBookingConfirmationCode(bookingId, customerId) {
  const hash = crypto
    .createHash('sha256')
    .update(`${bookingId}-${customerId}-${Date.now()}`)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();
  
  return `BK-${hash}`;
}

/**
 * Verify OTP matches
 * @param {String} providedOTP - OTP provided by user
 * @param {String} storedOTP - OTP stored in database
 * @param {Date} otpExpiry - Retained for backward compatibility (ignored)
 * @returns {Object} - {verified: Boolean, message: String}
 */
function verifyOTP(providedOTP, storedOTP, otpExpiry) {
  if (!storedOTP) {
    return { verified: false, message: 'OTP not found. Please request a new OTP.' };
  }
  
  if (providedOTP !== storedOTP) {
    return { verified: false, message: 'Incorrect OTP. Please try again.' };
  }
  
  return { verified: true, message: 'OTP verified successfully.' };
}

/**
 * Generate unique ride ID with timestamp
 * @param {String} driverId - Driver ID
 * @param {String} customerId - Customer ID
 * @returns {String} - Unique ride ID like RIDE-20260323-1234567890
 */
function generateRideId(driverId, customerId) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  return `RIDE-${dateString}-${timestamp}-${random}`;
}

/**
 * Create device fingerprint for single device login
 * @param {Object} deviceInfo - {userAgent, ipAddress, deviceId}
 * @returns {String} - Device fingerprint hash
 */
function createDeviceFingerprint(deviceInfo) {
  const { userAgent = '', ipAddress = '', deviceId = '' } = deviceInfo;
  const fingerprint = `${userAgent}-${ipAddress}-${deviceId}`;
  
  return crypto
    .createHash('sha256')
    .update(fingerprint)
    .digest('hex');
}

/**
 * Validate device fingerprint for session
 * @param {String} currentFingerprint - Current device fingerprint
 * @param {String} storedFingerprint - Stored device fingerprint
 * @param {Boolean} allowMultiDevice - If true, allows different devices
 * @returns {Object} - {valid: Boolean, message: String}
 */
function validateDeviceFingerprint(currentFingerprint, storedFingerprint, allowMultiDevice = false) {
  if (allowMultiDevice) {
    return { valid: true, message: 'Multi-device login allowed.' };
  }
  
  if (currentFingerprint !== storedFingerprint) {
    return {
      valid: false,
      message: 'Login from a different device detected. Your previous session has been terminated.'
    };
  }
  
  return { valid: true, message: 'Device verified.' };
}

/**
 * Check if session is still active (within timeout)
 * @param {Date} lastActivityTime - Last activity timestamp
 * @param {Number} timeoutMinutes - Session timeout in minutes (default: 30)
 * @returns {Boolean}
 */
function isSessionActive(lastActivityTime, timeoutMinutes = 30) {
  const now = new Date();
  const lastActivity = new Date(lastActivityTime);
  const diffMinutes = (now - lastActivity) / (1000 * 60);
  
  return diffMinutes < timeoutMinutes;
}

/**
 * Generate payment screenshot verification token
 * @param {String} driverId - Driver ID
 * @returns {Object} - {token: String, expiresAt: Date}
 */
function generatePaymentVerificationToken(driverId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return { token, expiresAt };
}

/**
 * Format payment verification status
 * @param {String} status - Status from DB ('pending', 'verified', 'rejected')
 * @returns {Object} - Formatted status for frontend
 */
function formatPaymentVerificationStatus(status) {
  const statusMap = {
    pending: {
      label: 'Pending Verification',
      icon: 'hourglass',
      color: 'warning',
      description: 'Your payment screenshot is being reviewed. Please wait.'
    },
    verified: {
      label: 'Verified',
      icon: 'checkmark',
      color: 'success',
      description: 'Your registration is complete and approved.'
    },
    rejected: {
      label: 'Verification Failed',
      icon: 'close',
      color: 'danger',
      description: 'Your payment screenshot was rejected. Please resubmit.'
    }
  };
  
  return statusMap[status] || statusMap.pending;
}

/**
 * Hash sensitive data (for storing screenshots/documents securely)
 * @param {String} data - Data to hash
 * @returns {String} - SHA256 hash
 */
function hashData(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate receipt for a completed booking
 * @param {Object} bookingData - Booking details
 * @returns {Object} - Receipt object
 */
function generateReceipt(bookingData) {
  const {
    bookingId,
    rideId,
    customerName,
    driverName,
    pickupLocation,
    dropLocation,
    startTime,
    endTime,
    distance,
    baseFare,
    surcharges,
    totalAmount,
    paymentMethod
  } = bookingData;
  
  return {
    receiptId: `RCP-${Date.now()}`,
    bookingId,
    rideId,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-IN'),
    customer: customerName,
    driver: driverName,
    pickup: pickupLocation,
    dropoff: dropLocation,
    journeyDetails: {
      startTime,
      endTime,
      distance: `${distance.toFixed(2)} km`
    },
    charges: {
      baseFare,
      surcharges,
      total: totalAmount
    },
    paymentMethod,
    paymentStatus: 'Completed'
  };
}

module.exports = {
  generateOTP,
  generateBookingConfirmationCode,
  verifyOTP,
  generateRideId,
  createDeviceFingerprint,
  validateDeviceFingerprint,
  isSessionActive,
  generatePaymentVerificationToken,
  formatPaymentVerificationStatus,
  hashData,
  generateReceipt
};
