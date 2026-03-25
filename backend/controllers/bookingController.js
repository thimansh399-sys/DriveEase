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
