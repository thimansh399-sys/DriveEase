const express = require('express');
const driverController = require('../controllers/driverController');

const router = express.Router();

// Public endpoints - no authentication required
// These are accessible to guests without login

// Get all public drivers for guest browsing
router.get('/available', async (req, res) => {
  try {
    // Query drivers that are approved and have permission to be publicly listed
    const Driver = require('../models/Driver');
    const drivers = await Driver.find({
      status: 'approved',
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

module.exports = router;
