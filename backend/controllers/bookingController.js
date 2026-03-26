const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { generateBookingId, calculateDistance, calculatePrice } = require('../utils/helpers');
const axios = require('axios');

const playNotificationSound = (soundUrl) => {
  const audio = new Audio(soundUrl);
  audio.play().catch((error) => console.error('Error playing notification sound:', error));
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

    res.status(201).json({
      message: 'Booking created',
      booking
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

exports.getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.user.id;
    const bookings = await Booking.find({ customerId })
      .populate('driverId', 'name phone profilePicture rating')
      .sort({ createdAt: -1 });

    res.json(bookings);
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

    res.json(booking);
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
    );

    res.json({ message: 'Booking status updated', booking });
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
    );

    res.json({ message: 'Booking confirmed', booking });
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

    // Validate required fields
    if (!driverId || !customerName || !customerPhone || !pickupAddress || !dropAddress || !bookingDate) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Validate phone
    if (!/^\d{10}$/.test(customerPhone)) {
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
    let customer = await User.findOne({ phone: customerPhone });
    if (!customer) {
      customer = new User({
        name: customerName,
        phone: customerPhone,
        role: 'customer',
        status: 'active'
      });
      await customer.save();
    }

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
      notes: notes || ''
    });

    await booking.save();

    // Update driver's total rides count
    await Driver.findByIdAndUpdate(driverId, {
      $inc: { 'experience.totalRides': 0 } // Don't increment until ride completes
    });

    // Send SMS notification to driver
    const smsMessage = `DriveEase: New booking! Customer: ${customerName}, Phone: ${customerPhone}, Pickup: ${pickupAddress}, Drop: ${dropAddress}, Date: ${new Date(bookingDate).toLocaleString('en-IN')}, Type: ${bookingType || 'daily'}, BookingID: ${bookingId}`;
    
    try {
      await sendSMSToDriver(driver.phone, smsMessage);
      console.log(`SMS sent to driver ${driver.name} (${driver.phone})`);
    } catch (smsErr) {
      console.error('SMS sending failed (booking still created):', smsErr.message);
    }

    res.status(201).json({
      message: 'Booking created successfully! Driver has been notified.',
      booking: {
        bookingId: booking.bookingId,
        driverName: driver.name,
        driverPhone: driver.phone,
        status: booking.status,
        estimatedPrice: booking.estimatedPrice,
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
    
    // Find driver by user id or direct driver id
    let driver = await Driver.findById(driverId);
    if (!driver) {
      driver = await Driver.findOne({ phone: req.user.phone });
    }
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const bookings = await Booking.find({ driverId: driver._id })
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept/Reject booking by driver
exports.driverRespondBooking = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const bookingId = req.params.id;
    
    const newStatus = action === 'accept' ? 'confirmed' : 'cancelled';
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: newStatus, updatedAt: new Date() },
      { new: true }
    ).populate('customerId', 'name phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Send SMS to customer about driver response
    if (booking.customerId?.phone) {
      const msg = action === 'accept'
        ? `DriveEase: Your booking ${booking.bookingId} has been ACCEPTED by the driver! They will arrive at your pickup location.`
        : `DriveEase: Your booking ${booking.bookingId} was declined. Please try another driver.`;
      
      try {
        await sendSMSToDriver(booking.customerId.phone, msg);
      } catch (e) {
        console.error('SMS to customer failed:', e.message);
      }
    }

    res.json({ message: `Booking ${action}ed`, booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
