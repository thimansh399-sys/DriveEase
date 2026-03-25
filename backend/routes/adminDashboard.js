const express = require('express');
const adminDashboardController = require('../controllers/adminDashboardController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Protect all admin routes
router.use(authMiddleware, adminMiddleware);

// Dashboard statistics
router.get('/stats', adminDashboardController.getDashboardStats);

// Registration management (Payment verification)
router.get('/registrations/pending', adminDashboardController.getPendingRegistrations);
router.post('/drivers/:id/payment/approve', adminDashboardController.approveDriverPayment);
router.post('/drivers/:id/payment/reject', adminDashboardController.rejectDriverPayment);
router.post('/registrations/bulk-approve', adminDashboardController.bulkApproveRegistrations);

// Booking management
router.get('/bookings/live', adminDashboardController.getLiveBookings);
router.get('/bookings/:id/details', adminDashboardController.getBookingDetails);

// Driver tracking
router.get('/drivers/live-status', adminDashboardController.getDriversLiveStatus);

// Revenue analytics
router.get('/revenue/analytics', adminDashboardController.getRevenueAnalytics);

module.exports = router;
