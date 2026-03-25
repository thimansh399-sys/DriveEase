const path = require('path');

// Helper: Validate document number formats
function validateAadharNumber(aadhar) {
  return /^[2-9]{1}[0-9]{11}$/.test(aadhar);
}
function validatePANNumber(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}
function validateDLNumber(dl) {
  return /^[A-Z]{2}[0-9]{2}[0-9A-Z]{11,15}$/.test(dl);
}

// Upload Aadhar
exports.uploadAadhar = async (req, res) => {
  try {
    const { id } = req.params;
    const { aadharNumber } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Aadhar image required' });
    if (!aadharNumber || !validateAadharNumber(aadharNumber)) {
      return res.status(400).json({ error: 'Invalid Aadhar number' });
    }
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    driver.documents.aadhar = {
      number: aadharNumber,
      file: path.join('uploads/driver-documents/aadhar/', req.file.filename),
      verified: false
    };
    await driver.save();
    res.json({ success: true, message: 'Aadhar uploaded. Awaiting admin verification.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload PAN
exports.uploadPAN = async (req, res) => {
  try {
    const { id } = req.params;
    const { panNumber } = req.body;
    if (!req.file) return res.status(400).json({ error: 'PAN image required' });
    if (!panNumber || !validatePANNumber(panNumber)) {
      return res.status(400).json({ error: 'Invalid PAN number' });
    }
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    driver.documents.pan = {
      number: panNumber,
      file: path.join('uploads/driver-documents/pan/', req.file.filename),
      verified: false
    };
    await driver.save();
    res.json({ success: true, message: 'PAN uploaded. Awaiting admin verification.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload License
exports.uploadLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const { licenseNumber, expiryDate } = req.body;
    if (!req.file) return res.status(400).json({ error: 'License image required' });
    if (!licenseNumber || !validateDLNumber(licenseNumber)) {
      return res.status(400).json({ error: 'Invalid License number' });
    }
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    driver.documents.drivingLicense = {
      number: licenseNumber,
      file: path.join('uploads/driver-documents/license/', req.file.filename),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      verified: false
    };
    await driver.save();
    res.json({ success: true, message: 'License uploaded. Awaiting admin verification.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload Selfie
exports.uploadSelfie = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Selfie image required' });
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    driver.documents.selfie = {
      file: path.join('uploads/driver-documents/selfie/', req.file.filename),
      verified: false
    };
    await driver.save();
    res.json({ success: true, message: 'Selfie uploaded. Awaiting admin verification.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const Driver = require('../models/Driver');
const { generatePaymentVerificationToken, formatPaymentVerificationStatus } = require('../utils/verificationUtils');
const { getCurrentISTDateTime } = require('../utils/dateTimeUtils');

/**
 * Register new driver - Step 1: Basic details and payment
 */
exports.registerDriver = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      city,
      state,
      pincode,
      bloodGroup,
      yearsOfExperience,
      vehicle: {
        model,
        registrationNumber,
        color,
        seatCapacity,
        insuranceExpiry
      }
    } = req.body;

    // Validate required fields
    if (!name || !phone || !city || !state || !pincode) {
      return res.status(400).json({
        error: 'Missing required fields: name, phone, city, state, pincode'
      });
    }

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({
        error: 'Driver with this phone number already registered'
      });
    }

    // Create new driver with pending status
    const driver = new Driver({
      name,
      phone,
      email,
      personalDetails: {
        city,
        state,
        pincode,
        bloodGroup
      },
      experience: {
        yearsOfExperience: parseInt(yearsOfExperience) || 0
      },
      vehicle: {
        model,
        registrationNumber,
        color,
        seatCapacity: parseInt(seatCapacity) || 0,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null
      },
      status: 'pending',
      paymentVerification: {
        status: 'pending'
      }
    });

    const savedDriver = await driver.save();

    res.status(201).json({
      success: true,
      message: 'Driver registration initiated. Please proceed with payment verification.',
      driverId: savedDriver._id,
      registrationFee: 150,
      nextStep: 'payment_verification'
    });

  } catch (error) {
    console.error('Driver registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload payment screenshot for verification
 */
exports.uploadPaymentScreenshot = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { screenshotUrl, paymentId } = req.body;

    if (!driverId || !screenshotUrl) {
      return res.status(400).json({
        error: 'Driver ID and screenshot URL required'
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Update payment verification details
    driver.paymentVerification = {
      registrationFeeAmount: 150,
      screenshotUrl,
      screenshotSubmissionTime: new Date(),
      status: 'pending',
      adminNotes: 'Awaiting admin verification'
    };

    if (paymentId) {
      driver.paymentVerification.status = 'pending';
    }

    const updatedDriver = await driver.save();

    // Generate verification token for tracking
    const { token, expiresAt } = generatePaymentVerificationToken(driverId);

    res.json({
      success: true,
      message: 'Payment screenshot submitted successfully. Verification will be completed within 30 minutes.',
      driverId: driverId,
      verificationToken: token,
      estimatedWaitTime: '30 minutes',
      currentStatus: formatPaymentVerificationStatus(updatedDriver.paymentVerification.status),
      screenshotSubmittedAt: getCurrentISTDateTime(new Date())
    });

  } catch (error) {
    console.error('Payment screenshot upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Check payment verification status
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId).select('paymentVerification status');
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const verificationStatus = formatPaymentVerificationStatus(
      driver.paymentVerification.status
    );

    // Calculate wait time if pending
    let waitTimeRemaining = null;
    if (driver.paymentVerification.status === 'pending') {
      const submittedTime = new Date(driver.paymentVerification.screenshotSubmissionTime);
      const verificationDeadline = new Date(submittedTime.getTime() + 30 * 60 * 1000); // 30 minutes
      waitTimeRemaining = Math.max(0, Math.ceil((verificationDeadline - new Date()) / 1000 / 60));
    }

    res.json({
      driverId,
      verificationStatus,
      submittedAt: driver.paymentVerification.screenshotSubmissionTime
        ? getCurrentISTDateTime(driver.paymentVerification.screenshotSubmissionTime)
        : null,
      verifiedAt: driver.paymentVerification.verificationTime
        ? getCurrentISTDateTime(driver.paymentVerification.verificationTime)
        : null,
      waitTimeRemaining, // in minutes
      adminNotes: driver.paymentVerification.adminNotes
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get driver registration progress
 */
exports.getRegistrationProgress = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId).select(
      'name phone status paymentVerification documents backgroundVerification'
    );

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const progress = {
      driverId: driver._id,
      name: driver.name,
      phone: driver.phone,
      steps: {
        basicInfo: {
          completed: !!driver.name && !!driver.phone,
          status: 'completed'
        },
        paymentVerification: {
          completed: driver.paymentVerification.status === 'verified',
          status: driver.paymentVerification.status,
          submittedAt: driver.paymentVerification.screenshotSubmissionTime
            ? getCurrentISTDateTime(driver.paymentVerification.screenshotSubmissionTime)
            : null,
          waitTime: driver.paymentVerification.status === 'pending' ? '~30 minutes' : null
        },
        documentVerification: {
          completed: driver.backgroundVerification.status === 'verified',
          status: driver.backgroundVerification.status
        },
        approval: {
          completed: driver.status === 'approved',
          status: driver.status
        }
      },
      overallProgress: calculateOverallProgress(driver)
    };

    res.json(progress);

  } catch (error) {
    console.error('Get registration progress error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper function to calculate overall progress percentage
 */
function calculateOverallProgress(driver) {
  let completed = 0;
  let total = 4;

  if (driver.name && driver.phone) completed++;
  if (driver.paymentVerification.status === 'verified') completed++;
  if (driver.backgroundVerification.status === 'verified') completed++;
  if (driver.status === 'approved') completed++;

  return Math.round((completed / total) * 100);
}

/**
 * Track device login for single device policy
 */
exports.trackDeviceLogin = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { deviceId, ipAddress, deviceInfo, userAgent } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Store active session
    driver.activeSession = {
      deviceId,
      loginTime: new Date(),
      lastActivityTime: new Date(),
      ipAddress,
      deviceInfo
    };

    await driver.save();

    res.json({
      success: true,
      message: 'Device login tracked. Only this device can be used for this account.',
      sessionId: driver._id,
      loginTime: getCurrentISTDateTime(new Date())
    });

  } catch (error) {
    console.error('Device login tracking error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update last activity time (keep-alive for session)
 */
exports.updateLastActivity = async (req, res) => {
  try {
    const { driverId } = req.params;

    await Driver.findByIdAndUpdate(
      driverId,
      { 'activeSession.lastActivityTime': new Date() },
      { new: true }
    );

    res.json({ success: true, message: 'Activity updated' });

  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update driver online status and track hours
 */
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { isOnline, currentLocation } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // If going online
    if (isOnline && !driver.onlineStatus.isCurrentlyOnline) {
      driver.onlineStatus.isCurrentlyOnline = true;
      driver.onlineStatus.onlineStartTime = new Date();
    }

    // If going offline
    if (!isOnline && driver.onlineStatus.isCurrentlyOnline) {
      const startTime = new Date(driver.onlineStatus.onlineStartTime);
      const endTime = new Date();
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
      
      driver.onlineStatus.isCurrentlyOnline = false;
      driver.onlineStatus.totalOnlineHoursThisMonth += durationMinutes / 60;
      driver.onlineStatus.totalOnlineHoursAllTime += durationMinutes / 60;
      driver.onlineStatus.lastUpdated = endTime;
    }

    // Update location if provided
    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
      driver.currentLocation = {
        ...currentLocation,
        lastUpdated: new Date()
      };
    }

    driver.isOnline = isOnline;
    const updatedDriver = await driver.save();

    res.json({
      success: true,
      message: `Driver is now ${isOnline ? 'online' : 'offline'}`,
      isOnline: updatedDriver.isOnline,
      currentLocation: updatedDriver.currentLocation,
      totalOnlineHours: updatedDriver.onlineStatus.totalOnlineHoursAllTime.toFixed(2)
    });

  } catch (error) {
    console.error('Update online status error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get driver earnings and commission summary
 */
exports.getEarningsSummary = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId).select(
      'experience commission onlineStatus totalEarnings'
    );

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      driverId,
      totalEarnings: driver.experience.totalEarnings,
      totalCommission: driver.commission.totalCommissionEarned,
      netEarnings: driver.experience.totalEarnings - driver.commission.totalCommissionEarned,
      commissionRate: `${driver.commission.percentageRate}%`,
      onlineHours: driver.onlineStatus.totalOnlineHoursAllTime.toFixed(2),
      totalRides: driver.experience.totalRides
    });

  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
