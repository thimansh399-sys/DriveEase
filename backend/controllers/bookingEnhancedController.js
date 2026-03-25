const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');
const {
  generateOTP,
  generateRideId,
  verifyOTP,
  generateReceipt
} = require('../utils/verificationUtils');
const { calculateBookingPrice } = require('../utils/pricingEngine');
const { getISTDateTime, getCurrentISTDateTime } = require('../utils/dateTimeUtils');

/**
 * Create a new booking with price calculation
 */
exports.createBooking = async (req, res) => {
  try {
    const {
      customerId,
      driverId,
      pickupLocation,
      dropLocation,
      bookingType = 'daily',
      startDate,
      endDate,
      numberOfDays = 1,
      totalHours = 8,
      insuranceOpted = false,
      pricingConfig = {},
      surchargeConfig = {}
    } = req.body;

    // Validate required fields
    if (!customerId || !pickupLocation || !dropLocation) {
      return res.status(400).json({
        error: 'Missing required fields: customerId, pickupLocation, dropLocation'
      });
    }

    // Calculate price based on booking type and location
    let priceData = {
      pickup: {
        latitude: parseFloat(pickupLocation.latitude),
        longitude: parseFloat(pickupLocation.longitude)
      },
      dropoff: {
        latitude: parseFloat(dropLocation.latitude),
        longitude: parseFloat(dropLocation.longitude)
      },
      bookingType,
      hours: totalHours,
      days: numberOfDays,
      pricingConfig,
      surchargeConfig,
      insuranceOpted
    };

    const priceResult = await calculateBookingPrice(priceData);

    // Generate OTP for booking
    const bookingOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate ride ID
    const rideId = generateRideId(driverId || 'unassigned', customerId);

    // Create booking document
    const booking = new Booking({
      bookingId: rideId,
      customerId,
      driverId: driverId || null,
      pickupLocation: {
        ...pickupLocation,
        latitude: parseFloat(pickupLocation.latitude),
        longitude: parseFloat(pickupLocation.longitude)
      },
      dropLocation: {
        ...dropLocation,
        latitude: parseFloat(dropLocation.latitude),
        longitude: parseFloat(dropLocation.longitude)
      },
      bookingType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      numberOfDays,
      totalHours,
      estimatedDistance: priceResult.distance,
      estimatedPrice: priceResult.estimatedPrice,
      insuranceOpted,
      insuranceAmount: priceResult.breakdown.surcharges.insurance || 0,
      status: 'pending',
      paymentStatus: 'pending',
      verification: {
        otp: bookingOTP,
        otpGenerated: new Date(),
        otpExpiry: otpExpiry
      },
      timestamps: {
        bookingCreatedIST: getCurrentISTDateTime()
      }
    });

    const savedBooking = await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        bookingId: savedBooking._id,
        rideId: savedBooking.bookingId,
        estimatedPrice: savedBooking.estimatedPrice,
        distance: priceResult.distance.toFixed(2),
        duration: `${Math.ceil(priceResult.duration / 60)} minutes`,
        pickupLocation: savedBooking.pickupLocation,
        dropLocation: savedBooking.dropLocation,
        startDate: getISTDateTime(savedBooking.startDate),
        status: savedBooking.status,
        priceBreakdown: priceResult.breakdown
      },
      // Don't expose OTP in response - send via SMS/WhatsApp
      otpSent: true,
      otpDeliveryMethod: 'SMS/WhatsApp'
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verify OTP for ride start
 */
exports.verifyBookingOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp, driverId } = req.body;

    if (!bookingId || !otp) {
      return res.status(400).json({
        error: 'Booking ID and OTP required'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify OTP
    const otpVerification = verifyOTP(
      otp,
      booking.verification.otp,
      booking.verification.otpExpiry
    );

    if (!otpVerification.verified) {
      return res.status(400).json({
        success: false,
        error: otpVerification.message
      });
    }

    // Update booking status
    booking.verification.otpVerified = true;
    booking.verification.otpVerificationTime = new Date();
    booking.status = 'in_progress';
    booking.timestamps.rideStartIST = getCurrentISTDateTime();

    // Update driver's active ride
    if (driverId) {
      await Driver.findByIdAndUpdate(
        driverId,
        { lastUpdated: new Date() }
      );
    }

    const updatedBooking = await booking.save();

    res.json({
      success: true,
      message: 'OTP verified. Ride started successfully.',
      bookingId: updatedBooking._id,
      rideId: updatedBooking.bookingId,
      status: updatedBooking.status,
      rideStartTime: updatedBooking.timestamps.rideStartIST
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Complete booking and generate receipt
 */
exports.completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      actualDistance,
      actualDuration,
      finalPrice,
      paymentReceived = true
    } = req.body;

    const booking = await Booking.findById(bookingId).populate('customerId');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking completion details
    booking.status = 'completed';
    booking.rideCompletion = {
      actualStartTime: booking.createdAt,
      actualEndTime: new Date(),
      actualDistance: parseFloat(actualDistance) || booking.estimatedDistance,
      finalCalculatedPrice: parseFloat(finalPrice) || booking.estimatedPrice,
      paymentReceivedTime: paymentReceived ? new Date() : null,
      paymentVerified: paymentReceived
    };

    booking.finalPrice = finalPrice || booking.estimatedPrice;
    booking.paymentStatus = paymentReceived ? 'completed' : 'pending';
    booking.timestamps.rideEndIST = getCurrentISTDateTime();
    booking.timestamps.paymentReceivedIST = paymentReceived ? getCurrentISTDateTime() : null;

    const updatedBooking = await booking.save();

    // Generate receipt
    const receipt = generateReceipt({
      bookingId: updatedBooking._id,
      rideId: updatedBooking.bookingId,
      customerName: booking.customerId?.name || 'Customer',
      driverName: 'Driver Name', // Populate from driver data
      pickupLocation: updatedBooking.pickupLocation.address,
      dropLocation: updatedBooking.dropLocation.address,
      startTime: getISTDateTime(updatedBooking.createdAt),
      endTime: updatedBooking.timestamps.rideEndIST,
      distance: actualDistance || booking.estimatedDistance,
      baseFare: booking.estimatedPrice,
      surcharges: updatedBooking.insuranceAmount || 0,
      totalAmount: finalPrice || booking.estimatedPrice,
      paymentMethod: booking.paymentMethod
    });

    res.json({
      success: true,
      message: 'Booking completed successfully',
      booking: {
        bookingId: updatedBooking._id,
        rideId: updatedBooking.bookingId,
        status: updatedBooking.status,
        actualDistance: actualDistance || booking.estimatedDistance,
        finalPrice: finalPrice || booking.estimatedPrice,
        paymentStatus: updatedBooking.paymentStatus,
        rideEndTime: updatedBooking.timestamps.rideEndIST
      },
      receipt
    });

  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all bookings for a customer
 */
exports.getCustomerBookings = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query;

    let filter = { customerId };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('driverId', 'name phone profilePicture rating')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      bookingId: booking._id,
      rideId: booking.bookingId,
      driverId: booking.driverId,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      bookingType: booking.bookingType,
      startDate: getISTDateTime(booking.startDate),
      estimatedPrice: booking.estimatedPrice,
      finalPrice: booking.finalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      distance: booking.estimatedDistance,
      rating: booking.feedback?.rating || null,
      bookingCreatedAt: booking.timestamps.bookingCreatedIST,
      rideStartAt: booking.timestamps.rideStartIST,
      rideCompletedAt: booking.timestamps.rideEndIST
    }));

    res.json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all bookings for a driver
 */
exports.getDriverBookings = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.query;

    let filter = { driverId };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      bookingId: booking._id,
      rideId: booking.bookingId,
      customerId: booking.customerId,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      bookingType: booking.bookingType,
      startDate: getISTDateTime(booking.startDate),
      estimatedPrice: booking.estimatedPrice,
      finalPrice: booking.finalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      distance: booking.estimatedDistance,
      otp: booking.verification.otp, // Show OTP to driver for verification
      otpVerified: booking.verification.otpVerified,
      bookingCreatedAt: booking.timestamps.bookingCreatedIST,
      rideStartAt: booking.timestamps.rideStartIST
    }));

    res.json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('Get driver bookings error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resend OTP if needed
 */
exports.resendOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Generate new OTP
    const newOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    booking.verification.otp = newOTP;
    booking.verification.otpGenerated = new Date();
    booking.verification.otpExpiry = otpExpiry;

    await booking.save();

    res.json({
      success: true,
      message: 'New OTP sent successfully',
      bookingId,
      otpSent: true,
      expiresIn: '24 hours'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
