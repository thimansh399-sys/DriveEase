/**
 * 🚀 DRIVE EASE - COMPLETE RIDE FLOW CONTROLLER
 * Handles: Book → Assign → Arrive → OTP Verify → Start → Track → End
 */

const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');
const rideEngine = require('../utils/rideAllocationEngine');
const { generateBookingId } = require('../utils/helpers');
const { getIO } = require('../utils/socketManager');
const { haversineDistanceKm, roundTo2 } = require('../utils/rideMath');

// In-memory live location store (use Redis in production)
const liveLocations = {};

/**
 * Generate 4-digit OTP
 */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Format date to IST string
 */
function toIST(date) {
  return new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

// ================== 1. BOOK RIDE ==================
exports.bookRide = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pickupLocation, dropLocation, bookingType, preferredDriverId } = req.body;

    if (!pickupLocation?.latitude || !pickupLocation?.longitude) {
      return res.status(400).json({ error: 'Pickup location with coordinates required' });
    }

    let assignedDriver = null;
    let allocationResult = null;

    // If preferred driver specified, use them directly
    if (preferredDriverId) {
      assignedDriver = await Driver.findById(preferredDriverId);
      if (!assignedDriver || !assignedDriver.isOnline) {
        return res.status(400).json({ error: 'Selected driver is not available' });
      }
    } else {
      // 🧠 Use Master Allocation Engine
      allocationResult = await rideEngine.findBestDriver(
        pickupLocation.latitude,
        pickupLocation.longitude
      );

      if (!allocationResult.success) {
        return res.status(404).json({ error: 'No drivers available nearby. Please try again.' });
      }

      assignedDriver = allocationResult.bestDriver.driver;
    }

    const driverPlan = assignedDriver.plan?.type || 'ZERO';

    // Calculate fare with peak boost
    const baseFare = req.body.estimatedPrice || 80;
    const fareInfo = rideEngine.calculateFareWithBoost(baseFare, driverPlan);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Create booking
    const booking = new Booking({
      bookingId: generateBookingId(),
      customerId: userId,
      driverId: assignedDriver._id,
      pickupLocation,
      dropLocation: dropLocation || {},
      bookingType: bookingType || 'daily',
      startDate: new Date(),
      estimatedPrice: fareInfo.finalFare,
      status: 'driver_assigned',
      otp,
      otpExpiresAt: otpExpiry,
      otpAttempts: 0,
      fareRatePerKm: Number(req.body.ratePerKm) > 0 ? Number(req.body.ratePerKm) : 15,
      distance: 0,
      fare: 0,
      verification: {
        otp,
        otpGenerated: new Date(),
        otpExpiry,
        otpVerified: false,
      },
      rideFlow: {
        driverPlan,
        baseFare: fareInfo.baseFare,
        peakMultiplier: fareInfo.multiplier,
        finalFare: fareInfo.finalFare,
        isPeakRide: fareInfo.isPeak,
        allocationScore: allocationResult?.bestDriver?.score || 0,
        driverDistance: allocationResult?.bestDriver?.distance || 0,
      },
      timestamps: {
        bookingCreatedIST: toIST(new Date()),
      },
    });

    await booking.save();

    // Update driver metrics
    assignedDriver.ridesToday = (assignedDriver.ridesToday || 0) + 1;
    assignedDriver.ridesThisWeek = (assignedDriver.ridesThisWeek || 0) + 1;
    assignedDriver.ridesThisMonth = (assignedDriver.ridesThisMonth || 0) + 1;
    assignedDriver.lastActiveAt = new Date();
    await assignedDriver.save();

    res.status(201).json({
      success: true,
      message: 'Ride booked! Driver assigned.',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        otp: booking.verification.otp, // Send OTP to customer
        driver: {
          id: assignedDriver._id,
          name: assignedDriver.name,
          phone: assignedDriver.phone,
          rating: assignedDriver.rating?.averageRating || 0,
          plan: driverPlan,
          profilePicture: assignedDriver.profilePicture,
        },
        fare: fareInfo,
        allocation: allocationResult
          ? {
              score: allocationResult.bestDriver.score,
              distance: allocationResult.bestDriver.distance,
              totalEligible: allocationResult.totalEligible,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Book ride error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ================== 2. DRIVER LOCATION UPDATE ==================
exports.updateDriverLocation = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { latitude, longitude } = req.body;

    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return res.status(400).json({ error: 'Coordinates required' });
    }

    const { bookingId } = req.body;
    // Store in memory for real-time tracking
    liveLocations[driverId] = {
      latitude,
      longitude,
      updatedAt: new Date(),
    };

    if (bookingId) {
      const booking = await Booking.findById(bookingId);

      if (booking && booking.driverId && String(booking.driverId) === String(driverId)) {
        const now = new Date();
        const prev = booking.lastDriverLocation;
        let nextDistance = Number(booking.distance || 0);

        if (
          prev
          && Number.isFinite(Number(prev.latitude))
          && Number.isFinite(Number(prev.longitude))
          && ['in_progress', 'ON_TRIP'].includes(booking.status)
        ) {
          const hopKm = haversineDistanceKm(
            Number(prev.latitude),
            Number(prev.longitude),
            Number(latitude),
            Number(longitude)
          );
          nextDistance += hopKm;
        }

        const rate = Number(booking.fareRatePerKm || 15);
        const nextFare = roundTo2(nextDistance * rate);

        booking.lastDriverLocation = {
          latitude,
          longitude,
          updatedAt: now,
        };
        booking.currentDriverLocation = {
          latitude,
          longitude,
          updatedAt: now,
        };
        booking.distance = roundTo2(nextDistance);
        booking.fare = nextFare;
        booking.updatedAt = now;
        await booking.save();

        const io = getIO();
        if (io) {
          const payload = {
            bookingId: String(booking._id),
            latitude: Number(latitude),
            longitude: Number(longitude),
            distance: booking.distance,
            fare: booking.fare,
            status: booking.status,
            updatedAt: now.toISOString(),
          };
          io.to(String(booking._id)).emit('driver_location_update', payload);
          io.to(String(booking._id)).emit('location_update', payload);
        }
      }
    }

    // Also persist to DB
    await Driver.findByIdAndUpdate(driverId, {
      'currentLocation.latitude': latitude,
      'currentLocation.longitude': longitude,
      'currentLocation.lastUpdated': new Date(),
      lastActiveAt: new Date(),
    });

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== 3. DRIVER ARRIVED ==================
exports.driverArrived = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.driverId.toString() !== driverId) {
      return res.status(403).json({ error: 'Not your booking' });
    }

    if (booking.status !== 'driver_assigned') {
      return res.status(400).json({ error: `Cannot mark arrived. Current status: ${booking.status}` });
    }

    booking.status = 'driver_arrived';
    booking.updatedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Marked as arrived. Waiting for OTP from customer.',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== 4. OTP VERIFY & START RIDE ==================
exports.verifyOTPAndStart = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { bookingId } = req.params;
    const { otp } = req.body;
    return verifyRideOtpStart({ bookingId, otp, driverId, res });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyOTPAndStartByBody = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { bookingId, otp } = req.body;
    return verifyRideOtpStart({ bookingId, otp, driverId, res });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function verifyRideOtpStart({ bookingId, otp, driverId, res }) {
  const safeBookingId = String(bookingId || '').trim();
  const safeOtp = String(otp || '').trim();

  if (!safeBookingId) {
    return res.status(400).json({ error: 'bookingId is required' });
  }

  if (!/^\d{4}$/.test(safeOtp)) {
    return res.status(400).json({ error: 'OTP must be a 4-digit code' });
  }

  const booking = await Booking.findById(safeBookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (!booking.driverId || String(booking.driverId) !== String(driverId)) {
    return res.status(403).json({ error: 'Not your booking' });
  }

  if (['in_progress', 'ON_TRIP', 'completed'].includes(booking.status)) {
    return res.status(409).json({ error: 'Ride already started' });
  }

  const now = new Date();
  const expiresAt = booking.otpExpiresAt || booking.verification?.otpExpiry;
  if (expiresAt && now > new Date(expiresAt)) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  const attempts = Number(booking.otpAttempts || 0);
  if (attempts >= 3) {
    return res.status(429).json({ error: 'Too many attempts, try later' });
  }

  const savedOtp = String(booking.otp || booking.verification?.otp || '').trim();
  if (savedOtp !== safeOtp) {
    booking.otpAttempts = attempts + 1;
    booking.updatedAt = now;
    await booking.save();
    return res.status(400).json({ error: 'Invalid OTP', otpAttempts: booking.otpAttempts });
  }

  booking.status = 'in_progress';
  booking.rideStartTime = now;
  booking.otp = null;
  booking.otpAttempts = 0;
  booking.otpExpiresAt = null;
  booking.verification = booking.verification || {};
  booking.verification.otp = null;
  booking.verification.otpVerified = true;
  booking.verification.otpVerificationTime = now;
  booking.rideCompletion = booking.rideCompletion || {};
  booking.rideCompletion.actualStartTime = now;
  booking.updatedAt = now;
  booking.timestamps = booking.timestamps || {};
  booking.timestamps.rideStartIST = toIST(now);
  await booking.save();

  const io = getIO();
  if (io) {
    io.to(String(booking._id)).emit('ride_started', {
      bookingId: String(booking._id),
      status: booking.status,
      startedAt: now.toISOString(),
    });
  }

  return res.json({
    success: true,
    message: 'Ride started',
    booking: {
      id: booking._id,
      bookingId: booking.bookingId,
      status: booking.status,
      rideStartTime: booking.rideStartTime,
      fareRatePerKm: booking.fareRatePerKm,
      distance: booking.distance || 0,
      fare: booking.fare || 0,
    },
  });
}

// ================== 5. REGENERATE OTP ==================
exports.regenerateOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.customerId.toString() !== userId) {
      return res.status(403).json({ error: 'Not your booking' });
    }

    if (booking.status !== 'driver_arrived' && booking.status !== 'driver_assigned') {
      return res.status(400).json({ error: 'Cannot regenerate OTP at this stage' });
    }

    const otp = generateOTP();
    booking.otp = otp;
    booking.otpAttempts = 0;
    booking.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    booking.verification.otp = otp;
    booking.verification.otpGenerated = new Date();
    booking.verification.otpExpiry = booking.otpExpiresAt;
    booking.updatedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'New OTP generated',
      otp, // Send to customer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== 6. TRACK RIDE (Live Location) ==================
exports.trackRide = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('driverId', 'name phone profilePicture');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const driverId = booking.driverId._id.toString();
    const location = liveLocations[driverId] || null;

    // Fallback to DB location
    let driverLocation = location;
    if (!driverLocation) {
      const driver = await Driver.findById(driverId);
      if (driver?.currentLocation?.latitude) {
        driverLocation = {
          latitude: driver.currentLocation.latitude,
          longitude: driver.currentLocation.longitude,
          updatedAt: driver.currentLocation.lastUpdated,
        };
      }
    }

    res.json({
      success: true,
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        rideStartTime: booking.rideStartTime || booking.rideCompletion?.actualStartTime || null,
        fareRatePerKm: booking.fareRatePerKm || 15,
        distance: booking.distance || 0,
        fare: booking.fare || booking.finalPrice || booking.estimatedPrice || 0,
        driver: {
          id: booking.driverId._id,
          name: booking.driverId.name,
          phone: booking.driverId.phone,
          profilePicture: booking.driverId.profilePicture,
        },
      },
      driverLocation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== 7. END RIDE ==================
exports.endRide = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { bookingId } = req.params;
    const { actualDistance } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.driverId.toString() !== driverId) {
      return res.status(403).json({ error: 'Not your booking' });
    }

    if (!['in_progress', 'ON_TRIP'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot end ride. Current status: ${booking.status}` });
    }

    const now = new Date();
    const driverPlan = booking.rideFlow?.driverPlan || 'ZERO';
    let fare = booking.rideFlow?.finalFare || booking.estimatedPrice || 80;

    // Add insurance cost to fare if opted
    const insuranceCost = booking.insuranceOpted ? (booking.insuranceAmount || 49) : 0;
    fare += insuranceCost;

    // Get driver for monthly earnings
    const driver = await Driver.findById(driverId);
    const monthlyEarnings = driver?.monthlyEarnings || 0;

    // 💰 Commission calculation (on base fare, not insurance)
    const fareForCommission = fare - insuranceCost;
    const commissionInfo = rideEngine.calculateCommission(driverPlan, fareForCommission, monthlyEarnings);

    // Update booking
    booking.status = 'completed';
    booking.rideEndTime = now;
    booking.rideCompletion = {
      ...booking.rideCompletion,
      actualEndTime: now,
      actualDistance: actualDistance || booking.distance || booking.estimatedDistance || 0,
      finalCalculatedPrice: booking.fare > 0 ? booking.fare : fare,
    };
    booking.rideFlow = {
      ...booking.rideFlow,
      commissionRate: commissionInfo.rate,
      commissionAmount: commissionInfo.commission,
      driverEarning: commissionInfo.driverEarning,
    };
    booking.finalPrice = booking.fare > 0 ? booking.fare : fare;
    booking.timestamps.rideEndIST = toIST(now);
    booking.updatedAt = now;
    await booking.save();

    // Update driver earnings
    if (driver) {
      driver.experience.totalRides = (driver.experience.totalRides || 0) + 1;
      driver.experience.totalEarnings = (driver.experience.totalEarnings || 0) + commissionInfo.driverEarning;
      driver.monthlyEarnings = (driver.monthlyEarnings || 0) + commissionInfo.driverEarning;
      driver.commission.totalCommissionEarned = (driver.commission.totalCommissionEarned || 0) + commissionInfo.commission;
      driver.commission.totalEarningsAfterCommission = (driver.commission.totalEarningsAfterCommission || 0) + commissionInfo.driverEarning;
      driver.lastRideAt = now;
      driver.lastActiveAt = now;
      await driver.save();
    }

    // Check for plan upgrade suggestion
    const upgradeSuggestion = rideEngine.getUpgradeSuggestion(
      driverPlan,
      (driver?.monthlyEarnings || 0),
      (driver?.ridesThisMonth || 0)
    );

    // Check weekly bonus
    const weeklyBonus = rideEngine.checkWeeklyBonus(driverPlan, driver?.ridesThisWeek || 0);

    const io = getIO();
    if (io) {
      io.to(String(booking._id)).emit('ride_ended', {
        bookingId: String(booking._id),
        status: booking.status,
        rideEndTime: booking.rideEndTime,
        distance: booking.rideCompletion.actualDistance,
        fare: booking.finalPrice,
      });
    }

    res.json({
      success: true,
      message: 'Ride completed! ✅',
      rideResult: {
        bookingId: booking.bookingId,
        fare: booking.finalPrice,
        baseFare: fare - insuranceCost,
        insuranceCost,
        insuranceOpted: booking.insuranceOpted,
        commission: commissionInfo.commission,
        commissionRate: `${(commissionInfo.rate * 100).toFixed(0)}%`,
        driverEarning: commissionInfo.driverEarning,
        plan: driverPlan,
        duration: booking.rideCompletion.actualStartTime
          ? Math.round((now - new Date(booking.rideCompletion.actualStartTime)) / 60000)
          : 0,
        distance: actualDistance || 0,
      },
      upgradeSuggestion: upgradeSuggestion.suggest ? upgradeSuggestion : null,
      weeklyBonus: weeklyBonus.eligible ? weeklyBonus : null,
    });
  } catch (error) {
    console.error('End ride error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ================== 8. GET ACTIVE RIDE ==================
exports.getActiveRide = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query;
    if (role === 'driver') {
      query = { driverId: userId, status: { $in: ['driver_assigned', 'driver_arrived', 'in_progress', 'ON_TRIP'] } };
    } else {
      query = { customerId: userId, status: { $in: ['driver_assigned', 'driver_arrived', 'in_progress', 'ON_TRIP'] } };
    }

    const booking = await Booking.findOne(query)
      .populate('driverId', 'name phone profilePicture rating plan currentLocation')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });

    if (!booking) {
      return res.json({ success: true, activeRide: null });
    }

    const driverId = booking.driverId?._id?.toString();
    const driverLive = liveLocations[driverId] || null;

    res.json({
      success: true,
      activeRide: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        otp: role === 'customer' ? booking.verification?.otp : undefined,
        otpVerified: booking.verification?.otpVerified,
        pickup: booking.pickupLocation,
        drop: booking.dropLocation,
        fare: booking.rideFlow?.finalFare || booking.estimatedPrice,
        isPeak: booking.rideFlow?.isPeakRide,
        startTime: booking.rideCompletion?.actualStartTime,
        driver: booking.driverId ? {
          id: booking.driverId._id,
          name: booking.driverId.name,
          phone: booking.driverId.phone,
          profilePicture: booking.driverId.profilePicture,
          rating: booking.driverId.rating?.averageRating || 0,
          plan: booking.driverId.plan?.type || 'ZERO',
        } : null,
        customer: booking.customerId ? {
          id: booking.customerId._id,
          name: booking.customerId.name,
          phone: booking.customerId.phone,
        } : null,
        driverLocation: driverLive,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== 9. CANCEL RIDE ==================
exports.cancelRide = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Both customer and driver can cancel before ride starts
    const isCustomer = booking.customerId.toString() === userId;
    const isDriver = booking.driverId?.toString() === userId;

    if (!isCustomer && !isDriver) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ error: `Booking already ${booking.status}` });
    }

    // If ride is in progress, only allow cancel with reason
    if (booking.status === 'in_progress' && !reason) {
      return res.status(400).json({ error: 'Reason required to cancel an in-progress ride' });
    }

    booking.status = 'cancelled';
    booking.notes = `Cancelled by ${isCustomer ? 'customer' : 'driver'}. Reason: ${reason || 'N/A'}`;
    booking.updatedAt = new Date();
    await booking.save();

    // If driver cancelled, reduce acceptance rate
    if (isDriver) {
      const driver = await Driver.findById(userId);
      if (driver) {
        const currentRate = driver.acceptanceRate || 100;
        driver.acceptanceRate = Math.max(0, currentRate - 2); // -2% per cancel
        driver.ridesToday = Math.max(0, (driver.ridesToday || 0) - 1);
        await driver.save();
      }
    }

    res.json({
      success: true,
      message: 'Ride cancelled',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== 10. GET RIDE HISTORY ==================
exports.getRideHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { page = 1, limit = 20 } = req.query;

    let query;
    if (role === 'driver') {
      query = { driverId: userId };
    } else {
      query = { customerId: userId };
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('driverId', 'name phone profilePicture rating plan')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const rides = bookings.map((b) => ({
      id: b._id,
      bookingId: b.bookingId,
      status: b.status,
      pickup: b.pickupLocation?.address || 'N/A',
      drop: b.dropLocation?.address || 'N/A',
      fare: b.rideFlow?.finalFare || b.finalPrice || b.estimatedPrice || 0,
      commission: b.rideFlow?.commissionAmount || 0,
      earning: b.rideFlow?.driverEarning || 0,
      plan: b.rideFlow?.driverPlan || 'ZERO',
      isPeak: b.rideFlow?.isPeakRide || false,
      driver: b.driverId ? { name: b.driverId.name, phone: b.driverId.phone } : null,
      customer: b.customerId ? { name: b.customerId.name, phone: b.customerId.phone } : null,
      date: b.createdAt,
      startTime: b.rideCompletion?.actualStartTime,
      endTime: b.rideCompletion?.actualEndTime,
    }));

    res.json({
      success: true,
      rides,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== INSURANCE PRICE ENGINE =====
function calculateInsurancePrice(booking) {
  const dist = booking.estimatedDistance || 0;
  const fare = booking.rideFlow?.finalFare || booking.estimatedPrice || 0;
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 6;
  const isOutstation = booking.bookingType === 'outstation';

  // Base: ₹29 for short rides
  let price = 29;

  // Distance bump
  if (dist > 10) price = 35;
  if (dist > 25) price = 39;
  if (dist > 50) price = 45;

  // Night/outstation/high-fare bump
  if (isNight) price = Math.max(price, 39);
  if (isOutstation) price = Math.max(price, 45);
  if (fare > 800) price = Math.max(price, 45);

  // Cap at ₹49
  return Math.min(price, 49);
}

// ================== 11. ADD INSURANCE TO RIDE (Customer) ==================
exports.addInsurance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.customerId.toString() !== userId) {
      return res.status(403).json({ error: 'Not your booking' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot add insurance to a finished ride' });
    }

    if (booking.insuranceOpted) {
      return res.status(400).json({ error: 'Insurance already added to this ride' });
    }

    const insurancePrice = calculateInsurancePrice(booking);

    booking.insuranceOpted = true;
    booking.insuranceAmount = insurancePrice;
    booking.insuranceType = 'per_ride';
    booking.updatedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: `₹5 lakh accidental cover added for just ₹${insurancePrice}! ✅`,
      insurance: {
        opted: true,
        amount: insurancePrice,
        type: 'per_ride',
        coverAmount: '₹5,00,000',
        coverage: [
          '₹5 lakh accidental damage cover',
          'Medical emergency — up to ₹1 lakh',
          'Ambulance assistance — free',
          'Third-party liability protection',
          '24/7 claim helpline',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== 11b. ADD DRIVER INSURANCE ==================
exports.addDriverInsurance = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (!booking.driverId || booking.driverId.toString() !== driverId) {
      return res.status(403).json({ error: 'Not your assigned ride' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Ride already finished' });
    }

    if (booking.driverInsuranceOpted) {
      return res.status(400).json({ error: 'Driver insurance already active' });
    }

    const driverInsurancePrice = 29; // flat ₹29 for driver

    booking.driverInsuranceOpted = true;
    booking.driverInsuranceAmount = driverInsurancePrice;
    booking.updatedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: `Driver insurance activated — ₹${driverInsurancePrice}! 🛡️`,
      insurance: {
        opted: true,
        amount: driverInsurancePrice,
        coverAmount: '₹3,00,000',
        coverage: [
          '₹3 lakh accidental cover for driver',
          'Vehicle damage protection',
          'Medical expenses — up to ₹50,000',
          'Towing assistance',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== 12. SMART SUGGEST INSURANCE ==================
exports.shouldSuggestInsurance = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const insurancePrice = calculateInsurancePrice(booking);
    const isDriver = booking.driverId?.toString() === req.user?.id;

    // Passenger suggestion
    let suggest = false;
    let reasons = [];
    let score = 0; // smart score: higher = stronger suggestion

    if (booking.insuranceOpted) {
      // Already insured — skip passenger suggestion
    } else {
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 6) {
        suggest = true;
        score += 30;
        reasons.push('🌙 Late night ride — stay protected!');
      }

      if (booking.estimatedDistance && booking.estimatedDistance > 20) {
        suggest = true;
        score += 25;
        reasons.push('🛣️ Long distance trip — insurance recommended');
      }

      if (booking.bookingType === 'outstation') {
        suggest = true;
        score += 35;
        reasons.push('🏙️ Outstation ride — better safe than sorry!');
      }

      const fare = booking.rideFlow?.finalFare || booking.estimatedPrice || 0;
      if (fare > 500) {
        suggest = true;
        score += 20;
        reasons.push('💸 High-value ride — protect your trip');
      }

      if (fare > 1000) {
        score += 15;
        reasons.push('🔥 Premium ride — ₹5 lakh cover for just ₹' + insurancePrice);
      }

      // First ride of the day? Always suggest
      if (!suggest) {
        suggest = true;
        score += 10;
        reasons.push('🛡️ ₹5 lakh accidental cover — just ₹' + insurancePrice);
      }
    }

    // Driver insurance suggestion
    let driverSuggest = false;
    let driverReasons = [];
    if (!booking.driverInsuranceOpted) {
      driverSuggest = true;
      driverReasons.push('🚗 ₹3 lakh driver cover — only ₹29/ride');
      if (booking.estimatedDistance > 30) {
        driverReasons.push('📍 Long trip — protect yourself & your vehicle');
      }
    }

    res.json({
      suggest: !booking.insuranceOpted && suggest,
      reasons,
      score,
      insuranceCost: insurancePrice,
      coverAmount: '₹5,00,000',
      passengerInsured: booking.insuranceOpted,
      message: !booking.insuranceOpted && suggest
        ? `🛡️ ₹5 lakh accidental cover — only ₹${insurancePrice}!`
        : null,
      driverInsurance: {
        suggest: driverSuggest,
        reasons: driverReasons,
        cost: 29,
        coverAmount: '₹3,00,000',
        alreadyOpted: booking.driverInsuranceOpted || false,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
