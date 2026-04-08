const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateOTP, verifyOTP } = require('../utils/helpers');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'driveease-dev-secret';

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(-10);

const buildPhoneLookupQuery = (rawValue) => {
  const normalized = normalizePhone(rawValue);
  const escaped = String(normalized).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return {
    normalized,
    query: {
      $or: [
        { phone: normalized },
        { phone: String(rawValue || '').trim() },
        { phone: { $regex: `${escaped}$` } }
      ]
    }
  };
};

const normalizeRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'driver') return 'driver';
  return 'customer';
};

async function findOrCreateUserByRole({ phone, name, role }) {
  const { normalized, query } = buildPhoneLookupQuery(phone);

  if (role === 'driver') {
    let driver = await Driver.findOne(query);
    if (!driver) {
      driver = new Driver({
        phone: normalized,
        name: name || 'Driver',
        status: 'pending'
      });
      await driver.save();
    } else if (driver.phone !== normalized) {
      driver.phone = normalized;
      await driver.save();
    }

    return {
      entity: driver,
      role: 'driver'
    };
  }

  let customer = await User.findOne(query);
  if (!customer) {
    customer = new User({
      phone: normalized,
      name: name || 'Customer',
      role: 'customer'
    });
  } else if (customer.phone !== normalized) {
    customer.phone = normalized;
  } else if (name && String(name).trim()) {
    customer.name = String(name).trim();
  }

  await customer.save();

  return {
    entity: customer,
    role: 'customer'
  };
}

async function findUserByRole({ phone, role }) {
  const { normalized, query } = buildPhoneLookupQuery(phone);

  if (role === 'driver') {
    const driver = await Driver.findOne(query);
    if (driver && driver.phone !== normalized) {
      driver.phone = normalized;
      await driver.save();
    }
    return {
      entity: driver,
      role: 'driver'
    };
  }

  const customer = await User.findOne(query);
  if (customer && customer.phone !== normalized) {
    customer.phone = normalized;
    await customer.save();
  }
  return {
    entity: customer,
    role: 'customer'
  };
}

exports.registerCustomer = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' });
    }

    const phone = normalizePhone(req.body?.phone);
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();

    if (phone.length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { query } = buildPhoneLookupQuery(phone);
    const existing = await User.findOne(query);
    if (existing) {
      return res.status(400).json({ error: 'Customer already registered. Please login.' });
    }

    const customer = new User({
      phone,
      name,
      email: email || undefined,
      role: 'customer'
    });

    await customer.save();

    return res.status(201).json({
      message: 'Customer registered successfully. Please login to continue.'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.directLogin = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' });
    }

    const phone = normalizePhone(req.body?.phone);
    const name = String(req.body?.name || '').trim();
    const role = normalizeRole(req.body?.role);

    if (phone.length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { entity, role: finalRole } = await findUserByRole({ phone, role });
    if (!entity) {
      const missingMessage = finalRole === 'driver'
        ? 'Driver account not found. Please register as driver first.'
        : 'Customer account not found. Please register first.';
      return res.status(404).json({ error: missingMessage });
    }

    if (name && String(name).trim() && finalRole === 'customer' && entity.name !== String(name).trim()) {
      entity.name = String(name).trim();
      await entity.save();
    }

    const token = jwt.sign(
      {
        id: entity._id,
        phone: entity.phone,
        role: finalRole,
        name: entity.name
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: entity._id,
        name: entity.name,
        phone: entity.phone,
        role: finalRole
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

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
    const { otp, name, role = 'customer' } = req.body;
    const phone = normalizePhone(req.body?.phone);

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
        return res.status(404).json({ error: 'Driver account not found. Please register as driver first.' });
      }
    } else {
      user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({ error: 'Customer account not found. Please register first.' });
      }

      if (name && String(name).trim() && user.name !== String(name).trim()) {
        user.name = String(name).trim();
        await user.save();
      }
    }

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
    const password = String(req.body?.password || '').trim();
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim();

    if (!configuredPassword) {
      return res.status(500).json({ error: 'Admin login is not configured on server' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Admin password is required' });
    }

    if (password !== configuredPassword) {
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
