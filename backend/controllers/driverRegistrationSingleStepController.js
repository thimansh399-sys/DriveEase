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

    console.log('📝 Driver Registration Request:', {
      name,
      phone,
      email,
      aadhaarNumber,
      licenseNumber,
      city,
      state,
      hasFile: !!req.file
    });

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
        console.warn('⚠️ Driver already exists:', phone);
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

    console.log('💾 Saving driver to MongoDB...');
    const savedDriver = await driver.save();
    console.log('✅ Driver saved successfully:', savedDriver._id);
    res.json({
      success: true,
      message: 'Driver registered successfully. Awaiting admin verification.',
      registrationId: String(savedDriver._id),
      waitingTimeMinutes: 30,
      driverId: savedDriver._id
    });
  } catch (error) {
    console.error('❌ Driver registration error:', error);
    console.error('Error Stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Error registering driver',
      details: error.toString()
    });
  }
};
