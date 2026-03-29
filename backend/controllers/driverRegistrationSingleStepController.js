const path = require('path');
const fs = require('fs');
const Driver = require('../models/Driver');

exports.registerDriverSingleStep = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      bloodGroup,
      yearsOfExperience,
      aadhaarNumber,
      licenseNumber,
      state,
      city,
      area,
      pincode
    } = req.body;

    // Validate required fields
    if (!name || !phone || !aadhaarNumber || !licenseNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Selfie photo is required for verification' });
    }

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver with this phone number already registered' });
    }

    // Save driver with selfie
    const driver = new Driver({
      name,
      phone,
      email,
      bloodGroup,
      experience: { yearsOfExperience: parseInt(yearsOfExperience) || 0 },
      aadhaarNumber,
      licenseNumber,
      personalDetails: {
        state: state || 'Uttar Pradesh',
        city: city || 'Kanpur',
        address: area || 'Swaroop Nagar',
        pincode: pincode || '208001'
      },
      currentLocation: {
        state: state || 'Uttar Pradesh',
        city: city || 'Kanpur',
        pincode: pincode || '208001'
      },
      serviceAreas: [city || 'Kanpur', area || 'Swaroop Nagar', state || 'Uttar Pradesh'].filter(Boolean),
      documents: {
        selfie: {
          file: 'uploads/driver-documents/selfie/' + req.file.filename,
          verified: false
        }
      },
      status: 'pending'
    });

    await driver.save();
    res.json({
      success: true,
      message: 'Driver registered successfully. Awaiting admin verification.',
      registrationId: String(driver._id),
      waitingTimeMinutes: 30
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
