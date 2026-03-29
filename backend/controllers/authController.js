const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateOTP, verifyOTP } = require('../utils/helpers');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'driveease-dev-secret';

exports.sendOTP = async (req, res) => {
  try {
    const { phone, role } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const otp = generateOTP(phone);
    
    // In production, send via SMS
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ 
      message: 'OTP sent successfully',
      otp: otp // Remove in production
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyOTPAndLogin = async (req, res) => {
  try {
    const { phone, otp, name, role = 'customer' } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    if (!verifyOTP(phone, otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    let user = null;
    
    if (role === 'driver') {
      user = await Driver.findOne({ phone });
      if (!user) {
        user = new Driver({
          phone,
          name: name || 'Driver',
          status: 'pending'
        });
      }
    } else {
      user = await User.findOne({ phone });
      if (!user) {
        user = new User({
          phone,
          name: name || 'Customer',
          role: 'customer'
        });
      }
    }

    await user.save();

    const token = jwt.sign(
      { 
        id: user._id, 
        phone: user.phone,
        role: role === 'driver' ? 'driver' : 'customer',
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: role === 'driver' ? 'driver' : 'customer'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    const token = jwt.sign(
      { 
        id: 'admin',
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (role === 'driver') {
      const driver = await Driver.findById(userId);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      return res.json({
        id: driver._id,
        role: 'driver',
        name: driver.name,
        phone: driver.phone,
        email: driver.email || '',
        profilePicture: driver.profilePicture || null,
        location: {
          address: driver.personalDetails?.address || '',
          city: driver.personalDetails?.city || driver.currentLocation?.city || '',
          state: driver.personalDetails?.state || driver.currentLocation?.state || '',
          pincode: driver.personalDetails?.pincode || driver.currentLocation?.pincode || ''
        },
        personalDetails: driver.personalDetails || {}
      });
    }

    const user = await User.findById(userId).populate('subscriptionPlan');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user.toObject(),
      location: user.savedAddresses?.[0]
        ? {
            address: user.savedAddresses[0].address || '',
            city: user.savedAddresses[0].city || '',
            state: user.savedAddresses[0].state || '',
            pincode: user.savedAddresses[0].pincode || ''
          }
        : { address: '', city: '', state: '', pincode: '' }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = String(req.user?.role || '').toLowerCase();
    const { name, email, profilePicture, address, city, state, pincode } = req.body;

    if (role === 'driver') {
      const updateData = { updatedAt: new Date() };
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (profilePicture) updateData.profilePicture = profilePicture;
      if (address) updateData['personalDetails.address'] = address;
      if (city) {
        updateData['personalDetails.city'] = city;
        updateData['currentLocation.city'] = city;
      }
      if (state) {
        updateData['personalDetails.state'] = state;
        updateData['currentLocation.state'] = state;
      }
      if (pincode) {
        const normalizedPin = String(pincode);
        updateData['personalDetails.pincode'] = normalizedPin;
        updateData['currentLocation.pincode'] = normalizedPin;
      }

      const driver = await Driver.findByIdAndUpdate(userId, updateData, { new: true });
      return res.json({ message: 'Profile updated', user: driver });
    }

    const updateData = {
      updatedAt: new Date()
    };
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const normalizedPin = pincode ? String(pincode) : '';
    if (address || city || state || normalizedPin) {
      updateData.savedAddresses = [{
        label: 'Home',
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: normalizedPin || ''
      }];
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
