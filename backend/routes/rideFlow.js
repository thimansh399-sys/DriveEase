/**
 * 🚀 RIDE FLOW ROUTES
 * Complete ride lifecycle: Book → Assign → Arrive → OTP → Start → Track → End
 */

const express = require('express');
const rideFlowController = require('../controllers/rideFlowController');
const { authMiddleware, driverMiddleware, customerMiddleware } = require('../middleware/auth');

const router = express.Router();

// ===== CUSTOMER ROUTES =====

// Book a ride (auto-assigns best driver)
router.post('/book', authMiddleware, customerMiddleware, rideFlowController.bookRide);

// Regenerate OTP
router.post('/:bookingId/regenerate-otp', authMiddleware, customerMiddleware, rideFlowController.regenerateOTP);

// Track ride (get driver live location)
router.get('/:bookingId/track', authMiddleware, rideFlowController.trackRide);

// Get active ride (for both customer & driver)
router.get('/active', authMiddleware, rideFlowController.getActiveRide);

// Ride history
router.get('/history', authMiddleware, rideFlowController.getRideHistory);

// Cancel ride (both customer & driver)
router.put('/:bookingId/cancel', authMiddleware, rideFlowController.cancelRide);

// ===== DRIVER ROUTES =====

// Update driver live location
router.post('/location/update', authMiddleware, driverMiddleware, rideFlowController.updateDriverLocation);

// Mark driver arrived at pickup
router.put('/:bookingId/arrived', authMiddleware, driverMiddleware, rideFlowController.driverArrived);

// Verify OTP and start ride
router.post('/:bookingId/verify-otp', authMiddleware, driverMiddleware, rideFlowController.verifyOTPAndStart);
router.post('/verify-otp', authMiddleware, driverMiddleware, rideFlowController.verifyOTPAndStartByBody);

// End ride
router.put('/:bookingId/end', authMiddleware, driverMiddleware, rideFlowController.endRide);

// ===== INSURANCE ROUTES =====

// Customer: Add passenger insurance
router.post('/:bookingId/add-insurance', authMiddleware, customerMiddleware, rideFlowController.addInsurance);

// Driver: Add driver insurance
router.post('/:bookingId/add-driver-insurance', authMiddleware, driverMiddleware, rideFlowController.addDriverInsurance);

// Smart suggestion (works for both customer & driver)
router.get('/:bookingId/suggest-insurance', authMiddleware, rideFlowController.shouldSuggestInsurance);

module.exports = router;
