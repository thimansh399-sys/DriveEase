/**
 * 🧠 MASTER RIDE ALLOCATION ENGINE
 * Scores and selects the best driver for each ride request
 */

const Driver = require('../models/Driver');

// Plan score weights
const PLAN_SCORES = {
  ELITE: 50,
  GROWTH: 30,
  ZERO: 10,
};

// Daily ride limits per plan
const DAILY_LIMITS = {
  ZERO: 25,
  GROWTH: Infinity,
  ELITE: Infinity,
};

// Commission rates
const COMMISSION_RATES = {
  ZERO: 0.10,   // 10%
  GROWTH: 0.07, // 7%
  ELITE: 0.03,  // 3%
};

// Peak hour multipliers
const PEAK_MULTIPLIERS = {
  ZERO: 1.0,
  GROWTH: 1.3,
  ELITE: 1.5,
};

// Weekly bonus thresholds
const WEEKLY_BONUS = {
  ZERO: { threshold: Infinity, amount: 0 },
  GROWTH: { threshold: 50, amount: 200 },
  ELITE: { threshold: 50, amount: 500 },
};

/**
 * Haversine distance between two coordinates in km
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check if current time is peak hour (8-10 AM or 5-8 PM)
 */
function isPeakHour() {
  const hour = new Date().getHours();
  return (hour >= 8 && hour < 10) || (hour >= 17 && hour < 20);
}

/**
 * Step 1: Filter eligible drivers
 */
function filterEligibleDrivers(drivers, pickupLat, pickupLon, maxDistanceKm = 5) {
  return drivers.filter((driver) => {
    // Must be online
    if (!driver.isOnline) return false;

    // Must be approved
    if (driver.status !== 'approved' && driver.status !== 'online') return false;

    // Must have location
    if (!driver.currentLocation?.latitude || !driver.currentLocation?.longitude) return false;

    // Distance check
    const dist = getDistanceKm(
      pickupLat,
      pickupLon,
      driver.currentLocation.latitude,
      driver.currentLocation.longitude
    );
    if (dist > maxDistanceKm) return false;

    // Daily ride limit for ZERO plan
    const plan = driver.plan?.type || 'ZERO';
    const limit = DAILY_LIMITS[plan];
    if (driver.ridesToday >= limit) return false;

    return true;
  });
}

/**
 * Step 2: Calculate driver score
 */
function calculateDriverScore(driver, pickupLat, pickupLon) {
  let score = 0;
  const plan = driver.plan?.type || 'ZERO';

  // Plan weight (MOST IMPORTANT)
  score += PLAN_SCORES[plan] || 10;

  // Distance (closer = better)
  const distance = getDistanceKm(
    pickupLat,
    pickupLon,
    driver.currentLocation.latitude,
    driver.currentLocation.longitude
  );
  score += (5 - Math.min(distance, 5)) * 5;

  // Rating
  const rating = driver.rating?.averageRating || 0;
  score += rating * 4;

  // Acceptance rate
  const acceptanceRate = (driver.acceptanceRate || 100) / 100;
  score += acceptanceRate * 10;

  // Idle time (how long they've been waiting)
  const lastActive = driver.lastRideAt || driver.lastActiveAt || new Date();
  const idleMinutes = Math.min((Date.now() - new Date(lastActive).getTime()) / 60000, 60);
  score += idleMinutes * 2;

  return {
    score: Math.round(score * 10) / 10,
    distance: Math.round(distance * 10) / 10,
    breakdown: {
      planScore: PLAN_SCORES[plan] || 10,
      distanceScore: Math.round((5 - Math.min(distance, 5)) * 5 * 10) / 10,
      ratingScore: Math.round(rating * 4 * 10) / 10,
      acceptanceScore: Math.round(acceptanceRate * 10 * 10) / 10,
      idleScore: Math.round(idleMinutes * 2 * 10) / 10,
    },
  };
}

/**
 * Step 3: Find best driver
 */
async function findBestDriver(pickupLat, pickupLon, maxDistanceKm = 5) {
  const allDrivers = await Driver.find({
    isOnline: true,
    status: { $in: ['approved', 'online'] },
  });

  const eligible = filterEligibleDrivers(allDrivers, pickupLat, pickupLon, maxDistanceKm);

  if (eligible.length === 0) {
    return { success: false, message: 'No drivers available nearby' };
  }

  // Score each driver
  const scored = eligible.map((driver) => {
    const { score, distance, breakdown } = calculateDriverScore(driver, pickupLat, pickupLon);
    return {
      driver,
      score,
      distance,
      breakdown,
      plan: driver.plan?.type || 'ZERO',
    };
  });

  // Sort by highest score
  scored.sort((a, b) => b.score - a.score);

  return {
    success: true,
    bestDriver: scored[0],
    allScored: scored,
    totalEligible: eligible.length,
  };
}

/**
 * Calculate commission for a fare
 */
function calculateCommission(plan, fare, monthlyEarnings = 0) {
  const planType = plan || 'ZERO';

  if (planType === 'ZERO') {
    // Free until ₹2,000 monthly earnings
    if (monthlyEarnings < 2000) {
      return { commission: 0, driverEarning: fare, rate: 0 };
    }
    const commission = fare * COMMISSION_RATES.ZERO;
    return { commission, driverEarning: fare - commission, rate: COMMISSION_RATES.ZERO };
  }

  const rate = COMMISSION_RATES[planType] || 0.10;
  const commission = fare * rate;
  return { commission, driverEarning: fare - commission, rate };
}

/**
 * Calculate fare with peak hour boost
 */
function calculateFareWithBoost(baseFare, plan) {
  const planType = plan || 'ZERO';
  const multiplier = isPeakHour() ? (PEAK_MULTIPLIERS[planType] || 1.0) : 1.0;
  return {
    baseFare,
    multiplier,
    finalFare: Math.round(baseFare * multiplier),
    isPeak: isPeakHour(),
  };
}

/**
 * Check weekly bonus eligibility
 */
function checkWeeklyBonus(plan, weeklyRides) {
  const planType = plan || 'ZERO';
  const bonus = WEEKLY_BONUS[planType];
  if (weeklyRides >= bonus.threshold) {
    return { eligible: true, amount: bonus.amount };
  }
  return { eligible: false, amount: 0, remaining: bonus.threshold - weeklyRides };
}

/**
 * Check daily ride limit
 */
function checkDailyLimit(plan, ridesToday) {
  const planType = plan || 'ZERO';
  const limit = DAILY_LIMITS[planType];
  return {
    blocked: ridesToday >= limit,
    ridesToday,
    limit: limit === Infinity ? 'Unlimited' : limit,
    remaining: limit === Infinity ? 'Unlimited' : Math.max(0, limit - ridesToday),
  };
}

/**
 * Get plan upgrade suggestion
 */
function getUpgradeSuggestion(plan, monthlyEarnings, monthlyRides) {
  const planType = plan || 'ZERO';

  if (planType === 'ZERO' && monthlyEarnings > 5000) {
    return {
      suggest: true,
      from: 'ZERO',
      to: 'GROWTH',
      reason: `You've earned ₹${monthlyEarnings} this month! Upgrade to Growth Plan for lower commission & peak boosts 🚀`,
    };
  }

  if (planType === 'GROWTH' && monthlyRides > 100) {
    return {
      suggest: true,
      from: 'GROWTH',
      to: 'ELITE',
      reason: `${monthlyRides} rides this month! Join Elite Club for just 3% commission & highest priority 👑`,
    };
  }

  return { suggest: false };
}

/**
 * Check retention hook — inactive driver bonus
 */
function checkRetentionBonus(lastActiveAt) {
  if (!lastActiveAt) return { eligible: false };

  const daysSinceActive = (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActive > 3) {
    return {
      eligible: true,
      bonus: 100,
      inactiveDays: Math.floor(daysSinceActive),
      message: 'Come back & earn more! ₹100 bonus waiting for you 🎯',
    };
  }
  return { eligible: false, inactiveDays: Math.floor(daysSinceActive) };
}

/**
 * Check if Elite driver needs downgrade warning
 */
function checkEliteRatingWarning(plan, rating) {
  if ((plan || 'ZERO') === 'ELITE' && rating < 4.5) {
    return {
      warning: true,
      message: `Your rating is ${rating}★. Elite drivers must maintain 4.5★+. Improve to keep your Elite status!`,
    };
  }
  return { warning: false };
}

module.exports = {
  findBestDriver,
  filterEligibleDrivers,
  calculateDriverScore,
  calculateCommission,
  calculateFareWithBoost,
  checkWeeklyBonus,
  checkDailyLimit,
  getUpgradeSuggestion,
  checkRetentionBonus,
  checkEliteRatingWarning,
  isPeakHour,
  getDistanceKm,
  PLAN_SCORES,
  COMMISSION_RATES,
  PEAK_MULTIPLIERS,
  DAILY_LIMITS,
  WEEKLY_BONUS,
};
