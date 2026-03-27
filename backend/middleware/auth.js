const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

const getLast10Digits = (value) => String(value || '').replace(/\D/g, '').slice(-10);
const JWT_SECRET = process.env.JWT_SECRET || 'driveease-dev-secret';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  const role = String(req.user?.role || '').trim().toLowerCase();
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const driverMiddleware = async (req, res, next) => {
  const role = String(req.user?.role || '').trim().toLowerCase();
  if (role !== 'driver') {
    const rawPhone = String(req.user?.phone || '').trim();
    const last10 = getLast10Digits(rawPhone);

    if (!rawPhone && !last10) {
      return res.status(403).json({ error: 'Driver access required' });
    }

    try {
      const fallbackDriver = await Driver.findOne({
        $or: [
          ...(rawPhone ? [{ phone: rawPhone }] : []),
          ...(last10 ? [{ phone: { $regex: `${last10}$` } }] : []),
        ],
      }).select('_id');

      if (!fallbackDriver) {
        return res.status(403).json({ error: 'Driver access required' });
      }

      req.user.role = 'driver';
      req.user.driverId = String(fallbackDriver._id);
    } catch (error) {
      return res.status(500).json({ error: 'Driver validation failed' });
    }
  }
  next();
};

const customerMiddleware = (req, res, next) => {
  const role = String(req.user?.role || '').trim().toLowerCase();
  if (role !== 'customer') {
    return res.status(403).json({ error: 'Customer access required' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  driverMiddleware,
  customerMiddleware
};
