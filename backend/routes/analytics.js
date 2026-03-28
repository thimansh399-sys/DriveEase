const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Admin: Dashboard summary stats
router.get('/dashboard/summary', authMiddleware, analyticsController.getDashboardStats);

// Admin: Rides trend over time
router.get('/trends/rides', authMiddleware, analyticsController.getRidesTrend);

// Admin: Top performing drivers
router.get('/drivers/top', authMiddleware, analyticsController.getTopDrivers);

// Admin: Bookings by ride type
router.get('/bookings/by-type', authMiddleware, analyticsController.getBookingsByType);

// Admin: Peak hours analysis
router.get('/hours/peak', authMiddleware, analyticsController.getPeakHours);

// Admin: Payment method breakdown
router.get('/payments/breakdown', authMiddleware, analyticsController.getPaymentMethods);

// Admin: Driver rating distribution
router.get('/drivers/ratings', authMiddleware, analyticsController.getDriverRatings);

module.exports = router;
