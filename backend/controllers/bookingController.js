const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { generateBookingId, calculateDistance, calculatePrice } = require('../utils/helpers');
const axios = require('axios');
const { getIO } = require('../utils/socketManager');

const playNotificationSound = (soundUrl) => {
  const audio = new Audio(soundUrl);
  audio.play().catch((error) => console.error('Error playing notification sound:', error));
};

const generateRideOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const normalizeAction = (action) => String(action || '').trim().toLowerCase();

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const extractCityFromAddress = (address) => {
  const normalized = String(address || '').trim();
  if (!normalized) return '';
  return normalized.split(',')[0].trim();
};

const tokenizeLocationText = (value) => normalizeText(value)
  .split(/[^a-z0-9]+/i)
  .filter((token) => token.length > 2);

function bookingMatchesDriverArea(booking, candidateDrivers = []) {
  const locationHints = [
    booking?.pickupLocation?.city,
    booking?.pickupLocation?.address,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean);

  if (!locationHints.length) return true;

  const driverAreas = candidateDrivers
    .flatMap((driver) => [
      driver?.currentLocation?.city,
      driver?.personalDetails?.city,
      ...(Array.isArray(driver?.serviceAreas) ? driver.serviceAreas : []),
    ])
    .map((value) => normalizeText(value))
    .filter(Boolean);

  if (!driverAreas.length) return true;

  const bookingTokens = locationHints.flatMap(tokenizeLocationText);
  return driverAreas.some((area) => {
    if (locationHints.some((hint) => hint.includes(area) || area.includes(hint))) {
      return true;
    }

    return bookingTokens.some((token) => area.includes(token));
  });
}

function getLocationScore(driver, pickupAddress) {
  const pickup = normalizeText(pickupAddress);
  if (!pickup) return 0;

  const locationCandidates = [
    driver?.currentLocation?.city,
    driver?.personalDetails?.city,
    ...(Array.isArray(driver?.serviceAreas) ? driver.serviceAreas : []),
  ]
    .map(normalizeText)
    .filter(Boolean);

  let bestScore = 0;
  const pickupTokens = pickup.split(/\s+/).filter((token) => token.length > 2);

  for (const location of locationCandidates) {
    if (pickup.includes(location) || location.includes(pickup)) {
      bestScore = Math.max(bestScore, 3);
      continue;
    }

    if (pickupTokens.some((token) => location.includes(token))) {
      bestScore = Math.max(bestScore, 1);
    }
  }

  return bestScore;
}

function hasValidLocation(location) {
  if (!location) return false;
  if (location.address && String(location.address).trim()) return true;
  const hasCoords = location.latitude !== undefined && location.longitude !== undefined;
  return Boolean(hasCoords);
}

function buildStartDate(date, time) {
  if (date && time) {
    const value = new Date(`${date}T${time}`);
    if (!Number.isNaN(value.getTime())) return value;
  }
  if (date) {
    const value = new Date(date);
    if (!Number.isNaN(value.getTime())) return value;
  }
  return new Date();
}

function roundAmount(value) {
  return Number((Number(value) || 0).toFixed(2));
}

function buildInvoiceSummary(booking) {
  const subtotal = roundAmount(booking?.estimatedPrice || 0);
  const insurance = roundAmount(booking?.insuranceAmount || 0);
  const total = roundAmount(booking?.finalPrice || subtotal + insurance);
  const invoiceSuffix = booking?.bookingId || String(booking?._id || '').slice(-6) || 'DRAFT';

  return {
    invoiceId: `INV-${invoiceSuffix}`,
    bookingId: booking?.bookingId || null,
    subtotal,
    insurance,
    total,
    paymentStatus: booking?.paymentStatus || 'pending',
    paymentMethod: booking?.paymentMethod || 'upi',
    issuedAt: booking?.updatedAt || booking?.createdAt || new Date(),
  };
}

function buildDriverSummary(driver) {
  if (!driver) return null;

  return {
    id: driver._id,
    name: driver.name,
    phone: driver.phone,
    rating: driver.rating?.averageRating || 0,
    profilePicture: driver.profilePicture || null,
    vehicle: driver.vehicle || {},
    currentLocation: driver.currentLocation || {},
  };
}

function buildVerificationSummary(booking, { includeOtp = true } = {}) {
  const otpValue = booking?.verification?.otp || null;
  return {
    otp: includeOtp ? otpValue : null,
    otpSharedWithDriver: Boolean(booking?.verification?.otpSharedWithDriver),
    otpSharedAt: booking?.verification?.otpSharedAt || null,
    otpVerified: Boolean(booking?.verification?.otpVerified),
    otpExpiry: booking?.verification?.otpExpiry || null,
  };
}

async function findAssignableDrivers(excludeDriverId = null, pickupAddress = '') {
  const baseExclude = excludeDriverId ? { _id: { $ne: excludeDriverId } } : {};

  // First: look for actively online drivers
  let candidates = await Driver.find({
    ...baseExclude,
    status: { $in: ['approved', 'online'] },
    $or: [
      { isOnline: true },
      { 'onlineStatus.isCurrentlyOnline': true },
      { status: 'online' },
    ],
  });

  // Fallback: any approved driver (covers cases where isOnline field is not set)
  if (!candidates.length) {
    candidates = await Driver.find({
      ...baseExclude,
      status: 'approved',
    });
  }

  if (!candidates.length) return [];

  const candidateIds = candidates.map((d) => d._id);
  const blockingStatuses = ['confirmed', 'driver_assigned', 'driver_arrived', 'otp_verified', 'in_progress', 'ON_TRIP'];
  const recentPendingCutoff = new Date(Date.now() - 5 * 60 * 1000);
  const activeBookings = await Booking.find(
    {
      driverId: { $in: candidateIds },
      $or: [
        { status: { $in: blockingStatuses } },
        { status: 'pending', updatedAt: { $gte: recentPendingCutoff } },
      ],
    },
    'driverId'
  ).lean();

  const busyDriverIds = new Set(activeBookings.map((b) => String(b.driverId)));

  const availableCandidates = candidates.filter((driver) => !busyDriverIds.has(String(driver._id)));
  if (!availableCandidates.length) return [];

  const rankedByLocation = availableCandidates
    .map((driver) => ({
      driver,
      locationScore: getLocationScore(driver, pickupAddress),
      rating: Number(driver?.rating?.averageRating || 0),
    }))
    .sort((a, b) => {
      if (b.locationScore !== a.locationScore) return b.locationScore - a.locationScore;
      return b.rating - a.rating;
    });

  return rankedByLocation.map((item) => item.driver);
}

/**
 * Generate AI-based route mapping for pickup and dropoff locations
 * @param {Object} pickupLocation - { latitude, longitude }
 * @param {Object} dropLocation - { latitude, longitude }
 * @returns {Promise<Object>} - { route: Array, distance: Number, duration: Number }
 */
async function generateRouteMapping(pickupLocation, dropLocation) {
  try {
    const response = await axios.post(`${process.env.AI_ROUTE_API_URL}/generate-route`, {
      pickup: pickupLocation,
      dropoff: dropLocation
    });

    return response.data;
  } catch (error) {
    console.error('Error generating route mapping:', error);
    throw new Error('Failed to generate route mapping');
  }
}

/**
 * Get saved addresses for the authenticated user
 */
exports.getSavedAddresses = async (req, res) => {
  try {
    const customerId = req.user.id;
    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ savedAddresses: customer.savedAddresses || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      pickupLocation,
      dropLocation,
      bookingType,
      startDate,
      endDate,
      numberOfDays,
      driverId,
      insuranceOpted,
      insuranceType
    } = req.body;

    const distance = calculateDistance(
      pickupLocation.latitude,
      pickupLocation.longitude,
      dropLocation.latitude,
      dropLocation.longitude
    );

    const estimatedHours = numberOfDays * 8; // Assuming 8 hours per day
    const estimatedPrice = calculatePrice(distance, estimatedHours, bookingType);

    const booking = new Booking({
      bookingId: generateBookingId(),
      customerId,
      driverId: driverId || null,
      pickupLocation,
      dropLocation,
      bookingType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      numberOfDays,
      estimatedDistance: distance,
      estimatedPrice,
      finalPrice: insuranceOpted 
        ? estimatedPrice + (insuranceType === 'per_ride' ? 50 : 200)
        : estimatedPrice,
      status: 'pending',
      insuranceOpted,
      insuranceAmount: insuranceOpted ? (insuranceType === 'per_ride' ? 50 : 200) : 0,
      insuranceType: insuranceOpted ? insuranceType : 'none'
    });

    await booking.save();

    // Fetch driver details if assigned
    let driverData = null;
    if (driverId) {
      const driver = await Driver.findById(driverId);
      driverData = buildDriverSummary(driver);
    }

    const invoice = buildInvoiceSummary(booking);

    res.status(201).json({
      message: 'Booking created',
      success: true,
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        driver: driverData,
        invoice,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookingType: booking.bookingType,
        estimatedDistance: booking.estimatedDistance,
        estimatedPrice: booking.estimatedPrice,
        finalPrice: booking.finalPrice,
        insurance: {
          opted: booking.insuranceOpted,
          amount: booking.insuranceAmount,
          type: booking.insuranceType
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBookingWithRoute = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, ...bookingDetails } = req.body;

    // Generate route mapping
    const routeData = await generateRouteMapping(pickupLocation, dropLocation);

    const booking = new Booking({
      ...bookingDetails,
      pickupLocation,
      dropLocation,
      route: routeData.route,
      distance: routeData.distance,
      duration: routeData.duration
    });

    await booking.save();

    res.status(201).json({ message: 'Booking created with route mapping', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bookRide = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      pickupLocation,
      dropLocation,
      date,
      time,
      rideType = 'daily',
      preferredDriverId,
      insuranceOpted = false,
      insuranceAmount = 0,
      paymentMethod = 'upi'
    } = req.body;

    if (!hasValidLocation(pickupLocation) || !hasValidLocation(dropLocation)) {
      return res.status(400).json({ error: 'Invalid data: pickup and drop locations are required' });
    }

    const availableDrivers = await findAssignableDrivers(null, pickupLocation?.address || pickupLocation?.city || '');

    const pickupLat = Number(pickupLocation?.latitude);
    const pickupLng = Number(pickupLocation?.longitude);
    const dropLat = Number(dropLocation?.latitude);
    const dropLng = Number(dropLocation?.longitude);
    const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
    const hasDropCoords = Number.isFinite(dropLat) && Number.isFinite(dropLng);
    const estimatedDistance = hasPickupCoords && hasDropCoords
      ? calculateDistance(pickupLat, pickupLng, dropLat, dropLng)
      : 0;
    const estimatedHours = rideType === 'hourly' ? 4 : rideType === 'outstation' ? 10 : 8;
    const estimatedPrice = roundAmount(calculatePrice(estimatedDistance, estimatedHours, rideType));
    const normalizedInsuranceAmount = insuranceOpted ? roundAmount(insuranceAmount) : 0;
    const finalPrice = roundAmount(estimatedPrice + normalizedInsuranceAmount);

    let assignedDriver = null;

    if (availableDrivers.length) {
      if (preferredDriverId) {
        assignedDriver = availableDrivers.find((driver) => String(driver._id) === String(preferredDriverId));
      }

      if (!assignedDriver) {
        const driversByDistance = hasPickupCoords
          ? availableDrivers
            .filter((driver) =>
              Number.isFinite(Number(driver?.currentLocation?.latitude))
              && Number.isFinite(Number(driver?.currentLocation?.longitude))
            )
            .map((driver) => ({
              driver,
              distanceKm: calculateDistance(
                pickupLat,
                pickupLng,
                Number(driver.currentLocation.latitude),
                Number(driver.currentLocation.longitude)
              ),
            }))
            .sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm))
          : [];

        assignedDriver = driversByDistance.length
          ? driversByDistance[0].driver
          : availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
      }
    }
    const otp = generateRideOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const booking = new Booking({
      bookingId: generateBookingId(),
      customerId,
      driverId: assignedDriver?._id || null,
      pickupLocation,
      dropLocation,
      bookingType: rideType,
      startDate: buildStartDate(date, time),
      estimatedDistance,
      estimatedPrice,
      finalPrice,
      status: 'pending',
      paymentStatus: 'completed',
      paymentMethod,
      insuranceOpted,
      insuranceAmount: normalizedInsuranceAmount,
      insuranceType: insuranceOpted ? 'per_ride' : 'none',
      verification: {
        otp,
        otpGenerated: new Date(),
        otpExpiry: otpExpiresAt,
        otpSharedWithDriver: false,
        otpSharedAt: null,
        otpSharedByCustomer: false,
        otpVerified: false,
      },
      otp,
      otpExpiresAt,
      otpAttempts: 0,
      fareRatePerKm: 15,
      distance: 0,
      fare: 0,
    });

    await booking.save();

    if (assignedDriver?.phone) {
      const notifyMessage = `DriveEase: New Ride Request. Booking ${booking.bookingId}.`;
      try {
        await sendSMSToDriver(assignedDriver.phone, notifyMessage);
      } catch (notifyError) {
        console.error('Driver notification failed:', notifyError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: assignedDriver
        ? 'Ride booked successfully. Driver assignment invoice generated.'
        : 'Ride request submitted successfully. Booking is pending driver assignment.',
      ride: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        otp,
        driver: assignedDriver ? buildDriverSummary(assignedDriver) : null,
        estimatedDistance,
        estimatedPrice,
        finalPrice,
        invoice: buildInvoiceSummary(booking),
        confirmationMessage: assignedDriver
          ? 'Ride request sent to driver. Once accepted, your booking status will show Confirmed and the OTP can be shared to start the ride.'
          : 'No driver accepted yet. Your request is saved with this booking ID. We will assign a driver soon and update your booking status automatically.',
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        date: booking.startDate,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { status } = req.query;

    let filter = { customerId };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('driverId', 'name phone profilePicture rating plan')
      .sort({ createdAt: -1 });

    const formatted = bookings.map(b => ({
      _id: b._id,
      bookingId: b.bookingId,
      status: b.status,
      bookingType: b.bookingType,
      pickupLocation: b.pickupLocation,
      dropLocation: b.dropLocation,
      startDate: b.startDate,
      endDate: b.endDate,
      numberOfDays: b.numberOfDays,
      estimatedDistance: b.estimatedDistance,
      estimatedPrice: b.estimatedPrice,
      finalPrice: b.finalPrice,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod,
      driver: b.driverId ? {
        _id: b.driverId._id,
        name: b.driverId.name,
        phone: b.driverId.phone,
        profilePicture: b.driverId.profilePicture,
        rating: b.driverId.rating?.averageRating || 0,
        plan: b.driverId.plan?.type || 'ZERO',
      } : null,
      insurance: {
        opted: b.insuranceOpted || false,
        amount: b.insuranceAmount || 0,
        type: b.insuranceType || 'none',
      },
      verification: {
        otp: b.verification?.otp || null,
        otpSharedWithDriver: b.verification?.otpSharedWithDriver || false,
        otpSharedAt: b.verification?.otpSharedAt || null,
        otpVerified: b.verification?.otpVerified || false,
        otpExpiry: b.verification?.otpExpiry || b.otpExpiresAt || null,
        otpAttempts: b.otpAttempts || 0,
      },
      invoice: buildInvoiceSummary(b),
      rideFlow: b.rideFlow ? {
        baseFare: b.rideFlow.baseFare,
        finalFare: b.rideFlow.finalFare,
        commissionAmount: b.rideFlow.commissionAmount,
        driverEarning: b.rideFlow.driverEarning,
        isPeakRide: b.rideFlow.isPeakRide,
      } : null,
      feedback: b.feedback || null,
      notes: b.notes,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    res.json({ success: true, bookings: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name phone email')
      .populate('driverId', 'name phone profilePicture vehicle rating');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingData = booking.toObject();
    bookingData.invoice = buildInvoiceSummary(bookingData);

    if (req.user?.role === 'driver' && bookingData.verification && !bookingData.verification.otpSharedWithDriver) {
      delete bookingData.verification.otp;
    }

    res.json(bookingData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('driverId', 'name phone profilePicture rating vehicle');

    const invoice = buildInvoiceSummary(booking);
    const driver = booking.driverId ? buildDriverSummary(booking.driverId) : null;

    res.json({
      success: true,
      message: 'Booking status updated',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        driver,
        invoice,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        startDate: booking.startDate,
        estimatedPrice: booking.estimatedPrice,
        finalPrice: booking.finalPrice,
        verification: {
          otp: booking.verification?.otp || null,
          otpSharedWithDriver: booking.verification?.otpSharedWithDriver || false,
          otpSharedAt: booking.verification?.otpSharedAt || null,
          otpVerified: booking.verification?.otpVerified || false,
          otpExpiry: booking.verification?.otpExpiry
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: 'confirmed',
        paymentStatus: 'completed',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('driverId', 'name phone profilePicture rating vehicle');

    const invoice = buildInvoiceSummary(booking);
    const driver = booking.driverId ? buildDriverSummary(booking.driverId) : null;

    res.json({
      success: true,
      message: 'Booking confirmed',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        driver,
        invoice,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        estimatedPrice: booking.estimatedPrice,
        finalPrice: booking.finalPrice,
        verification: {
          otp: booking.verification?.otp || null,
          otpSharedWithDriver: booking.verification?.otpSharedWithDriver || false,
          otpSharedAt: booking.verification?.otpSharedAt || null,
          otpVerified: booking.verification?.otpVerified || false,
          otpExpiry: booking.verification?.otpExpiry
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        feedback: {
          rating,
          comment,
          date: new Date()
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    // Update driver rating
    if (booking.driverId) {
      const driver = await Driver.findById(booking.driverId);
      const totalRating = (driver.rating.averageRating * driver.rating.totalRatings) + rating;
      driver.rating.totalRatings += 1;
      driver.rating.averageRating = (totalRating / driver.rating.totalRatings).toFixed(1);
      await driver.save();
    }

    res.json({ message: 'Feedback added', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.triggerSOS = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        'emergency.sosCalled': true,
        'emergency.sosTime': new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    // In production, send alerts to helpline, family members, police, etc.
    console.log('SOS triggered for booking:', bookingId);

    res.json({ message: 'SOS triggered, help is on the way', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveAddress = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { label, address, latitude, longitude, city, state, pincode } = req.body;

    const user = await User.findByIdAndUpdate(
      customerId,
      {
        $push: {
          savedAddresses: {
            label,
            address,
            latitude,
            longitude,
            city,
            state,
            pincode
          }
        }
      },
      { new: true }
    );

    res.json({ message: 'Address saved', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ QUICK BOOK (from Browse page - works with or without auth) ============
exports.quickBook = async (req, res) => {
  try {
    const {
      driverId,
      customerName,
      customerPhone,
      pickupAddress,
      dropAddress,
      bookingDate,
      bookingType,
      numberOfDays,
      notes
    } = req.body;

    const normalizedCustomerName = (customerName || '').trim();
    const normalizedCustomerPhone = String(customerPhone || '').trim();

    // Validate required fields
    if (!driverId || !normalizedCustomerName || !normalizedCustomerPhone || !pickupAddress || !dropAddress || !bookingDate) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Validate phone
    if (!/^\d{10}$/.test(normalizedCustomerPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
    }

    // Find driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (!driver.isOnline) {
      return res.status(400).json({ error: 'Driver is currently offline' });
    }

    // Find or create customer user
    let customer = await User.findOne({ phone: normalizedCustomerPhone });
    if (!customer) {
      customer = new User({
        name: normalizedCustomerName,
        phone: normalizedCustomerPhone,
        role: 'customer',
        status: 'active'
      });
      await customer.save();
    } else if ((customer.name || '').trim() !== normalizedCustomerName) {
      // Keep customer record aligned with the name entered in latest quick booking.
      customer.name = normalizedCustomerName;
      await customer.save();
    }

    // Keep duplicate user docs (same phone) in sync so old linked bookings show correct name.
    await User.updateMany(
      { phone: normalizedCustomerPhone },
      { $set: { name: normalizedCustomerName } }
    );

    const bookingId = generateBookingId();
    const days = parseInt(numberOfDays) || 1;
    const estimatedPrice = calculatePrice(0, days * 8, bookingType || 'daily');

    const booking = new Booking({
      bookingId,
      customerId: customer._id,
      driverId: driver._id,
      pickupLocation: { address: pickupAddress },
      dropLocation: { address: dropAddress },
      bookingType: bookingType || 'daily',
      startDate: new Date(bookingDate),
      numberOfDays: days,
      estimatedPrice,
      finalPrice: estimatedPrice,
      status: 'pending',
      paymentStatus: 'completed',
      paymentMethod: 'upi',
      notes: notes || ''
    });

    await booking.save();

    // Update driver's total rides count
    await Driver.findByIdAndUpdate(driverId, {
      $inc: { 'experience.totalRides': 0 } // Don't increment until ride completes
    });

    // Send SMS notification to driver
    const smsMessage = `DriveEase: New booking! Customer: ${normalizedCustomerName}, Phone: ${normalizedCustomerPhone}, Pickup: ${pickupAddress}, Drop: ${dropAddress}, Date: ${new Date(bookingDate).toLocaleString('en-IN')}, Type: ${bookingType || 'daily'}, BookingID: ${bookingId}`;
    
    try {
      await sendSMSToDriver(driver.phone, smsMessage);
      console.log(`SMS sent to driver ${driver.name} (${driver.phone})`);
    } catch (smsErr) {
      console.error('SMS sending failed (booking still created):', smsErr.message);
    }

    res.status(201).json({
      message: 'Booking created successfully! Driver has been notified.',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        driverName: driver.name,
        driverPhone: driver.phone,
        status: booking.status,
        estimatedPrice: booking.estimatedPrice,
        finalPrice: booking.finalPrice,
        invoice: buildInvoiceSummary(booking),
        createdAt: booking.createdAt
      }
    });
  } catch (error) {
    console.error('Quick book error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get bookings for a driver (for driver dashboard)
exports.getDriverBookings = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Some environments can create multiple driver docs for the same phone
    // (e.g. registration + OTP login flow). Fetch bookings for all matching docs.
    const candidateDrivers = [];

    const byId = await Driver.findById(driverId);
    if (byId) candidateDrivers.push(byId);

    const candidatePhone = String(req.user.phone || byId?.phone || '').trim();
    if (candidatePhone) {
      const byPhone = await Driver.find({ phone: candidatePhone });
      byPhone.forEach((d) => {
        if (!candidateDrivers.find((c) => String(c._id) === String(d._id))) {
          candidateDrivers.push(d);
        }
      });

      const digits = candidatePhone.replace(/\D/g, '');
      const last10 = digits.slice(-10);
      if (last10.length === 10) {
        const byPhoneSuffix = await Driver.find({ phone: { $regex: `${last10}$` } });
        byPhoneSuffix.forEach((d) => {
          if (!candidateDrivers.find((c) => String(c._id) === String(d._id))) {
            candidateDrivers.push(d);
          }
        });
      }
    }

    if (!candidateDrivers.length) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const { status } = req.query;
    const driverIds = candidateDrivers.map((d) => d._id);
    let ownFilter = {
      $or: [
        { driverId: { $in: driverIds } },
        { 'rejectedByDrivers.driverId': { $in: driverIds } },
      ],
    };
    if (status) {
      ownFilter = {
        ...ownFilter,
        status,
      };
    }

    const ownBookings = await Booking.find(ownFilter)
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });

    const pendingPool = await Booking.find({
      status: 'pending',
      $or: [{ driverId: null }, { driverId: { $exists: false } }],
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });

    const visiblePoolBookings = pendingPool.filter((booking) => {
      const rejectedByCurrentDriver = Array.isArray(booking.rejectedByDrivers)
        ? booking.rejectedByDrivers.some((r) => driverIds.some((id) => String(id) === String(r?.driverId)))
        : false;

      if (rejectedByCurrentDriver) return false;
      return bookingMatchesDriverArea(booking, candidateDrivers);
    });

    const bookingById = new Map();
    [...ownBookings, ...visiblePoolBookings].forEach((booking) => {
      bookingById.set(String(booking._id), booking);
    });
    const bookings = Array.from(bookingById.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const customerPhones = [...new Set(
      bookings
        .map((b) => String(b.customerId?.phone || '').trim())
        .filter(Boolean)
    )];

    const latestNameByPhone = new Map();
    if (customerPhones.length) {
      const usersByPhone = await User.find({ phone: { $in: customerPhones } })
        .select('name phone updatedAt createdAt')
        .sort({ updatedAt: -1, createdAt: -1 });

      usersByPhone.forEach((u) => {
        const phone = String(u.phone || '').trim();
        const name = String(u.name || '').trim();
        if (!phone || !name || /^customer$/i.test(name)) return;
        if (!latestNameByPhone.has(phone)) {
          latestNameByPhone.set(phone, name);
        }
      });
    }

    const formatted = bookings.map((b) => {
      const customerPhone = String(b.customerId?.phone || '').trim();
      const resolvedCustomerName =
        latestNameByPhone.get(customerPhone) ||
        b.customerId?.name ||
        'Customer';
      const isRejectedByCurrentDriver = Array.isArray(b.rejectedByDrivers)
        ? b.rejectedByDrivers.some((r) => driverIds.some((id) => String(id) === String(r?.driverId)))
        : false;
      const latestRejection = isRejectedByCurrentDriver
        ? [...b.rejectedByDrivers]
          .filter((r) => driverIds.some((id) => String(id) === String(r?.driverId)))
          .sort((a, c) => new Date(c?.rejectedAt || 0) - new Date(a?.rejectedAt || 0))[0]
        : null;

      const isCurrentlyAssignedToCandidate = driverIds.some((id) => String(id) === String(b.driverId));
      const isOpenPending = b.status === 'pending' && !b.driverId;
      const inDriverArea = bookingMatchesDriverArea(b, candidateDrivers);

      return ({
      _id: b._id,
      bookingId: b.bookingId,
      status: isRejectedByCurrentDriver && !isCurrentlyAssignedToCandidate ? 'rejected' : b.status,
      bookingType: b.bookingType,
      pickupLocation: b.pickupLocation,
      dropLocation: b.dropLocation,
      startDate: b.startDate,
      endDate: b.endDate,
      numberOfDays: b.numberOfDays,
      estimatedDistance: b.estimatedDistance,
      estimatedPrice: b.estimatedPrice,
      finalPrice: b.finalPrice,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod,
      customer: b.customerId ? {
        name: resolvedCustomerName,
        phone: b.customerId.phone,
      } : null,
      verification: {
        otp: b.verification?.otpSharedWithDriver ? (b.verification?.otp || null) : null,
        otpSharedWithDriver: b.verification?.otpSharedWithDriver || false,
        otpSharedAt: b.verification?.otpSharedAt || null,
        otpVerified: b.verification?.otpVerified || false,
        otpExpiry: b.verification?.otpExpiry || null,
      },
      canStartRide: b.status === 'confirmed' && !!b.verification?.otpSharedWithDriver && !(b.verification?.otpVerified),
      canAccept: (isOpenPending && inDriverArea && !isRejectedByCurrentDriver) ||
        ((b.status === 'pending' || b.status === 'driver_assigned') && isCurrentlyAssignedToCandidate),
      canReject: ((b.status === 'pending' && isOpenPending) || b.status === 'driver_assigned' || b.status === 'pending') && !isRejectedByCurrentDriver,
      invoice: buildInvoiceSummary(b),
      insurance: {
        opted: b.insuranceOpted || false,
        amount: b.insuranceAmount || 0,
        driverInsurance: b.driverInsuranceOpted || false,
        driverInsuranceAmount: b.driverInsuranceAmount || 0,
      },
      rideFlow: b.rideFlow ? {
        baseFare: b.rideFlow.baseFare,
        finalFare: b.rideFlow.finalFare,
        commissionRate: b.rideFlow.commissionRate,
        commissionAmount: b.rideFlow.commissionAmount,
        driverEarning: b.rideFlow.driverEarning,
        isPeakRide: b.rideFlow.isPeakRide,
        driverPlan: b.rideFlow.driverPlan,
      } : null,
      feedback: b.feedback || null,
      notes: isRejectedByCurrentDriver && latestRejection
        ? `Rejected by you on ${new Date(latestRejection.rejectedAt).toLocaleString('en-IN')}`
        : b.notes,
      rejectedByCurrentDriver: isRejectedByCurrentDriver,
      rejectedAt: latestRejection?.rejectedAt || null,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    });
    });

    res.json({ success: true, bookings: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept/Reject booking by driver
exports.driverRespondBooking = async (req, res) => {
  try {
    const { action } = req.body;
    const driverId = req.user.id;
    const bookingId = req.params.id;

    const parsedAction = normalizeAction(action);
    if (parsedAction !== 'accept' && parsedAction !== 'reject' && parsedAction !== 'decline') {
      return res.status(400).json({ error: 'Invalid action. Use accept or decline' });
    }

    let booking = await Booking.findById(bookingId).populate('customerId', 'name phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isAssignedToCurrentDriver = booking.driverId && String(booking.driverId) === String(driverId);
    const isOpenPending = booking.status === 'pending' && !booking.driverId;

    if (parsedAction === 'accept') {
      if (isOpenPending) {
        const currentDriver = await Driver.findById(driverId);
        if (!currentDriver || !bookingMatchesDriverArea(booking, [currentDriver])) {
          return res.status(403).json({ error: 'This booking is outside your service location' });
        }

        const claimed = await Booking.findOneAndUpdate(
          {
            _id: bookingId,
            status: 'pending',
            $or: [{ driverId: null }, { driverId: { $exists: false } }],
          },
          {
            driverId,
            status: 'confirmed',
            updatedAt: new Date(),
          },
          { new: true }
        ).populate('customerId', 'name phone');

        if (!claimed) {
          return res.status(409).json({ error: 'Ride already accepted by another driver' });
        }

        booking = claimed;
      } else if (isAssignedToCurrentDriver) {
        booking.status = 'confirmed';
        booking.updatedAt = new Date();
        await booking.save();
      } else {
        return res.status(403).json({ error: 'This ride is not available to accept' });
      }

      await Driver.findByIdAndUpdate(driverId, {
        availabilityStatus: 'BUSY',
        lastActiveAt: new Date(),
      });

      if (booking.customerId?.phone) {
        const acceptedMsg = `DriveEase: Driver accepted your ride ${booking.bookingId}.`;
        try {
          await sendSMSToDriver(booking.customerId.phone, acceptedMsg);
        } catch (e) {
          console.error('SMS to customer failed:', e.message);
        }
      }

      const driver = await Driver.findById(driverId);
      const invoice = buildInvoiceSummary(booking);

      return res.json({
        success: true,
        message: 'Booking accepted',
        booking: {
          _id: booking._id,
          bookingId: booking.bookingId,
          status: booking.status,
          driver: buildDriverSummary(driver),
          invoice,
          verification: {
            otp: booking.verification?.otpSharedWithDriver ? (booking.verification?.otp || null) : null,
            otpSharedWithDriver: booking.verification?.otpSharedWithDriver || false,
            otpSharedAt: booking.verification?.otpSharedAt || null,
            otpVerified: booking.verification?.otpVerified || false,
            otpExpiry: booking.verification?.otpExpiry
          },
          pickupLocation: booking.pickupLocation,
          dropLocation: booking.dropLocation,
          startDate: booking.startDate,
          estimatedPrice: booking.estimatedPrice,
          finalPrice: booking.finalPrice
        }
      });
    }

    // Reject/Decline flow for shared booking pool
    await Driver.findByIdAndUpdate(driverId, {
      availabilityStatus: 'AVAILABLE',
      lastActiveAt: new Date(),
    });

    booking.rejectedByDrivers = booking.rejectedByDrivers || [];
    const alreadyRejected = booking.rejectedByDrivers.some((entry) => String(entry?.driverId) === String(driverId));
    if (!alreadyRejected) {
      booking.rejectedByDrivers.push({
        driverId,
        action: parsedAction === 'decline' ? 'decline' : 'reject',
        rejectedAt: new Date(),
      });
    }

    if (isAssignedToCurrentDriver) {
      booking.driverId = null;
      booking.status = 'pending';
    }

    booking.updatedAt = new Date();
    await booking.save();

    const invoice = buildInvoiceSummary(booking);

    res.json({
      success: true,
      message: 'Booking declined for this driver',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        invoice,
        notes: booking.notes,
        updatedAt: booking.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markDriverArrived = async (req, res) => {
  try {
    const driverId = req.user.id;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.driverId || String(booking.driverId) !== String(driverId)) {
      return res.status(403).json({ error: 'This ride is not assigned to you' });
    }

    if (!['confirmed', 'driver_assigned'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot mark arrived from status ${booking.status}` });
    }

    booking.status = 'driver_arrived';
    booking.updatedAt = new Date();
    await booking.save();

    const driver = await Driver.findById(driverId);
    const invoice = buildInvoiceSummary(booking);

    return res.json({
      success: true,
      message: 'Arrival marked successfully',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        driver: buildDriverSummary(driver),
        invoice,
        verification: {
          otp: booking.verification?.otp || null,
          otpVerified: booking.verification?.otpVerified || false,
          otpExpiry: booking.verification?.otpExpiry
        },
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        estimatedPrice: booking.estimatedPrice,
        finalPrice: booking.finalPrice,
        updatedAt: booking.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.startRideWithOTP = async (req, res) => {
  try {
    const driverId = req.user.id;
    const bookingId = req.params.id;
    const enteredOTP = String(req.body.otp || '').trim();

    if (!enteredOTP) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.driverId || String(booking.driverId) !== String(driverId)) {
      return res.status(403).json({ error: 'This ride is not assigned to you' });
    }

    if (!booking.verification?.otpSharedWithDriver) {
      return res.status(400).json({ error: 'Customer has not shared the OTP yet' });
    }

    if (Number(booking.otpAttempts || 0) >= 3) {
      return res.status(429).json({ error: 'Too many attempts, try later' });
    }

    const bookingOtp = String(booking.otp || booking.verification?.otp || '').trim();
    if (bookingOtp !== enteredOTP) {
      booking.otpAttempts = Number(booking.otpAttempts || 0) + 1;
      booking.updatedAt = new Date();
      await booking.save();
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const expiresAt = booking.otpExpiresAt || booking.verification?.otpExpiry;
    if (expiresAt && new Date() > new Date(expiresAt)) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    booking.verification.otpVerified = true;
    booking.verification.otpVerificationTime = new Date();
    booking.verification.otp = null;
    booking.status = 'in_progress';
    booking.otp = null;
    booking.otpAttempts = 0;
    booking.otpExpiresAt = null;
    booking.rideStartTime = new Date();
    booking.rideCompletion = booking.rideCompletion || {};
    booking.rideCompletion.actualStartTime = new Date();
    booking.updatedAt = new Date();
    await booking.save();

    const io = getIO();
    if (io) {
      io.to(String(booking._id)).emit('ride_started', {
        bookingId: String(booking._id),
        status: booking.status,
      });
    }

    const driver = await Driver.findById(driverId);
    const invoice = buildInvoiceSummary(booking);

    res.json({
      success: true,
      message: 'Ride started',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        driver: buildDriverSummary(driver),
        invoice,
        verification: booking.verification,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        estimatedPrice: booking.estimatedPrice,
        finalPrice: booking.finalPrice,
        rideCompletion: booking.rideCompletion
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.shareRideOTP = async (req, res) => {
  try {
    const customerId = req.user.id;
    const bookingId = req.params.id;

    const booking = await Booking.findOne({ _id: bookingId, customerId }).populate('driverId', 'name phone');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const shareAllowedStatuses = ['pending', 'confirmed', 'driver_assigned', 'driver_arrived'];
    if (!shareAllowedStatuses.includes(booking.status)) {
      return res.status(400).json({ error: `OTP cannot be shared when booking is ${booking.status}` });
    }

    if (!booking.verification?.otp) {
      return res.status(400).json({ error: 'No OTP found for this booking' });
    }

    if ((booking.otpExpiresAt || booking.verification?.otpExpiry) && new Date() > new Date(booking.otpExpiresAt || booking.verification?.otpExpiry)) {
      return res.status(400).json({ error: 'OTP expired. Please contact support to regenerate OTP.' });
    }

    if (booking.verification?.otpVerified) {
      return res.status(400).json({ error: 'OTP already verified and ride started' });
    }

    booking.verification.otpSharedWithDriver = true;
    booking.verification.otpSharedAt = new Date();
    booking.verification.otpSharedByCustomer = true;

    if (booking.status === 'pending') {
      booking.status = 'confirmed';
    }

    booking.updatedAt = new Date();
    await booking.save();

    if (booking.driverId?.phone) {
      const msg = `DriveEase OTP: Booking ${booking.bookingId}, Start OTP ${booking.verification.otp}.`;
      try {
        await sendSMSToDriver(booking.driverId.phone, msg);
      } catch (smsErr) {
        console.error('SMS to driver failed while sharing OTP:', smsErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'OTP shared with driver successfully',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        verification: buildVerificationSummary(booking, { includeOtp: true }),
        driver: booking.driverId ? buildDriverSummary(booking.driverId) : null,
        updatedAt: booking.updatedAt,
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.completeRide = async (req, res) => {
  try {
    const driverId = req.user.id;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId).populate('customerId', 'phone');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.driverId || String(booking.driverId) !== String(driverId)) {
      return res.status(403).json({ error: 'This ride is not assigned to you' });
    }

    booking.status = 'completed';
    booking.rideCompletion = booking.rideCompletion || {};
    booking.rideCompletion.actualEndTime = new Date();
    booking.updatedAt = new Date();
    await booking.save();

    await Driver.findByIdAndUpdate(driverId, {
      availabilityStatus: 'AVAILABLE',
      lastRideAt: new Date(),
      lastActiveAt: new Date(),
    });

    if (booking.customerId?.phone) {
      try {
        await sendSMSToDriver(booking.customerId.phone, `DriveEase: Ride ${booking.bookingId} completed.`);
      } catch (e) {
        console.error('SMS to customer failed:', e.message);
      }
    }

    const driver = await Driver.findById(driverId).select('phone');
    if (driver?.phone) {
      try {
        await sendSMSToDriver(driver.phone, `DriveEase: Ride ${booking.bookingId} completed.`);
      } catch (e) {
        console.error('SMS to driver failed:', e.message);
      }
    }

    const driverFull = await Driver.findById(driverId);
    const invoice = buildInvoiceSummary(booking);

    res.json({
      success: true,
      message: 'Ride completed',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        driver: buildDriverSummary(driverFull),
        invoice,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        finalPrice: booking.finalPrice,
        rideCompletion: booking.rideCompletion
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Simple book-now endpoint (creates a shared nearby driver request)
exports.bookNow = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { pickup, drop, rideType = 'daily' } = req.body;

    if (!pickup || !drop) {
      return res.status(400).json({ message: 'Pickup and drop locations are required' });
    }

    const validRideTypes = ['hourly', 'daily', 'outstation', 'subscription'];
    const normalizedRideType = validRideTypes.includes(rideType) ? rideType : 'daily';

    const otp = generateRideOTP();
    const bookingId = generateBookingId();
    const pickupCity = extractCityFromAddress(pickup);
    const dropCity = extractCityFromAddress(drop);

    const booking = new Booking({
      bookingId,
      customerId,
      pickupLocation: { address: pickup, city: pickupCity },
      dropLocation: { address: drop, city: dropCity },
      bookingType: normalizedRideType,
      startDate: new Date(),
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      verification: {
        otp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
        otpVerified: false,
      },
      otp,
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      otpAttempts: 0,
      fareRatePerKm: 15,
      distance: 0,
      fare: 0,
    });

    await booking.save();

    return res.status(201).json({
      message: 'Ride request created. Nearby drivers can now accept it.',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        pickup,
        drop,
        rideType: normalizedRideType,
        status: booking.status,
        otp,
        driver: null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// SMS sender function using Fast2SMS (free Indian SMS API)
async function sendSMSToDriver(phone, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    console.log(`[SMS SIMULATION] To: ${phone}`);
    console.log(`[SMS SIMULATION] Message: ${message}`);
    return { success: true, simulated: true };
  }

  try {
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'q',
      message: message,
      language: 'english',
      flash: 0,
      numbers: phone
    }, {
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (err) {
    console.error('Fast2SMS error:', err.response?.data || err.message);
    throw err;
  }
}
