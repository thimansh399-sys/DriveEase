const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth and admin middleware
router.use(authMiddleware, adminMiddleware);

router.get('/drivers/registrations', adminController.getAllDriverRegistrations);
router.put('/drivers/:id/approve', adminController.approveDriver);
router.put('/drivers/:id/reject', adminController.rejectDriver);
router.put('/drivers/:id/remove', adminController.removeDriver);
router.get('/drivers/:id/details', adminController.getDriverDetails);

router.get('/bookings', adminController.getAllBookings);
router.get('/customers', adminController.getAllCustomers);
router.get('/enquiries', adminController.getEnquiries);
router.put('/enquiries/:id/respond', adminController.sendEnquiryResponse);

router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/export/bookings', adminController.exportBookingsToExcel);

module.exports = router;
