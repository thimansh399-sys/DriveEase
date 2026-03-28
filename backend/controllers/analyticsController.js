const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');

// Get dashboard summary stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Total bookings
    const totalBookings = await Booking.countDocuments(filter);

    // Completed bookings
    const completedBookings = await Booking.countDocuments({
      ...filter,
      status: 'completed',
    });

    // Cancelled bookings
    const cancelledBookings = await Booking.countDocuments({
      ...filter,
      status: 'cancelled',
    });

    // Total revenue
    const revenueData = await Booking.aggregate([
      { $match: { ...filter, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$estimatedFare' },
          avgFare: { $avg: '$estimatedFare' },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const avgFare = revenueData[0]?.avgFare || 0;

    // Active drivers
    const activeDrivers = await Driver.countDocuments({ isVerified: true });

    // Active customers
    const activeCustomers = await User.countDocuments({ role: 'customer' });

    // Cancellation rate
    const cancellationRate =
      totalBookings > 0
        ? ((cancelledBookings / totalBookings) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      stats: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: Math.round(totalRevenue),
        avgFare: Math.round(avgFare),
        activeDrivers,
        activeCustomers,
        cancellationRate: parseFloat(cancellationRate),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Get rides over time (daily/weekly/monthly)
exports.getRidesTrend = async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let groupFormat;
    if (period === 'daily') {
      groupFormat = {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
      };
    } else if (period === 'weekly') {
      groupFormat = {
        $week: '$createdAt',
      };
    } else {
      groupFormat = {
        $month: '$createdAt',
      };
    }

    const trend = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupFormat,
          totalRides: { $sum: 1 },
          completedRides: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledRides: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$estimatedFare', 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      period,
      trend,
    });
  } catch (error) {
    console.error('Error fetching ride trend:', error);
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
};

// Get top drivers
exports.getTopDrivers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topDrivers = await Booking.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: '$driverId',
          totalRides: { $sum: 1 },
          totalEarnings: { $sum: '$estimatedFare' },
          avgRating: { $avg: '$driverRating' },
        },
      },
      {
        $sort: { totalRides: -1 },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: '_id',
          as: 'driverInfo',
        },
      },
    ]);

    res.json({
      success: true,
      drivers: topDrivers,
    });
  } catch (error) {
    console.error('Error fetching top drivers:', error);
    res.status(500).json({ error: 'Failed to fetch top drivers' });
  }
};

// Get bookings by ride type
exports.getBookingsByType = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const byType = await Booking.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: '$rideType',
          count: { $sum: 1 },
          revenue: { $sum: '$estimatedFare' },
        },
      },
    ]);

    res.json({
      success: true,
      byType,
    });
  } catch (error) {
    console.error('Error fetching bookings by type:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Get peak hours
exports.getPeakHours = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const peakHours = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          avgFare: { $avg: '$estimatedFare' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      peakHours: peakHours.map((item) => ({
        hour: item._id,
        bookings: item.count,
        avgFare: Math.round(item.avgFare),
      })),
    });
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    res.status(500).json({ error: 'Failed to fetch peak hours' });
  }
};

// Get payment method breakdown
exports.getPaymentMethods = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const paymentBreakdown = await Booking.aggregate([
      {
        $match: { ...filter, status: 'completed' },
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$estimatedFare' },
        },
      },
    ]);

    res.json({
      success: true,
      paymentMethods: paymentBreakdown,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

// Get driver ratings distribution
exports.getDriverRatings = async (req, res) => {
  try {
    const ratings = await Booking.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: { $round: ['$driverRating'] },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      ratingDistribution: ratings,
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};
