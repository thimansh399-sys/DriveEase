const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateOTP, verifyOTP } = require('../utils/helpers');
const jwt = require('jsonwebtoken');

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
      process.env.JWT_SECRET,
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
      process.env.JWT_SECRET,
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
    const user = await User.findById(userId).populate('subscriptionPlan');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, profilePicture } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, profilePicture, updatedAt: new Date() },
      { new: true }
    );

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
