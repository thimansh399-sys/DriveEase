const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');

exports.getAllDriverRegistrations = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    const registrations = await Driver.find(filter)
      .select('-documents.aadhar.file -documents.pancard.file -documents.drivingLicense.file -documents.selfie.file')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        'backgroundVerification.status': 'verified',
        'backgroundVerification.verificationDate': new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ message: 'Driver approved', driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectDriver = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        'backgroundVerification.status': 'failed',
        'backgroundVerification.verificationDetails': reason,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ message: 'Driver rejected', driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        status: 'blocked',
        isOnline: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ message: 'Driver removed from platform', driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { status, customerId, driverId } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (driverId) filter.driverId = driverId;

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name phone email')
      .populate('driverId', 'name phone profilePicture vehicle')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-savedAddresses.file')
      .sort({ createdAt: -1 });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalDrivers = await Driver.countDocuments({ status: 'approved' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalBookings = await Booking.countDocuments({});
    const totalEarnings = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$finalPrice' } } }
    ]);

    const onlineDrivers = await Driver.countDocuments({ isOnline: true });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });

    res.json({
      totalDrivers,
      totalCustomers,
      totalBookings,
      totalEarnings: totalEarnings[0]?.total || 0,
      onlineDrivers,
      pendingBookings,
      completedBookings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendEnquiryResponse = async (req, res) => {
  try {
    const { adminResponse } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      {
        adminResponse,
        adminResponseDate: new Date(),
        status: 'resolved',
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ message: 'Response sent', enquiry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({})
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });

    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDriverDetails = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportBookingsToExcel = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone');

    // Convert to CSV format
    const csv = [
      ['Booking ID', 'Customer', 'Driver', 'Pickup', 'Drop', 'Status', 'Amount', 'Date']
    ];

    bookings.forEach(b => {
      csv.push([
        b.bookingId,
        b.customerId.name,
        b.driverId?.name || 'Unassigned',
        b.pickupLocation.address,
        b.dropLocation.address,
        b.status,
        b.finalPrice,
        b.createdAt
      ]);
    });

    const csvContent = csv.map(row => row.join(',')).join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=bookings.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
