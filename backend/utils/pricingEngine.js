/**
 * Pricing calculation engine for DriveEase
 * Implements distance-based and tiered pricing models
 */

const axios = require('axios');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - Starting latitude
 * @param {Number} lon1 - Starting longitude
 * @param {Number} lat2 - Ending latitude
 * @param {Number} lon2 - Ending longitude
 * @returns {Number} - Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Get road distance from Google Maps Distance Matrix API
 * @param {Object} pickup - { latitude, longitude }
 * @param {Object} dropoff - { latitude, longitude }
 * @returns {Promise<Object>} - { distance: Number (km), duration: Number (seconds) }
 */
async function getRoadDistance(pickup, dropoff) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured, using Haversine estimate');
      const distance = calculateHaversineDistance(
        pickup.latitude, pickup.longitude,
        dropoff.latitude, dropoff.longitude
      );
      return { distance, duration: Math.floor(distance * 2 * 60) }; // Rough estimate
    }
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
    
    const response = await axios.get(url, {
      params: {
        origins: `${pickup.latitude},${pickup.longitude}`,
        destinations: `${dropoff.latitude},${dropoff.longitude}`,
        key: apiKey,
        units: 'metric'
      }
    });
    
    if (response.data.rows[0].elements[0].status === 'OK') {
      const element = response.data.rows[0].elements[0];
      return {
        distance: element.distance.value / 1000, // Convert meters to kilometers
        duration: element.duration.value // Duration in seconds
      };
    }
    
    // Fallback to Haversine if API fails
    const distance = calculateHaversineDistance(
      pickup.latitude, pickup.longitude,
      dropoff.latitude, dropoff.longitude
    );
    return { distance, duration: Math.floor(distance * 2 * 60) };
  } catch (error) {
    console.error('Error fetching road distance:', error.message);
    
    // Fallback to Haversine
    const distance = calculateHaversineDistance(
      pickup.latitude, pickup.longitude,
      dropoff.latitude, dropoff.longitude
    );
    return { distance, duration: Math.floor(distance * 2 * 60) };
  }
}

/**
 * Core pricing formula: Cost = Base Fare + (Rate per KM × Distance)
 * @param {Number} distance - Distance in kilometers
 * @param {Object} pricingConfig - {baseFare, ratePerKm, minFare, nightSurcharge}
 * @returns {Number} - Calculated price
 */
function calculateBaseFare(distance, pricingConfig) {
  const { baseFare = 50, ratePerKm = 10, minFare = 0 } = pricingConfig;
  
  const calculatedPrice = baseFare + (ratePerKm * distance);
  
  // Apply minimum fare if configured
  return Math.max(calculatedPrice, minFare);
}

/**
 * Calculate tiered pricing based on distance brackets
 * @param {Number} distance - Distance in kilometers
 * @returns {Number} - Calculated price based on tiers
 */
function calculateTieredPrice(distance) {
  // Default tiered pricing (can be made configurable)
  if (distance <= 5) {
    return 99; // Flat rate for short trips (protection)
  } else if (distance <= 20) {
    return 99 + (distance - 5) * 12; // ₹12 per km for mid-range
  } else {
    return 99 + (15 * 12) + (distance - 20) * 10; // ₹10 per km for long distance
  }
}

/**
 * Calculate hourly rate pricing
 * @param {Number} hours - Number of hours
 * @param {Number} hourlyRate - Rate per hour (default: ₹100/hour)
 * @returns {Number}
 */
function calculateHourlyPrice(hours, hourlyRate = 100) {
  return hours * hourlyRate;
}

/**
 * Calculate daily rate pricing
 * @param {Number} days - Number of days
 * @param {Number} dailyRate - Rate per day (default: ₹800/day for 8-hour casual)
 * @returns {Number}
 */
function calculateDailyPrice(days, dailyRate = 800) {
  return days * dailyRate;
}

/**
 * Calculate subscription pricing
 * @param {String} planName - Plan name: 'hourly_8h', 'daily_8h', etc.
 * @param {Number} months - Number of months
 * @returns {Number}
 */
function calculateSubscriptionPrice(planName, months = 1) {
  const plans = {
    'hourly_8h': 24000, // Monthly
    'daily_8h': 24000,
    'senior_care': 25000,
    'family_plan': 30000
  };
  
  const monthlyRate = plans[planName] || 24000;
  return monthlyRate * months;
}

/**
 * Apply surcharges based on time/conditions
 * @param {Number} basePrice - Base calculated price
 * @param {Object} surchargeConfig - {nightSurchargePercent, peakHourPercent, insurancePercent}
 * @param {Date} bookingTime - Time of booking
 * @param {Boolean} insuranceOpted - Whether insurance is opted
 * @returns {Object} - {finalPrice, breakdown}
 */
function applySurcharges(basePrice, surchargeConfig, bookingTime, insuranceOpted = false) {
  const {
    nightSurchargePercent = 20,
    peakHourPercent = 10,
    insurancePercent = 5
  } = surchargeConfig;
  
  let breakdown = {
    basePrice,
    surcharges: {}
  };
  
  let totalSurcharge = 0;
  
  // Night surcharge (10 PM to 6 AM)
  const hours = new Date(bookingTime).getHours();
  if (hours >= 22 || hours < 6) {
    const nightSurcharge = (basePrice * nightSurchargePercent) / 100;
    breakdown.surcharges.nightSurcharge = nightSurcharge;
    totalSurcharge += nightSurcharge;
  }
  
  // Peak hour surcharge (8-9 AM, 5-6 PM)
  if ((hours >= 8 && hours < 9) || (hours >= 17 && hours < 18)) {
    const peakSurcharge = (basePrice * peakHourPercent) / 100;
    breakdown.surcharges.peakHourSurcharge = peakSurcharge;
    totalSurcharge += peakSurcharge;
  }
  
  // Insurance add-on
  if (insuranceOpted) {
    const insuranceCost = (basePrice * insurancePercent) / 100;
    breakdown.surcharges.insurance = insuranceCost;
    totalSurcharge += insuranceCost;
  }
  
  const finalPrice = basePrice + totalSurcharge;
  breakdown.totalSurcharge = totalSurcharge;
  breakdown.finalPrice = Math.round(finalPrice);
  
  return breakdown;
}

/**
 * Calculate complete booking price (main entry point)
 * @param {Object} bookingData - {pickup, dropoff, bookingType, pricingConfig, surchargeConfig, insuranceOpted}
 * @returns {Promise<Object>} - {estimatedPrice, distance, duration, breakdown}
 */
async function calculateBookingPrice(bookingData) {
  const {
    pickup,
    dropoff,
    bookingType = 'daily',
    hours = 8,
    days = 1,
    pricingConfig = {},
    surchargeConfig = {},
    insuranceOpted = false
  } = bookingData;
  
  let basePrice = 0;
  let distanceInfo = { distance: 0, duration: 0 };
  
  // Get road distance if it's a distance-based booking
  if (bookingType === 'daily' || bookingType === 'hourly') {
    if (pickup && dropoff && pickup.latitude && dropoff.latitude) {
      distanceInfo = await getRoadDistance(pickup, dropoff);
    }
  }
  
  // Calculate base price based on booking type
  switch (bookingType) {
    case 'hourly':
      basePrice = calculateHourlyPrice(hours, pricingConfig.hourlyRate);
      break;
    case 'daily':
      if (distanceInfo.distance > 0) {
        basePrice = calculateBaseFare(distanceInfo.distance, pricingConfig);
      } else {
        basePrice = calculateDailyPrice(days, pricingConfig.dailyRate);
      }
      break;
    case 'outstation':
      if (distanceInfo.distance > 0) {
        basePrice = calculateTieredPrice(distanceInfo.distance);
      }
      break;
    case 'subscription':
      basePrice = calculateSubscriptionPrice(pricingConfig.planName, days);
      break;
  }
  
  // Apply surcharges
  const priceBreakdown = applySurcharges(
    basePrice,
    surchargeConfig,
    new Date(),
    insuranceOpted
  );
  
  return {
    estimatedPrice: priceBreakdown.finalPrice,
    distance: distanceInfo.distance,
    duration: distanceInfo.duration,
    breakdown: priceBreakdown
  };
}

/**
 * Fetch pricing configuration from the database
 * @returns {Promise<Object>} - Pricing configuration object
 */
async function fetchPricingConfig() {
  try {
    const response = await axios.get(`${process.env.API_BASE_URL}/admin/pricing-config`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pricing configuration:', error);
    return { baseFare: 50, ratePerKm: 10, minFare: 0, nightSurcharge: 1.2 }; // Default values
  }
}

/**
 * Save pricing configuration to the database
 * @param {Object} config - Pricing configuration object
 * @returns {Promise<Boolean>} - Success status
 */
async function savePricingConfig(config) {
  try {
    const response = await axios.post(`${process.env.API_BASE_URL}/admin/pricing-config`, config);
    return response.status === 200;
  } catch (error) {
    console.error('Error saving pricing configuration:', error);
    return false;
  }
}

module.exports = {
  calculateHaversineDistance,
  getRoadDistance,
  calculateBaseFare,
  calculateTieredPrice,
  calculateHourlyPrice,
  calculateDailyPrice,
  calculateSubscriptionPrice,
  applySurcharges,
  calculateBookingPrice,
  fetchPricingConfig,
  savePricingConfig
};
