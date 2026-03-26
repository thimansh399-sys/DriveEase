const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const driverController = require('../controllers/driverController');
const { authMiddleware, driverMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

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

module.exports = router;
