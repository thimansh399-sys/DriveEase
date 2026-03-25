const express = require('express');

const driverController = require('../controllers/driverController');
const { authMiddleware, driverMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/all', driverController.getAllDrivers);
router.get('/nearby', driverController.getNearbyDrivers);
router.get('/:id', driverController.getDriverById);
router.post(
	'/register',
	upload.fields([
		{ name: 'aadharFile', maxCount: 1 },
		{ name: 'licenseFile', maxCount: 1 },
		{ name: 'selfieFile', maxCount: 1 }
	]),
	driverController.registerDriver
);
router.put('/documents', authMiddleware, driverMiddleware, driverController.updateDriverDocuments);
router.put('/status', authMiddleware, driverMiddleware, driverController.updateDriverStatus);
router.get('/earnings/:id', authMiddleware, driverMiddleware, driverController.getDriverEarnings);
router.get('/online-hours/:id', authMiddleware, driverMiddleware, driverController.getOnlineHours);

module.exports = router;
