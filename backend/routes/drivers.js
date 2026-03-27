const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const driverController = require('../controllers/driverController');
const { authMiddleware, driverMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const rideEngine = require('../utils/rideAllocationEngine');

const router = express.Router();

// Profile picture upload config
const profilePicUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', 'profile-pictures');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, 'profile-' + req.user.id + '-' + Date.now() + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/all', driverController.getAllDrivers);
router.get('/nearby', driverController.getNearbyDrivers);
router.post('/register', driverController.registerDriver);
router.put('/documents', authMiddleware, driverMiddleware, driverController.updateDriverDocuments);
router.put('/status', authMiddleware, driverMiddleware, driverController.updateDriverStatus);
router.put('/profile-picture', authMiddleware, driverMiddleware, profilePicUpload.single('profilePicture'), driverController.updateProfilePicture);
router.put('/profile', authMiddleware, driverMiddleware, driverController.updateDriverProfile);
router.get('/earnings/me', authMiddleware, driverMiddleware, driverController.getDriverEarnings);
router.get('/online-hours/me', authMiddleware, driverMiddleware, driverController.getOnlineHours);
router.get('/:id', driverController.getDriverById);

// === Ride Allocation Engine Routes ===

// Find best driver for a ride
router.post('/allocate-ride', authMiddleware, async (req, res) => {
  try {
    const { pickupLat, pickupLon, maxDistance } = req.body;
    if (!pickupLat || !pickupLon) {
      return res.status(400).json({ error: 'Pickup coordinates required' });
    }
    const result = await rideEngine.findBestDriver(pickupLat, pickupLon, maxDistance || 5);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate fare with peak boost
router.post('/calculate-fare', async (req, res) => {
  try {
    const { baseFare, plan } = req.body;
    const result = rideEngine.calculateFareWithBoost(baseFare || 80, plan || 'ZERO');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get driver plan info & suggestions
router.get('/plan-info/:driverId', authMiddleware, async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const plan = driver.plan?.type || 'ZERO';
    const dailyLimit = rideEngine.checkDailyLimit(plan, driver.ridesToday);
    const weeklyBonus = rideEngine.checkWeeklyBonus(plan, driver.ridesThisWeek);
    const upgrade = rideEngine.getUpgradeSuggestion(plan, driver.monthlyEarnings, driver.ridesThisMonth);
    const retention = rideEngine.checkRetentionBonus(driver.lastActiveAt);
    const eliteWarning = rideEngine.checkEliteRatingWarning(plan, driver.rating?.averageRating || 0);
    const commission = rideEngine.calculateCommission(plan, 100, driver.monthlyEarnings);

    res.json({
      plan,
      dailyLimit,
      weeklyBonus,
      upgrade,
      retention,
      eliteWarning,
      commissionRate: commission.rate,
      isPeakHour: rideEngine.isPeakHour(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
