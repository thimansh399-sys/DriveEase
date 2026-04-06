const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { generateBookingId, calculateDistance, calculateRideBill } = require('../utils/helpers');
const axios = require('axios');
const { getIO } = require('../utils/socketManager');
const {
  getAutoAssignRadiusKm,
  getAssignmentResponseTimeoutMs,
  getMaxAssignmentAttempts,
} = require('../utils/assignmentConfig');
const { logBookingEvent } = require('../utils/auditLogger');

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

const CUSTOMER_PLAN_RULES = {
  BASIC: {
    key: 'BASIC',
    label: 'Basic',
    discountPct: 0,
    minDriverRating: 0,
    driverQuality: 'Normal drivers',
    priorityBadge: 'Standard',
    priorityWeight: 0,
    requiresVerified: false,
  },
  SMART: {
    key: 'SMART',
    label: 'Smart',
    discountPct: 0.08,
    minDriverRating: 4,
    driverQuality: '4★+ drivers',
    priorityBadge: 'Priority',
    priorityWeight: 14,
    requiresVerified: false,
  },
  ELITE: {
    key: 'ELITE',
    label: 'Elite',
    discountPct: 0.14,
    minDriverRating: 4.5,
    driverQuality: '4.5★+ verified drivers',
    priorityBadge: '🔥 Fastest Pickup',
    priorityWeight: 24,
    requiresVerified: true,
  },
};

const resolvePlanKeyFromSubscription = (subscription) => {
  const source = `${subscription?.planName || ''} ${subscription?.planType || ''}`.toLowerCase();
  if (!source.trim()) return 'BASIC';

  if (source.includes('elite') || source.includes('premium')) return 'ELITE';
  if (source.includes('smart') || source.includes('growth')) return 'SMART';
  return 'BASIC';
};

async function getCustomerPlanProfile(customerId) {
  const user = await User.findById(customerId).populate('subscriptionPlan');
  const planKey = resolvePlanKeyFromSubscription(user?.subscriptionPlan);
  const plan = CUSTOMER_PLAN_RULES[planKey] || CUSTOMER_PLAN_RULES.BASIC;

  return {
    user,
    planKey,
    plan,
  };
}

function isDriverVerifiedForPremium(driver) {
  if (!driver) return false;

  const statusApproved = ['approved', 'online', 'offline'].includes(String(driver.status || '').toLowerCase());
  const verificationOk = String(driver?.backgroundVerification?.status || '').toLowerCase() === 'verified';
  return statusApproved || verificationOk;
}

function applyCustomerPlanDriverFilters(drivers = [], planProfile = CUSTOMER_PLAN_RULES.BASIC) {
  const minRating = Number(planProfile?.minDriverRating || 0);

  return (Array.isArray(drivers) ? drivers : [])
    .filter((driver) => Number(driver?.rating?.averageRating || 0) >= minRating)
    .filter((driver) => (!planProfile?.requiresVerified || isDriverVerifiedForPremium(driver)));
}

function applyCustomerPlanPricing(baseBill, planProfile = CUSTOMER_PLAN_RULES.BASIC) {
  const discountPct = Number(planProfile?.discountPct || 0);
  const baseEstimated = roundAmount(baseBill?.estimatedPrice || 0);
  const baseFinal = roundAmount(baseBill?.finalPrice || 0);

  const discountAmount = roundAmount(baseEstimated * discountPct);
  const estimatedPrice = roundAmount(Math.max(0, baseEstimated - discountAmount));
  const finalPrice = roundAmount(Math.max(0, baseFinal - discountAmount));

  return {
    estimatedPrice,
    finalPrice,
    discountAmount,
    discountPct,
  };
}

function getPlanAwareQuotePayload(baseBill, activePlanKey = 'BASIC') {
  const basicPricing = applyCustomerPlanPricing(baseBill, CUSTOMER_PLAN_RULES.BASIC);
  const smartPricing = applyCustomerPlanPricing(baseBill, CUSTOMER_PLAN_RULES.SMART);
  const elitePricing = applyCustomerPlanPricing(baseBill, CUSTOMER_PLAN_RULES.ELITE);

  const activeRule = CUSTOMER_PLAN_RULES[activePlanKey] || CUSTOMER_PLAN_RULES.BASIC;
  const activePricing = applyCustomerPlanPricing(baseBill, activeRule);

  return {
    activePlan: {
      key: activeRule.key,
      label: activeRule.label,
      priorityBadge: activeRule.priorityBadge,
      driverQuality: activeRule.driverQuality,
      minDriverRating: activeRule.minDriverRating,
      discountPct: activePricing.discountPct,
      discountAmount: activePricing.discountAmount,
      estimatedPrice: activePricing.estimatedPrice,
      finalPrice: activePricing.finalPrice,
    },
    comparison: {
      BASIC: basicPricing,
      SMART: smartPricing,
      ELITE: elitePricing,
    },
    recommendUpgrade: activeRule.key === 'BASIC' ? {
      targetPlan: 'SMART',
      message: 'Upgrade to Smart & save ₹20 on this ride',
      indicativeSaving: 20,
      actualSaving: roundAmount(Math.max(0, basicPricing.estimatedPrice - smartPricing.estimatedPrice)),
    } : null,
  };
}

function buildInvoiceSummary(booking) {
  const fallbackBreakdown = booking?.fareBreakdown || {};
  const lineItems = booking?.invoice?.lineItems || fallbackBreakdown;
  const subtotal = roundAmount(booking?.estimatedPrice || lineItems?.estimatedPrice || 0);
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
    lineItems,
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

async function findAssignableDrivers(excludeDriverIds = null, pickupAddress = '') {
  const excluded = Array.isArray(excludeDriverIds)
    ? excludeDriverIds.filter(Boolean).map((id) => String(id))
    : (excludeDriverIds ? [String(excludeDriverIds)] : []);

  const baseExclude = excluded.length ? { _id: { $nin: excluded } } : {};

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

function getAttemptedDriverIds(booking) {
  const attempted = Array.isArray(booking?.assignment?.attemptedDriverIds)
    ? booking.assignment.attemptedDriverIds
    : [];

  return attempted.filter(Boolean).map((id) => String(id));
}

async function markBookingEscalated(booking, reason = 'No assignable drivers found') {
  const maxAttempts = Number(booking?.assignment?.maxAttempts || getMaxAssignmentAttempts());
  const attemptCount = Number(booking?.assignment?.attemptCount || 0);

  const updated = await Booking.findByIdAndUpdate(
    booking._id,
    {
      status: 'pending',
      updatedAt: new Date(),
      'assignment.strategy': 'nearest_v2',
      'assignment.maxAttempts': maxAttempts,
      'assignment.attemptCount': attemptCount,
      'assignment.escalated': true,
      'assignment.lastEvent': 'escalated',
      'assignment.currentAssignedDriverId': null,
      'assignment.currentAssignedAt': null,
      'assignment.currentAssignmentExpiresAt': null,
      notes: `${booking?.notes ? `${booking.notes} | ` : ''}Escalated: ${reason}`,
    },
    { new: true }
  );

  if (updated) {
    logBookingEvent('booking_escalated', updated, { reason, attemptCount, maxAttempts });
  }

  return updated;
}

async function assignNearestDriverForPendingBooking(booking) {
  const pickupAddress = booking?.pickupLocation?.address || booking?.pickupLocation?.city || '';
  const pickupLat = Number(booking?.pickupLocation?.latitude);
  const pickupLng = Number(booking?.pickupLocation?.longitude);
  const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);

  if (!hasPickupCoords) {
    return null;
  }

  const attemptedDriverIds = getAttemptedDriverIds(booking);
  const maxAttempts = Number(booking?.assignment?.maxAttempts || getMaxAssignmentAttempts());

  if (attemptedDriverIds.length >= maxAttempts) {
    await markBookingEscalated(booking, 'Max assignment attempts reached');
    return null;
  }

  const availableDrivers = await findAssignableDrivers(attemptedDriverIds, pickupAddress);
  if (!availableDrivers.length) {
    await markBookingEscalated(booking, 'No assignable drivers available');
    return null;
  }

  const maxAutoAssignDistanceKm = getAutoAssignRadiusKm();
  const assignmentTimeoutMs = getAssignmentResponseTimeoutMs();

  const driversByDistance = availableDrivers
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
    .filter((entry) => Number(entry.distanceKm) <= maxAutoAssignDistanceKm)
    .sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm));

  const selected = driversByDistance.length ? driversByDistance[0] : null;
  if (!selected?.driver) {
    await markBookingEscalated(booking, `No drivers within ${maxAutoAssignDistanceKm} km`);
    return null;
  }

  const assignmentNow = new Date();
  const assignmentExpiry = new Date(assignmentNow.getTime() + assignmentTimeoutMs);
  const nextAttemptedIds = [...attemptedDriverIds, String(selected.driver._id)];

  const claimed = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      status: 'pending',
      $or: [{ driverId: null }, { driverId: { $exists: false } }],
    },
    {
      driverId: selected.driver._id,
      status: 'driver_assigned',
      updatedAt: assignmentNow,
      assignment: {
        ...(booking.assignment || {}),
        strategy: 'nearest_v2',
        maxAttempts,
        attemptCount: nextAttemptedIds.length,
        attemptedDriverIds: nextAttemptedIds,
        currentAssignedDriverId: selected.driver._id,
        currentAssignedAt: assignmentNow,
        currentAssignmentExpiresAt: assignmentExpiry,
        acceptedAt: null,
        escalated: false,
        lastEvent: 'assigned',
      },
    },
    { new: true }
  );

  if (!claimed) {
    return null;
  }

  logBookingEvent('booking_assigned', claimed, {
    assignmentTimeoutMs,
    distanceKm: Number(selected.distanceKm.toFixed(2)),
    attempt: nextAttemptedIds.length,
    maxAttempts,
  });

  if (selected.driver?.phone) {
    try {
      await sendSMSToDriver(selected.driver.phone, `DriveEase: New Ride Request. Booking ${claimed.bookingId}.`);
    } catch (notifyError) {
      console.error('Driver notification failed:', notifyError.message);
    }
  }

  return claimed;
}

async function releaseExpiredAssignedBookings() {
  const now = new Date();
  const staleAssigned = await Booking.find({
    status: 'driver_assigned',
    'assignment.currentAssignmentExpiresAt': { $lte: now },
    $or: [
      { 'assignment.acceptedAt': null },
      { 'assignment.acceptedAt': { $exists: false } },
    ],
  }).limit(25);

  if (!staleAssigned.length) {
    return 0;
  }

  let released = 0;
  for (const booking of staleAssigned) {
    const currentAssignedDriverId = booking?.assignment?.currentAssignedDriverId || booking?.driverId || null;

    const updated = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        status: 'driver_assigned',
        'assignment.currentAssignmentExpiresAt': { $lte: now },
      },
      {
        status: 'pending',
        driverId: null,
        updatedAt: new Date(),
        'assignment.currentAssignedDriverId': null,
        'assignment.currentAssignedAt': null,
        'assignment.currentAssignmentExpiresAt': null,
        'assignment.lastEvent': 'timeout',
        ...(currentAssignedDriverId
          ? {
            $push: {
              rejectedByDrivers: {
                driverId: currentAssignedDriverId,
                action: 'decline',
                reason: 'assignment_timeout',
                rejectedAt: new Date(),
              },
            },
          }
          : {}),
      },
      { new: true }
    );

    if (updated) {
      released += 1;
      logBookingEvent('booking_assignment_timeout', updated, {
        timedOutDriverId: currentAssignedDriverId ? String(currentAssignedDriverId) : null,
      });
    }
  }

  return released;
}

exports.assignDriversToPendingBookings = async () => {
  try {
    const released = await releaseExpiredAssignedBookings();

    const pendingBookings = await Booking.find({
      status: 'pending',
      $or: [{ driverId: null }, { driverId: { $exists: false } }],
    })
      .sort({ createdAt: 1 })
      .limit(25);

    if (!pendingBookings.length) return { scanned: 0, assigned: 0, released };

    let assigned = 0;
    for (const booking of pendingBookings) {
      const result = await assignNearestDriverForPendingBooking(booking);
      if (result) assigned += 1;
    }

    return { scanned: pendingBookings.length, assigned, released };
  } catch (error) {
    console.error('Pending booking assignment worker failed:', error.message);
    return { scanned: 0, assigned: 0, released: 0, error: error.message };
  }
};

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
      insuranceType,
      waitingMinutes = 0,
      overtimeHours = 0,
    } = req.body;

    const distance = calculateDistance(
      pickupLocation.latitude,
      pickupLocation.longitude,
      dropLocation.latitude,
      dropLocation.longitude
    );

    const estimatedHours = numberOfDays * 8; // Assuming 8 hours per day
    const insuranceAmount = insuranceOpted ? (insuranceType === 'per_ride' ? 50 : 200) : 0;
    const bill = calculateRideBill({
      bookingType,
      distance,
      hours: estimatedHours,
      days: numberOfDays,
      bookingTime: startDate,
      waitingMinutes,
      overtimeHours,
      insuranceAmount,
    });

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
      estimatedPrice: bill.estimatedPrice,
      finalPrice: bill.finalPrice,
      status: 'pending',
      insuranceOpted,
      insuranceAmount,
      insuranceType: insuranceOpted ? insuranceType : 'none',
      fareBreakdown: bill.breakdown,
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
      paymentMethod = 'upi',
      waitingMinutes = 0,
      overtimeHours = 0,
      numberOfDays = 1,
      totalHours,
    } = req.body;

    if (!hasValidLocation(pickupLocation) || !hasValidLocation(dropLocation)) {
      return res.status(400).json({ error: 'Invalid data: pickup and drop locations are required' });
    }

    const customerPlanProfile = await getCustomerPlanProfile(customerId);

    const availableDriversRaw = await findAssignableDrivers(null, pickupLocation?.address || pickupLocation?.city || '');

    const pickupLat = Number(pickupLocation?.latitude);
    const pickupLng = Number(pickupLocation?.longitude);
    const dropLat = Number(dropLocation?.latitude);
    const dropLng = Number(dropLocation?.longitude);
    const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
    const hasDropCoords = Number.isFinite(dropLat) && Number.isFinite(dropLng);
    const estimatedDistance = hasPickupCoords && hasDropCoords
      ? calculateDistance(pickupLat, pickupLng, dropLat, dropLng)
      : 0;
    const estimatedHours = Number(totalHours) || (rideType === 'hourly' ? 4 : rideType === 'outstation' ? 10 : 8);
    const normalizedInsuranceAmount = insuranceOpted ? roundAmount(insuranceAmount) : 0;
    const bill = calculateRideBill({
      bookingType: rideType,
      distance: estimatedDistance,
      hours: estimatedHours,
      days: Number(numberOfDays) || 1,
      bookingTime: buildStartDate(date, time),
      waitingMinutes,
      overtimeHours,
      insuranceAmount: normalizedInsuranceAmount,
    });
    const planPricing = applyCustomerPlanPricing(bill, customerPlanProfile.plan);
    const estimatedPrice = planPricing.estimatedPrice;
    const finalPrice = planPricing.finalPrice;
    const availableDrivers = applyCustomerPlanDriverFilters(availableDriversRaw, customerPlanProfile.plan);
    const assignmentTimeoutMs = getAssignmentResponseTimeoutMs();
    const assignmentNow = new Date();
    const assignmentExpiry = new Date(assignmentNow.getTime() + assignmentTimeoutMs);
    const maxAttempts = getMaxAssignmentAttempts();

    let assignedDriver = null;

    if (availableDrivers.length) {
      if (preferredDriverId) {
        assignedDriver = availableDrivers.find((driver) => String(driver._id) === String(preferredDriverId));
      }

      if (!assignedDriver) {
        const maxAutoAssignDistanceKm = getAutoAssignRadiusKm();
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

        const nearbyDrivers = driversByDistance
          .filter((entry) => Number(entry.distanceKm) <= maxAutoAssignDistanceKm);

        assignedDriver = nearbyDrivers.length
          ? nearbyDrivers[0].driver
          : null;
      }
    }
    const otp = generateRideOTP();
    const otpExpiresAt = null;

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
      status: assignedDriver ? 'driver_assigned' : 'pending',
      paymentStatus: 'completed',
      paymentMethod,
      insuranceOpted,
      insuranceAmount: normalizedInsuranceAmount,
      insuranceType: insuranceOpted ? 'per_ride' : 'none',
      fareBreakdown: bill.breakdown,
      subscriptionId: customerPlanProfile.user?.subscriptionPlan?._id || null,
      verification: {
        otp,
        otpGenerated: new Date(),
        otpExpiry: null,
        otpSharedWithDriver: false,
        otpSharedAt: null,
        otpSharedByCustomer: false,
        otpVerified: false,
      },
      otp,
      otpExpiresAt: null,
      otpAttempts: 0,
      fareRatePerKm: 15,
      distance: 0,
      fare: 0,
      assignment: {
        strategy: 'nearest_v2',
        maxAttempts,
        attemptCount: assignedDriver ? 1 : 0,
        attemptedDriverIds: assignedDriver ? [assignedDriver._id] : [],
        currentAssignedDriverId: assignedDriver?._id || null,
        currentAssignedAt: assignedDriver ? assignmentNow : null,
        currentAssignmentExpiresAt: assignedDriver ? assignmentExpiry : null,
        acceptedAt: null,
        escalated: false,
        lastEvent: assignedDriver ? 'assigned' : 'created',
      },
      notes: `Customer Plan: ${customerPlanProfile.planKey}`
    });

    await booking.save();
    logBookingEvent('booking_requested', booking, {
      source: 'bookRide',
      rideType,
      hasPickupCoords,
      hasDropCoords,
      assignedImmediately: Boolean(assignedDriver),
    });

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
        insuranceOpted,
        insuranceAmount: normalizedInsuranceAmount,
        insuranceOpted,
        insuranceAmount: normalizedInsuranceAmount,
        pricingPlan: {
          key: customerPlanProfile.plan.key,
          label: customerPlanProfile.plan.label,
          priorityBadge: customerPlanProfile.plan.priorityBadge,
          driverQuality: customerPlanProfile.plan.driverQuality,
          discountPct: planPricing.discountPct,
          discountAmount: planPricing.discountAmount,
        },
        upgradePrompt: customerPlanProfile.planKey === 'BASIC'
          ? 'Upgrade to Smart & save ₹20 on this ride'
          : null,
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
    const bookingId = req.params.id;
    const normalizedRole = String(req.user?.role || '').toLowerCase();
    const numericRating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();

    if (!['customer', 'user'].includes(normalizedRole)) {
      return res.status(403).json({ error: 'Only customers can submit ride feedback' });
    }

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ error: 'Feedback comment is too long (max 500 chars)' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (String(booking.customerId || '') !== String(req.user?.id || '')) {
      return res.status(403).json({ error: 'You can only rate your own booking' });
    }

    if (String(booking.status || '').toLowerCase() !== 'completed') {
      return res.status(400).json({ error: 'Feedback can only be submitted after ride completion' });
    }

    if (booking.feedback?.rating) {
      return res.status(409).json({ error: 'Feedback already submitted for this ride' });
    }

    booking.feedback = {
      rating: numericRating,
      comment,
      date: new Date()
    };
    booking.updatedAt = new Date();
    await booking.save();

    let updatedDriverRating = null;

    // Auto-update driver rating aggregate.
    if (booking.driverId) {
      const driver = await Driver.findById(booking.driverId);
      if (driver) {
        const prevAverage = Number(driver.rating?.averageRating || 0);
        const prevCount = Number(driver.rating?.totalRatings || 0);
        const totalScore = (prevAverage * prevCount) + numericRating;
        const newCount = prevCount + 1;
        const newAverage = Number((totalScore / newCount).toFixed(1));

        driver.rating = {
          ...(driver.rating || {}),
          totalRatings: newCount,
          averageRating: newAverage
        };
        driver.updatedAt = new Date();
        await driver.save();

        updatedDriverRating = {
          averageRating: newAverage,
          totalRatings: newCount
        };
      }
    }

    res.json({
      success: true,
      message: 'Feedback added successfully',
      booking,
      driverRating: updatedDriverRating
    });
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
    const quickBookType = bookingType || 'daily';
    const quickBill = calculateRideBill({
      bookingType: quickBookType,
      distance: 0,
      hours: days * 8,
      days,
      bookingTime: bookingDate,
      insuranceAmount: 0,
    });
    const estimatedPrice = quickBill.estimatedPrice;

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
      finalPrice: quickBill.finalPrice,
      status: 'pending',
      paymentStatus: 'completed',
      paymentMethod: 'upi',
      fareBreakdown: quickBill.breakdown,
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
      assignment: {
        currentAssignedDriverId: b.assignment?.currentAssignedDriverId || null,
        currentAssignedAt: b.assignment?.currentAssignedAt || null,
        currentAssignmentExpiresAt: b.assignment?.currentAssignmentExpiresAt || null,
        acceptedAt: b.assignment?.acceptedAt || null,
        attemptCount: b.assignment?.attemptCount || 0,
        maxAttempts: b.assignment?.maxAttempts || getMaxAssignmentAttempts(),
        lastEvent: b.assignment?.lastEvent || 'created',
      },
      canStartRide: ['confirmed', 'driver_arrived', 'arrived'].includes(String(b.status || '').toLowerCase())
        && !(b.verification?.otpVerified),
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
            'assignment.acceptedAt': new Date(),
            'assignment.currentAssignedDriverId': driverId,
            'assignment.currentAssignmentExpiresAt': null,
            'assignment.lastEvent': 'accepted',
          },
          { new: true }
        ).populate('customerId', 'name phone');

        if (!claimed) {
          return res.status(409).json({ error: 'Ride already accepted by another driver' });
        }

        booking = claimed;
      } else if (isAssignedToCurrentDriver) {
        booking.status = 'confirmed';
        booking.assignment = booking.assignment || {};
        booking.assignment.acceptedAt = new Date();
        booking.assignment.currentAssignedDriverId = driverId;
        booking.assignment.currentAssignmentExpiresAt = null;
        booking.assignment.lastEvent = 'accepted';
        booking.updatedAt = new Date();
        await booking.save();
      } else {
        return res.status(403).json({ error: 'This ride is not available to accept' });
      }

      logBookingEvent('booking_accepted', booking, {
        actorDriverId: String(driverId),
      });

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
      booking.assignment = booking.assignment || {};
      booking.assignment.currentAssignedDriverId = null;
      booking.assignment.currentAssignedAt = null;
      booking.assignment.currentAssignmentExpiresAt = null;
      booking.assignment.lastEvent = 'declined';
    }

    booking.updatedAt = new Date();
    await booking.save();
    logBookingEvent('booking_declined', booking, {
      actorDriverId: String(driverId),
      action: parsedAction,
    });

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
    logBookingEvent('booking_arrived', booking, {
      actorDriverId: String(driverId),
    });

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
    logBookingEvent('booking_started', booking, {
      actorDriverId: String(driverId),
    });

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

    if (booking.verification?.otpVerified) {
      return res.status(400).json({ error: 'OTP already verified and ride started' });
    }

    booking.verification.otpSharedWithDriver = true;
    booking.verification.otpSharedAt = new Date();
    booking.verification.otpSharedByCustomer = true;
    booking.verification.otpExpiry = null;
    booking.otpExpiresAt = null;

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
    logBookingEvent('booking_completed', booking, {
      actorDriverId: String(driverId),
    });

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
exports.getRideQuote = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      pickup,
      drop,
      rideType = 'daily',
      pickupLatitude,
      pickupLongitude,
      dropLatitude,
      dropLongitude,
      waitingMinutes = 0,
      overtimeHours = 0,
      numberOfDays = 1,
      totalHours,
      insuranceOpted = false,
      insuranceAmount = 0,
    } = req.body || {};

    if (!pickup || !drop) {
      return res.status(400).json({ error: 'Pickup and drop locations are required for quote' });
    }

    const customerPlanProfile = await getCustomerPlanProfile(customerId);

    const pickupLat = Number(pickupLatitude);
    const pickupLng = Number(pickupLongitude);
    const dropLat = Number(dropLatitude);
    const dropLng = Number(dropLongitude);
    const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
    const hasDropCoords = Number.isFinite(dropLat) && Number.isFinite(dropLng);
    const estimatedDistance = hasPickupCoords && hasDropCoords
      ? Number(calculateDistance(pickupLat, pickupLng, dropLat, dropLng))
      : 0;

    const validRideTypes = ['hourly', 'daily', 'outstation', 'subscription'];
    const normalizedRideType = validRideTypes.includes(rideType) ? rideType : 'daily';
    const normalizedInsuranceAmount = insuranceOpted ? roundAmount(insuranceAmount) : 0;
    const estimatedHours = Number(totalHours) || (normalizedRideType === 'hourly' ? 4 : normalizedRideType === 'outstation' ? 10 : 8);

    const baseBill = calculateRideBill({
      bookingType: normalizedRideType,
      distance: estimatedDistance,
      hours: estimatedHours,
      days: Number(numberOfDays) || 1,
      bookingTime: new Date(),
      waitingMinutes,
      overtimeHours,
      insuranceAmount: normalizedInsuranceAmount,
    });

    const driversRaw = await findAssignableDrivers(null, pickup);
    const eligibleDrivers = applyCustomerPlanDriverFilters(driversRaw, customerPlanProfile.plan);
    const quotePayload = getPlanAwareQuotePayload(baseBill, customerPlanProfile.planKey);

    return res.json({
      success: true,
      quote: {
        rideType: normalizedRideType,
        estimatedDistance,
        baseEstimatedPrice: roundAmount(baseBill.estimatedPrice),
        baseFinalPrice: roundAmount(baseBill.finalPrice),
        ...quotePayload,
        driverPool: {
          totalAvailable: driversRaw.length,
          eligibleForPlan: eligibleDrivers.length,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.bookNow = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      pickup,
      drop,
      rideType = 'daily',
      pickupLatitude,
      pickupLongitude,
      dropLatitude,
      dropLongitude,
      waitingMinutes = 0,
      overtimeHours = 0,
      numberOfDays = 1,
      totalHours,
      insuranceOpted = false,
      insuranceAmount = 0,
    } = req.body;

    if (!pickup || !drop) {
      return res.status(400).json({ message: 'Pickup and drop locations are required' });
    }

    const pickupLat = Number(pickupLatitude);
    const pickupLng = Number(pickupLongitude);
    const dropLat = Number(dropLatitude);
    const dropLng = Number(dropLongitude);
    const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
    const hasDropCoords = Number.isFinite(dropLat) && Number.isFinite(dropLng);

    if (!hasPickupCoords) {
      return res.status(400).json({
        message: 'Pickup geolocation is required. Please allow location access to assign nearest driver.'
      });
    }

    const validRideTypes = ['hourly', 'daily', 'outstation', 'subscription'];
    const normalizedRideType = validRideTypes.includes(rideType) ? rideType : 'daily';
    const customerPlanProfile = await getCustomerPlanProfile(customerId);
    const maxAutoAssignDistanceKm = getAutoAssignRadiusKm();
    const assignmentTimeoutMs = getAssignmentResponseTimeoutMs();
    const assignmentNow = new Date();
    const assignmentExpiry = new Date(assignmentNow.getTime() + assignmentTimeoutMs);
    const maxAttempts = getMaxAssignmentAttempts();

    const otp = generateRideOTP();
    const bookingId = generateBookingId();
    const pickupCity = extractCityFromAddress(pickup);
    const dropCity = extractCityFromAddress(drop);
    const estimatedDistance = hasPickupCoords && hasDropCoords
      ? Number(calculateDistance(pickupLat, pickupLng, dropLat, dropLng))
      : 0;
    const normalizedInsuranceAmount = insuranceOpted ? roundAmount(insuranceAmount) : 0;
    const estimatedHours = Number(totalHours) || (normalizedRideType === 'hourly' ? 4 : normalizedRideType === 'outstation' ? 10 : 8);
    const baseBill = calculateRideBill({
      bookingType: normalizedRideType,
      distance: estimatedDistance,
      hours: estimatedHours,
      days: Number(numberOfDays) || 1,
      bookingTime: new Date(),
      waitingMinutes,
      overtimeHours,
      insuranceAmount: normalizedInsuranceAmount,
    });
    const planPricing = applyCustomerPlanPricing(baseBill, customerPlanProfile.plan);
    const quotePayload = getPlanAwareQuotePayload(baseBill, customerPlanProfile.planKey);

    const availableDriversRaw = await findAssignableDrivers(null, pickup);
    const availableDrivers = applyCustomerPlanDriverFilters(availableDriversRaw, customerPlanProfile.plan);
    const driversByDistance = availableDrivers
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
      .sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm));

    const nearbyDrivers = driversByDistance
      .filter((entry) => Number(entry.distanceKm) <= maxAutoAssignDistanceKm);
    const nearestDriverMatch = nearbyDrivers.length ? nearbyDrivers[0] : null;
    const assignedDriver = nearestDriverMatch?.driver || null;

    const booking = new Booking({
      bookingId,
      customerId,
      driverId: assignedDriver?._id || null,
      pickupLocation: { address: pickup, city: pickupCity, latitude: pickupLat, longitude: pickupLng },
      dropLocation: {
        address: drop,
        city: dropCity,
        ...(hasDropCoords ? { latitude: dropLat, longitude: dropLng } : {}),
      },
      bookingType: normalizedRideType,
      startDate: new Date(),
      estimatedDistance,
      estimatedPrice: planPricing.estimatedPrice,
      finalPrice: planPricing.finalPrice,
      status: assignedDriver ? 'driver_assigned' : 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      insuranceOpted,
      insuranceAmount: normalizedInsuranceAmount,
      insuranceType: insuranceOpted ? 'per_ride' : 'none',
      fareBreakdown: {
        ...(baseBill.breakdown || {}),
        customerPlan: customerPlanProfile.planKey,
        planDiscountAmount: planPricing.discountAmount,
      },
      subscriptionId: customerPlanProfile.user?.subscriptionPlan?._id || null,
      verification: {
        otp,
        otpExpiry: null,
        otpVerified: false,
      },
      otp,
      otpExpiresAt: null,
      otpAttempts: 0,
      fareRatePerKm: 15,
      distance: 0,
      fare: 0,
      notes: `Customer Plan: ${customerPlanProfile.planKey}`,
      assignment: {
        strategy: 'nearest_v2',
        maxAttempts,
        attemptCount: assignedDriver ? 1 : 0,
        attemptedDriverIds: assignedDriver ? [assignedDriver._id] : [],
        currentAssignedDriverId: assignedDriver?._id || null,
        currentAssignedAt: assignedDriver ? assignmentNow : null,
        currentAssignmentExpiresAt: assignedDriver ? assignmentExpiry : null,
        acceptedAt: null,
        escalated: false,
        lastEvent: assignedDriver ? 'assigned' : 'created',
      },
    });

    await booking.save();
    logBookingEvent('booking_requested', booking, {
      source: 'bookNow',
      rideType: normalizedRideType,
      assignedImmediately: Boolean(assignedDriver),
      nearestDriverDistanceKm: nearestDriverMatch ? Number(nearestDriverMatch.distanceKm.toFixed(2)) : null,
      maxAutoAssignDistanceKm,
    });

    if (assignedDriver?.phone) {
      const notifyMessage = `DriveEase: New Ride Request. Booking ${booking.bookingId}.`;
      try {
        await sendSMSToDriver(assignedDriver.phone, notifyMessage);
      } catch (notifyError) {
        console.error('Driver notification failed:', notifyError.message);
      }
    }

    return res.status(201).json({
      message: assignedDriver
        ? 'Ride request created and nearest driver assigned.'
        : `Ride request created, but no nearby driver found within ${maxAutoAssignDistanceKm} km.`,
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        pickup,
        drop,
        rideType: normalizedRideType,
        status: booking.status,
        otp,
        estimatedDistance,
        estimatedPrice: planPricing.estimatedPrice,
        finalPrice: planPricing.finalPrice,
        pricingPlan: quotePayload.activePlan,
        planComparison: quotePayload.comparison,
        upgradePrompt: quotePayload.recommendUpgrade,
        invoice: buildInvoiceSummary(booking),
        driver: assignedDriver ? buildDriverSummary(assignedDriver) : null,
        nearestDriverDistanceKm: nearestDriverMatch ? Number(nearestDriverMatch.distanceKm.toFixed(2)) : null,
        eligibleDriversForPlan: availableDrivers.length,
        totalAvailableDrivers: availableDriversRaw.length,
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
