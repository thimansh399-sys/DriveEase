const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { getCurrentISTDateTime, getISTDateTime } = require('../utils/dateTimeUtils');

/**
 * Get comprehensive admin dashboard data
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get all stats in parallel
    const [
      totalDrivers,
      approvedDrivers,
      pendingDrivers,
      totalCustomers,
      totalBookings,
      completedBookings,
      pendingBookings,
      totalRevenue,
      onlineDrivers
    ] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ status: 'approved' }),
      Driver.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'customer' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
      Booking.aggregate([
        { $match: { status: 'completed', paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } }
      ]),
      Driver.countDocuments({ isOnline: true })
    ]);

    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setDate(1))
          }
        }
      },
      {
        $group: {
          _id: null,
          bookings: { $sum: 1 },
          revenue: { $sum: '$finalPrice' }
        }
      }
    ]);

    res.json({
      success: true,
      timestamp: getCurrentISTDateTime(),
      stats: {
        drivers: {
          total: totalDrivers,
          approved: approvedDrivers,
          pending: pendingDrivers,
          online: onlineDrivers,
          offline: approvedDrivers - onlineDrivers
        },
        customers: {
          total: totalCustomers
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
          thisMonth: monthlyStats[0]?.bookings || 0
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: monthlyStats[0]?.revenue || 0
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all pending driver registrations for verification
 */
exports.getPendingRegistrations = async (req, res) => {
  try {
    const { sortBy = 'createdAt', order = -1 } = req.query;

    const pendingDrivers = await Driver.find({
      status: 'pending',
      'paymentVerification.status': 'pending'
    })
      .select('-documents.selfie.file -documents.aadhar.file')
      .sort({ [sortBy]: order })
      .lean();

    const formatted = pendingDrivers.map(driver => ({
      driverId: driver._id,
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      registeredAt: getISTDateTime(driver.createdAt),
      paymentStatus: driver.paymentVerification.status,
      screenshotUrl: driver.paymentVerification.screenshotUrl,
      submittedAt: getISTDateTime(driver.paymentVerification.screenshotSubmissionTime),
      waitTime: calculateWaitTime(driver.paymentVerification.screenshotSubmissionTime),
      documents: {
        aadhar: driver.documents?.aadhar?.verified,
        license: driver.documents?.drivingLicense?.verified,
        selfie: driver.documents?.selfie?.verified
      },
      vehicle: driver.vehicle,
      adminNotes: driver.paymentVerification.adminNotes
    }));

    res.json({
      success: true,
      count: formatted.length,
      registrations: formatted
    });

  } catch (error) {
    console.error('Pending registrations error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve driver payment verification
 */
exports.approveDriverPayment = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { adminNotes } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Update payment verification
    driver.paymentVerification.status = 'verified';
    driver.paymentVerification.verificationTime = new Date();
    driver.paymentVerification.adminNotes = adminNotes || 'Approved by admin';
    driver.status = 'approved'; // Auto-approve driver after payment

    const updatedDriver = await driver.save();

    res.json({
      success: true,
      message: 'Driver payment verified and approved',
      driverId: updatedDriver._id,
      status: updatedDriver.status,
      verifiedAt: getCurrentISTDateTime()
    });

  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reject driver payment verification
 */
exports.rejectDriverPayment = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason required' });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.paymentVerification.status = 'rejected';
    driver.paymentVerification.adminNotes = reason;
    driver.status = 'rejected';

    const updatedDriver = await driver.save();

    res.json({
      success: true,
      message: 'Payment verification rejected',
      driverId: updatedDriver._id,
      rejectionReason: reason,
      rejectedAt: getCurrentISTDateTime()
    });

  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get live bookings (pending, confirmed, in-progress)
 */
exports.getLiveBookings = async (req, res) => {
  try {
    const { status, city } = req.query;

    let filter = {
      status: { $in: ['pending', 'confirmed', 'driver_assigned', 'in_progress'] }
    };

    if (status) filter.status = status;
    if (city) filter['pickupLocation.city'] = city;

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone currentLocation')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = bookings.map(booking => ({
      bookingId: booking._id,
      rideId: booking.bookingId,
      customer: booking.customerId?.name || 'Unknown',
      driver: booking.driverId?.name || 'Unassigned',
      pickupCity: booking.pickupLocation?.city,
      pickupAddress: booking.pickupLocation?.address,
      dropAddress: booking.dropLocation?.address,
      bookingType: booking.bookingType,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      estimatedPrice: booking.estimatedPrice,
      finalPrice: booking.finalPrice,
      otpVerified: booking.verification?.otpVerified,
      createdAt: booking.timestamps?.bookingCreatedIST,
      rideStartTime: booking.timestamps?.rideStartIST,
      distance: booking.estimatedDistance
    }));

    res.json({
      success: true,
      count: formatted.length,
      bookings: formatted
    });

  } catch (error) {
    console.error('Live bookings error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get detailed booking information
 */
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name phone email')
      .populate('driverId', 'name phone rating vehicle');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: {
        bookingId: booking._id,
        rideId: booking.bookingId,
        customer: booking.customerId,
        driver: booking.driverId,
        pickup: booking.pickupLocation,
        dropoff: booking.dropLocation,
        bookingType: booking.bookingType,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        estimatedPrice: booking.estimatedPrice,
        finalPrice: booking.finalPrice,
        distance: booking.estimatedDistance,
        duration: booking.totalHours,
        verification: {
          otpGenerated: booking.verification?.otpGenerated,
          otpVerified: booking.verification?.otpVerified,
          otpVerificationTime: booking.verification?.otpVerificationTime
        },
        timestamps: booking.timestamps,
        rideCompletion: booking.rideCompletion,
        feedback: booking.feedback
      }
    });

  } catch (error) {
    console.error('Booking details error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get driver status and location (live tracking)
 */
exports.getDriversLiveStatus = async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'approved' })
      .select('name phone isOnline currentLocation onlineStatus experience.totalRides')
      .lean();

    const formatted = drivers.map(driver => ({
      driverId: driver._id,
      name: driver.name,
      phone: driver.phone,
      isOnline: driver.isOnline,
      location: driver.currentLocation,
      totalRides: driver.experience?.totalRides || 0,
      onlineHours: driver.onlineStatus?.totalOnlineHoursThisMonth || 0,
      lastLocationUpdate: driver.currentLocation?.lastUpdated
        ? getISTDateTime(driver.currentLocation.lastUpdated)
        : 'Never'
    }));

    res.json({
      success: true,
      count: formatted.length,
      drivers: formatted,
      timestamp: getCurrentISTDateTime()
    });

  } catch (error) {
    console.error('Drivers live status error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Bulk approve/reject registrations
 */
exports.bulkApproveRegistrations = async (req, res) => {
  try {
    const { driverIds, action, notes } = req.body;

    if (!Array.isArray(driverIds) || driverIds.length === 0) {
      return res.status(400).json({ error: 'Driver IDs array required' });
    }

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const updateData = action === 'approve'
      ? {
          'paymentVerification.status': 'verified',
          'paymentVerification.verificationTime': new Date(),
          'paymentVerification.adminNotes': notes || 'Bulk approved',
          status: 'approved'
        }
      : {
          'paymentVerification.status': 'rejected',
          'paymentVerification.adminNotes': notes || 'Bulk rejected',
          status: 'rejected'
        };

    const result = await Driver.updateMany(
      { _id: { $in: driverIds } },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} drivers ${action}ed`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get revenue analytics
 */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dailyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
          status: 'completed',
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$finalPrice' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const cityRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
          status: 'completed',
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: '$pickupLocation.city',
          revenue: { $sum: '$finalPrice' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      analytics: {
        dailyRevenue,
        cityRevenue,
        period: 'Last 30 Days'
      }
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper function to calculate wait time
 */
function calculateWaitTime(submittedTime) {
  if (!submittedTime) return 'Pending';
  
  const submitted = new Date(submittedTime);
  const deadline = new Date(submitted.getTime() + 30 * 60 * 1000); // +30 minutes
  const now = new Date();
  
  if (now > deadline) return 'Overdue';
  
  const remaining = Math.ceil((deadline - now) / (1000 * 60));
  return `${remaining}m remaining`;
}

module.exports = exports;
