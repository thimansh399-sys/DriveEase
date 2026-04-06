const express = require('express');
const driverController = require('../controllers/driverController');

const router = express.Router();

// Public endpoints - no authentication required
// These are accessible to guests without login

// Get all public drivers for guest browsing
router.get('/available', async (req, res) => {
  try {
    // Query drivers that are approved, public, and online
    const Driver = require('../models/Driver');
    const drivers = await Driver.find({
      status: 'approved',
      isOnline: true,
      $or: [{ isPublic: true }, { isPublic: { $exists: false } }]
    })
      .select('-password -pancard -documentVerification -activeSession -paymentVerification')
      .limit(100)
      .sort({ rating: -1 });
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching public drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Get specific driver public profile
router.get('/:id/profile', async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    const driver = await Driver.findById(req.params.id)
      .select('-password -pancard -documentVerification -activeSession -paymentVerification');
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Search/filter drivers
router.get('/search', async (req, res) => {
  try {
    const { city, minRating, onlineOnly } = req.query;
    const Driver = require('../models/Driver');
    
    let query = { status: 'approved' };
    
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    if (onlineOnly === 'true') {
      query['onlineStatus.isCurrentlyOnline'] = true;
    }
    
    const drivers = await Driver.find(query)
      .select('-password -pancard -documentVerification -activeSession -paymentVerification')
      .limit(50)
      .sort({ rating: -1 });
    
    res.json(drivers);
  } catch (error) {
    console.error('Error searching drivers:', error);
    res.status(500).json({ error: 'Failed to search drivers' });
  }
});

// Get ALL registered (approved) drivers - public directory for all users
router.get('/drivers-directory', async (req, res) => {
  try {
    const Driver = require('../models/Driver');
    const { search, area, onlineStatus } = req.query;

    // Include approved, online, and offline drivers — exclude only pending/rejected/blocked
    const query = { status: { $nin: ['pending', 'rejected', 'blocked'] } };

    if (onlineStatus === 'online') query.isOnline = true;
    if (onlineStatus === 'offline') query.isOnline = false;

    if (area) {
      query.$or = [
        { 'currentLocation.city': new RegExp(area, 'i') },
        { 'currentLocation.state': new RegExp(area, 'i') },
        { 'personalDetails.city': new RegExp(area, 'i') },
        { serviceAreas: new RegExp(area, 'i') },
      ];
    }

    let drivers = await Driver.find(query)
      .select('name phone isOnline rating experience personalDetails currentLocation serviceAreas vehicle profilePicture status')
      .sort({ isOnline: -1, 'rating.averageRating': -1 })
      .lean();

    if (search) {
      const regex = new RegExp(search, 'i');
      drivers = drivers.filter(
        (d) =>
          regex.test(d.name) ||
          regex.test(d.personalDetails?.city) ||
          regex.test(d.personalDetails?.state) ||
          regex.test(d.currentLocation?.city) ||
          (Array.isArray(d.serviceAreas) && d.serviceAreas.some((a) => regex.test(a)))
      );
    }

    const sanitized = drivers.map((d) => {
      const rawPhone = d.phone || '';
      const maskedPhone =
        rawPhone.length >= 5
          ? rawPhone.slice(0, 3) + '****' + rawPhone.slice(-2)
          : '***masked***';

      const area =
        d.currentLocation?.city ||
        d.personalDetails?.city ||
        (Array.isArray(d.serviceAreas) && d.serviceAreas[0]) ||
        'N/A';

      return {
        _id: d._id,
        name: d.name,
        phone: maskedPhone,
        area,
        state: d.currentLocation?.state || d.personalDetails?.state || '',
        isOnline: d.isOnline || false,
        rating: d.rating?.averageRating || 0,
        totalRatings: d.rating?.totalRatings || 0,
        totalRides: d.experience?.totalRides || 0,
        vehicle: d.vehicle?.model || '',
        profilePicture: d.profilePicture || null,
        serviceAreas: Array.isArray(d.serviceAreas) ? d.serviceAreas : [],
      };
    });

    res.json({ total: sanitized.length, drivers: sanitized });
  } catch (error) {
    console.error('Error fetching drivers directory:', error);
    res.status(500).json({ error: 'Failed to fetch driver directory' });
  }
});

module.exports = router;
