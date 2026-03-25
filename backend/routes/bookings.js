const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authMiddleware, customerMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

router.post('/create', authMiddleware, customerMiddleware, (req, res, next) => {
  console.log('Middleware passed for /create route');
  next();
}, bookingController.createBooking);

router.get('/customer', authMiddleware, customerMiddleware, (req, res, next) => {
  console.log('Middleware passed for /customer route');
  next();
}, bookingController.getCustomerBookings);

router.get('/:id', authMiddleware, (req, res, next) => {
  console.log('Middleware passed for /:id route');
  next();
}, bookingController.getBookingById);

router.put('/:id/status', authMiddleware, (req, res, next) => {
  console.log('Middleware passed for /:id/status route');
  next();
}, bookingController.updateBookingStatus);

router.put('/:id/confirm', authMiddleware, (req, res, next) => {
  console.log('Middleware passed for /:id/confirm route');
  next();
}, bookingController.confirmBooking);

router.put('/:id/cancel', authMiddleware, (req, res, next) => {
  console.log('Middleware passed for /:id/cancel route');
  next();
}, bookingController.cancelBooking);

router.post('/:id/feedback', authMiddleware, (req, res, next) => {
  console.log('Middleware passed for /:id/feedback route');
  next();
}, bookingController.addFeedback);

router.post('/:id/sos', authMiddleware, (req, res, next) => {
  console.log('Middleware passed for /:id/sos route');
  next();
}, bookingController.triggerSOS);

router.post('/address/save', authMiddleware, (req, res, next) => {
  console.log('Middleware passed for /address/save route');
  next();
}, bookingController.saveAddress);

router.get('/address/saved', authMiddleware, (req, res, next) => {
  console.log('Middleware passed for /address/saved route');
  next();
}, bookingController.getSavedAddresses);

module.exports = router;
