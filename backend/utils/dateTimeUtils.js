// Utility functions for date/time handling in IST (Indian Standard Time)

/**
 * Convert any date to IST formatted string
 * @param {Date} date - JavaScript Date object
 * @returns {String} - Formatted date in DD-MM-YYYY HH:mm:ss IST format
 */
function getISTDateTime(date) {
  if (!date) return null;
  
  const istDate = new Date(date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const year = istDate.getFullYear();
  
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} IST`;
}

/**
 * Get current time in IST
 * @returns {String} - Current time in DD-MM-YYYY HH:mm:ss IST format
 */
function getCurrentISTDateTime() {
  return getISTDateTime(new Date());
}

/**
 * Get current date in IST (date only)
 * @returns {String} - Current date in DD-MM-YYYY format
 */
function getCurrentISTDate() {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const year = istDate.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Format date as time string for display
 * @param {Date} date - JavaScript Date object
 * @returns {String} - Time in HH:mm:ss format
 */
function getTimeOnly(date) {
  if (!date) return null;
  
  const istDate = new Date(date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Check if current time is within night surcharge window (10 PM - 6 AM)
 * @param {Date} date - Date to check (default: now)
 * @returns {Boolean}
 */
function isNightSurchargeTime(date = new Date()) {
  const istDate = new Date(date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  const hours = istDate.getHours();
  
  return hours >= 22 || hours < 6; // 10 PM to 6 AM
}

/**
 * Get duration in readable format (e.g., "2 hours 30 minutes")
 * @param {Date} startTime - Start datetime
 * @param {Date} endTime - End datetime
 * @returns {String}
 */
function getFormattedDuration(startTime, endTime) {
  const diff = endTime - startTime;
  const totalSeconds = Math.floor(diff / 1000);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  let parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  
  return parts.join(' ');
}

/**
 * Check if date is today in IST
 * @param {Date} date - Date to check
 * @returns {Boolean}
 */
function isToday(date) {
  const istDate = new Date(date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  const today = new Date(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  return istDate.getDate() === today.getDate() &&
         istDate.getMonth() === today.getMonth() &&
         istDate.getFullYear() === today.getFullYear();
}

module.exports = {
  getISTDateTime,
  getCurrentISTDateTime,
  getCurrentISTDate,
  getTimeOnly,
  isNightSurchargeTime,
  getFormattedDuration,
  isToday
};
