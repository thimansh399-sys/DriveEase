const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const driverRegistrationController = require('../controllers/driverRegistrationController');
const driverRegistrationSingleStepController = require('../controllers/driverRegistrationSingleStepController');

const { authMiddleware, driverMiddleware } = require('../middleware/auth');

const router = express.Router();

// Multer config for single-step registration (multiple files)
const singleStepUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = 'aadhar';
      if (file.fieldname === 'licenseFile') folder = 'license';
      if (file.fieldname === 'selfie') folder = 'selfie';
      const dir = path.join(__dirname, '..', 'uploads', 'driver-documents', folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Single-step registration endpoint with selfie upload
router.post('/register-driver',
  singleStepUpload.single('selfie'),
  driverRegistrationSingleStepController.registerDriverSingleStep
);

// Multer configs for different document uploads
const paymentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/payment-screenshots/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const docUpload = (folder) => multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `uploads/driver-documents/${folder}/`);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Registration endpoints
router.post('/register', driverRegistrationController.registerDriver);
router.post('/:id/payment/upload', paymentUpload.single('screenshot'), driverRegistrationController.uploadPaymentScreenshot);

// Separate endpoints for document uploads
router.post('/:id/upload/aadhar', docUpload('aadhar').single('aadhar'), driverRegistrationController.uploadAadhar);
router.post('/:id/upload/pan', docUpload('pan').single('pan'), driverRegistrationController.uploadPAN);
router.post('/:id/upload/license', docUpload('license').single('license'), driverRegistrationController.uploadLicense);
router.post('/:id/upload/selfie', docUpload('selfie').single('selfie'), driverRegistrationController.uploadSelfie);
router.get('/:id/payment/status', driverRegistrationController.checkPaymentStatus);
router.get('/:id/registration-progress', driverRegistrationController.getRegistrationProgress);

// Device & Session management
router.post('/:id/device-login', driverRegistrationController.trackDeviceLogin);
router.put('/:id/activity', driverRegistrationController.updateLastActivity);
router.put('/:id/online-status', authMiddleware, driverMiddleware, driverRegistrationController.updateOnlineStatus);

// Driver earnings & summary
router.get('/:id/earnings', authMiddleware, driverMiddleware, driverRegistrationController.getEarningsSummary);

module.exports = router;
