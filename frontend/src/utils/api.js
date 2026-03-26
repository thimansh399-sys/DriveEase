const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  // Auth
  sendOTP: (phone, role = 'customer') =>
    fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role })
    }).then(r => r.json()),

  verifyOTP: (phone, otp, name, role) =>
    fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name, role })
    }).then(r => r.json()),

  adminLogin: (password) =>
    fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    }).then(r => r.json()),

  // Drivers
  getAllDrivers: (query = '') =>
    fetch(`${API_BASE_URL}/drivers/all${query}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  getNearbyDrivers: (latitude, longitude, city, radius = 10) =>
    fetch(`${API_BASE_URL}/drivers/nearby?latitude=${latitude}&longitude=${longitude}&city=${city}&radius=${radius}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  getDriverById: (id) =>
    fetch(`${API_BASE_URL}/drivers/${id}`).then(r => r.json()),

  updateDriverStatus: (data) =>
    fetch(`${API_BASE_URL}/drivers/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  updateProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return fetch(`${API_BASE_URL}/drivers/profile-picture`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    }).then(r => r.json());
  },

  updateDriverProfile: (data) =>
    fetch(`${API_BASE_URL}/drivers/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  getDriverEarnings: () =>
    fetch(`${API_BASE_URL}/drivers/earnings/me`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  registerDriver: (data) =>
    fetch(`${API_BASE_URL}/drivers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Bookings
  createBooking: (data) =>
    fetch(`${API_BASE_URL}/bookings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  getMyBookings: () =>
    fetch(`${API_BASE_URL}/bookings/customer`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  getBookingById: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  confirmBooking: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}/confirm`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  cancelBooking: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  triggerSOS: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}/sos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  getDriverBookings: () =>
    fetch(`${API_BASE_URL}/bookings/driver/my-bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  respondToBooking: (id, action) =>
    fetch(`${API_BASE_URL}/bookings/${id}/driver-respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ action })
    }).then(r => r.json()),

  // Admin
  getAdminStats: () =>
    fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  getAllBookings: () =>
    fetch(`${API_BASE_URL}/admin/bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  approveDriver: (id) =>
    fetch(`${API_BASE_URL}/admin/drivers/${id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  rejectDriver: (id, reason) =>
    fetch(`${API_BASE_URL}/admin/drivers/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reason })
    }).then(r => r.json()),

  removeDriver: (id) =>
    fetch(`${API_BASE_URL}/admin/drivers/${id}/remove`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  getDriverRegistrations: (status) =>
    fetch(`${API_BASE_URL}/admin/drivers/registrations?status=${status}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  exportBookingsToExcel: () =>
    fetch(`${API_BASE_URL}/admin/export/bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.blob())
};

export default api;
