const Driver = require('../models/Driver');
const { calculateDistance } = require('../utils/helpers');

exports.getAllDrivers = async (req, res) => {
  try {
    const { city, state, pincode, area, status, isOnline } = req.query;
    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (city) {
      filter.$or = filter.$or || [];
      filter.$or.push({ 'currentLocation.city': city }, { 'personalDetails.city': city });
    }
    if (state) {
      const stateOr = [{ 'currentLocation.state': state }, { 'personalDetails.state': state }];
      if (filter.$or) {
        // combine with AND
        filter.$and = [{ $or: filter.$or }, { $or: stateOr }];
        delete filter.$or;
      } else {
        filter.$or = stateOr;
      }
    }
    if (pincode) {
      const pincodeOr = [{ 'currentLocation.pincode': pincode }, { 'personalDetails.pincode': pincode }];
      if (filter.$and) {
        filter.$and.push({ $or: pincodeOr });
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: pincodeOr }];
        delete filter.$or;
      } else {
        filter.$or = pincodeOr;
      }
    }
    if (area) {
      const areaRegex = { $regex: area, $options: 'i' };
      const areaCondition = {
        $or: [
          { serviceAreas: areaRegex },
          { 'personalDetails.address': areaRegex }
        ]
      };

      if (filter.$and) {
        filter.$and.push(areaCondition);
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, areaCondition];
        delete filter.$or;
      } else {
        filter.$and = [areaCondition];
      }
    }
    if (isOnline !== undefined) filter.isOnline = isOnline === 'true';

    const drivers = await Driver.find(filter).select(
      '-documents.aadhar.file -documents.pancard.file -documents.drivingLicense.file'
    );

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNearbyDrivers = async (req, res) => {
  try {
    const { latitude, longitude, city, state, area, pincode, radius = 25 } = req.query;
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const hasCoords = Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude);

    if (!hasCoords && !city && !state && !area) {
      return res.json([]);
    }

    const filter = {
      status: 'approved',
      isOnline: true
    };

    if (city) {
      filter.$or = [
        { 'currentLocation.city': city },
        { 'personalDetails.city': city },
        { serviceAreas: { $regex: city, $options: 'i' } }
      ];
    }

    if (state) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { 'currentLocation.state': state },
          { 'personalDetails.state': state },
          { serviceAreas: { $regex: state, $options: 'i' } }
        ]
      });
    }

    if (area) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { serviceAreas: { $regex: area, $options: 'i' } },
          { 'personalDetails.address': { $regex: area, $options: 'i' } }
        ]
      });
    }

    if (pincode) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { 'currentLocation.pincode': String(pincode) },
          { 'personalDetails.pincode': String(pincode) }
        ]
      });
    }

    const drivers = await Driver.find(filter).select(
      '-documents.aadhar.file -documents.pancard.file -documents.drivingLicense.file'
    );

    if (!hasCoords) {
      return res.json(drivers);
    }

    const maxRadius = Number(radius) > 0 ? Number(radius) : 25;
    const withDistance = drivers.map((driver) => {
      const driverLat = Number(driver.currentLocation?.latitude);
      const driverLng = Number(driver.currentLocation?.longitude);
      const distance = Number.isFinite(driverLat) && Number.isFinite(driverLng)
        ? calculateDistance(parsedLatitude, parsedLongitude, driverLat, driverLng)
        : null;

      return {
        ...driver.toObject(),
        distance,
      };
    });

    const nearbyDrivers = withDistance
      .filter((driver) => Number.isFinite(Number(driver.distance)) && Number(driver.distance) <= maxRadius)
      .sort((a, b) => Number(a.distance) - Number(b.distance));

    const fallbackDrivers = nearbyDrivers.length
      ? nearbyDrivers
      : withDistance
        .filter((driver) => Number.isFinite(Number(driver.distance)))
        .sort((a, b) => Number(a.distance) - Number(b.distance));

    res.json(fallbackDrivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).select(
      '-documents.aadhar.file -documents.pancard.file -documents.drivingLicense.file'
    );

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const driverId = req.user?.driverId || req.user?.id;
    if (!driverId) {
      return res.status(401).json({ error: 'Driver ID not found in token' });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registerDriver = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      bloodGroup,
      yearsOfExperience,
      aadhaarNumber,
      licenseNumber,
      city,
      state,
      pincode,
      address,
      area
    } = req.body;
    console.log('📝 [driverController] Driver Registration Request:', {
      name,
      phone,
      email,
      aadhaarNumber,
      licenseNumber,
      city,
      state
    });


    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver already registered' });
    }

    const driver = new Driver({
      name,
      phone,
      email,
      experience: { yearsOfExperience: parseInt(yearsOfExperience) || 0 },
      aadhaarNumber,
      licenseNumber,
      personalDetails: {
        address: address || area || 'Swaroop Nagar',
        city: city || 'Kanpur',
        state: state || 'Uttar Pradesh',
        pincode: pincode || '208001',
        bloodGroup
      },
      currentLocation: {
        city: city || 'Kanpur',
        state: state || 'Uttar Pradesh',
        pincode: pincode || '208001'
      },
      serviceAreas: [city || 'Kanpur', area || address || 'Swaroop Nagar', state || 'Uttar Pradesh'].filter(Boolean),
      status: 'pending',
      registrationFee: {
        amount: 150,
        paid: false
      }
    });

    console.log('💾 [driverController] Saving driver to MongoDB...');
    const savedDriver = await driver.save();
    console.log('✅ [driverController] Driver saved successfully:', savedDriver._id);

    res.status(201).json({
      message: 'Driver registration complete',
      driverId: savedDriver._id,
      registrationId: String(savedDriver._id),
      waitingTimeMinutes: 30
    });
  } catch (error) {
    console.error('❌ [driverController] Driver registration error:', error);
    console.error('Error Stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Error registering driver',
      details: error.toString()
    });
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

    const updateData = {
      isOnline,
      availabilityStatus: isOnline ? 'AVAILABLE' : 'BUSY',
      'currentLocation.lastUpdated': new Date(),
      updatedAt: new Date()
    };

    if (latitude) updateData['currentLocation.latitude'] = latitude;
    if (longitude) updateData['currentLocation.longitude'] = longitude;
    if (city) updateData['currentLocation.city'] = city;
    if (state) updateData['currentLocation.state'] = state;
    if (pincode) updateData['currentLocation.pincode'] = pincode;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      updateData,
      { new: true }
    );

    res.json({ message: `You are now ${isOnline ? 'Online' : 'Offline'}`, driver });
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

exports.updateProfilePicture = async (req, res) => {
  try {
    const driverId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const profilePicturePath = 'uploads/profile-pictures/' + req.file.filename;
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { profilePicture: profilePicturePath },
      { new: true }
    );

    res.json({ message: 'Profile picture updated', profilePicture: profilePicturePath, driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { name, email, bloodGroup, city, state, pincode, address } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bloodGroup) updateData['personalDetails.bloodGroup'] = bloodGroup;
    if (city) {
      updateData['personalDetails.city'] = city;
      updateData['currentLocation.city'] = city;
    }
    if (state) {
      updateData['personalDetails.state'] = state;
      updateData['currentLocation.state'] = state;
    }
    if (pincode) {
      updateData['personalDetails.pincode'] = String(pincode);
      updateData['currentLocation.pincode'] = String(pincode);
    }
    if (address) updateData['personalDetails.address'] = address;
    updateData.updatedAt = new Date();

    const driver = await Driver.findByIdAndUpdate(driverId, updateData, { new: true });
    res.json({ message: 'Profile updated', driver });
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
