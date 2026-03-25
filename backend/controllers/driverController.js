const Driver = require('../models/Driver');
const { calculateDistance } = require('../utils/helpers');

exports.getAllDrivers = async (req, res) => {
  try {
    const { city, state, pincode, status = 'approved', isOnline } = req.query;
    let filter = { status };

    if (status !== 'all') {
      filter.status = status;
    }

    if (city) filter['currentLocation.city'] = city;
    if (state) filter['currentLocation.state'] = state;
    if (pincode) filter['currentLocation.pincode'] = pincode;
    if (isOnline !== undefined) filter.isOnline = isOnline === 'true';

    const drivers = await Driver.find(filter).select(
      '-documents.aadhar.file -documents.pancard.file -documents.drivingLicense.file -documents.selfie.file'
    );

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNearbyDrivers = async (req, res) => {
  try {
    const { latitude, longitude, city, radius = 10 } = req.query;

    if (!latitude || !longitude || !city) {
      return res.status(400).json({ error: 'Latitude, longitude, and city required' });
    }

    const drivers = await Driver.find({
      status: 'approved',
      isOnline: true,
      'currentLocation.city': city
    });

    const nearbyDrivers = drivers
      .map(driver => ({
        ...driver.toObject(),
        distance: calculateDistance(
          latitude,
          longitude,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        )
      }))
      .filter(d => parseFloat(d.distance) <= radius)
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    res.json(nearbyDrivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).select(
      '-documents.aadhar.file -documents.pancard.file -documents.drivingLicense.file -documents.selfie.file'
    );

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registerDriver = async (req, res) => {
  try {
    const { phone, name, email } = req.body;

    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver already registered' });
    }

    // Handle file uploads
    const documents = {};
    if (req.files && req.files['aadharFile']) {
      documents.aadhar = {
        file: req.files['aadharFile'][0].path,
        verified: false
      };
    }
    if (req.files && req.files['licenseFile']) {
      documents.drivingLicense = {
        file: req.files['licenseFile'][0].path,
        verified: false
      };
    }
    if (req.files && req.files['selfieFile']) {
      documents.selfie = {
        file: req.files['selfieFile'][0].path,
        verified: false
      };
    }

    const driver = new Driver({
      phone,
      name,
      email,
      status: 'pending',
      registrationFee: {
        amount: 150,
        paid: false
      },
      documents
    });

    await driver.save();

    res.status(201).json({
      message: 'Driver registration complete',
      driverId: driver._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDriverDocuments = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { aadhar, pancard, drivingLicense, personalDetails, vehicle, upiId } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        'documents.aadhar': aadhar,
        'documents.pancard': pancard,
        'documents.drivingLicense': drivingLicense,
        personalDetails,
        vehicle,
        upiId
      },
      { new: true }
    );

    res.json({ message: 'Documents updated', driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDriverStatus = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { isOnline, latitude, longitude, city, state, pincode } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        isOnline,
        status: isOnline ? 'online' : 'offline',
        'currentLocation': {
          latitude,
          longitude,
          city,
          state,
          pincode,
          lastUpdated: new Date()
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ message: 'Status updated', driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDriverEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const driver = await Driver.findById(driverId).select('experience bankDetails upiId');

    res.json({
      totalEarnings: driver.experience.totalEarnings,
      totalRides: driver.experience.totalRides,
      bankDetails: driver.bankDetails,
      upiId: driver.upiId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOnlineHours = async (req, res) => {
  try {
    const driverId = req.user.id;
    const driver = await Driver.findById(driverId).select('onlineHours');

    res.json(driver.onlineHours);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDriverEarnings = async (req, res) => {
  try {
    const { driverId, rideEarnings } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Update total earnings and rides
    driver.experience.totalEarnings += rideEarnings;
    driver.experience.totalRides += 1;

    await driver.save();

    res.json({
      message: 'Earnings updated successfully',
      totalEarnings: driver.experience.totalEarnings,
      totalRides: driver.experience.totalRides
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOnlineStatus = async (req, res) => {
  try {
    const { driverId, isOnline } = req.body;
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (isOnline) {
      driver.onlineStatus.isCurrentlyOnline = true;
      driver.onlineStatus.onlineStartTime = new Date();
    } else {
      const now = new Date();
      const startTime = driver.onlineStatus.onlineStartTime;

      if (startTime) {
        const hoursOnline = (now - startTime) / (1000 * 60 * 60);
        driver.onlineHours.push({
          date: startTime.toISOString().split('T')[0],
          startTime,
          endTime: now,
          totalHours: hoursOnline
        });
        driver.onlineStatus.isCurrentlyOnline = false;
        driver.onlineStatus.onlineStartTime = null;
      }
    }

    await driver.save();
    res.json({ message: 'Online status updated successfully', driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
