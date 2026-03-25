const express = require('express');
const bookingEnhancedController = require('../controllers/bookingEnhancedController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Booking creation with pricing
router.post('/create', authMiddleware, bookingEnhancedController.createBooking);

// OTP verification
router.post('/:id/verify-otp', authMiddleware, bookingEnhancedController.verifyBookingOTP);

// Resend OTP
router.post('/:id/resend-otp', authMiddleware, bookingEnhancedController.resendOTP);

// Complete booking
router.post('/:id/complete', authMiddleware, bookingEnhancedController.completeBooking);

// Get bookings
router.get('/customer/:customerId', authMiddleware, bookingEnhancedController.getCustomerBookings);
router.get('/driver/:driverId', authMiddleware, bookingEnhancedController.getDriverBookings);

module.exports = router;
