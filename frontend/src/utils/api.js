import { API_BASE_URL, getApiCandidates } from './network';

const getAuthBaseUrls = () => {
  return getApiCandidates();
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (_) {
    return {};
  }
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const looksJson = contentType.includes('application/json');
  const data = looksJson ? await parseJsonSafe(response) : await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  if (!looksJson) {
    throw new Error('Backend API not reachable. Configure REACT_APP_API_URL or a working /api proxy.');
  }

  return data;
};

const postAuthWithFallback = async (path, payload) => {
  const bases = getAuthBaseUrls();
  let lastNetworkError = null;

  for (const base of bases) {
    try {
      const response = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(response);
      if (!response.ok) {
        return {
          error: data.error || `Request failed (${response.status})`
        };
      }

      return data;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  throw new Error(
    lastNetworkError?.message ||
    'Unable to connect to backend API. Check REACT_APP_API_URL or your deployed /api proxy.'
  );
};

export const api = {
  // Auth
  // sendOTP and verifyOTP removed for customer login (direct login now)

  getProfile: () =>
    requestJson(`${API_BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }),

  updateProfile: (payload) =>
    requestJson(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    }),

  adminLogin: (password) =>
    postAuthWithFallback('/auth/admin-login', { password }),

  directLogin: (payload) =>
    postAuthWithFallback('/auth/direct-login', payload),

  // Drivers
  getAllDrivers: (query = '') =>
    requestJson(`${API_BASE_URL}/drivers/all${query}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }),

  getNearbyDrivers: ({ latitude, longitude, city = '', state = '', area = '', pincode = '', radius = 25 } = {}) => {
    const params = new URLSearchParams();
    if (Number.isFinite(Number(latitude))) params.set('latitude', latitude);
    if (Number.isFinite(Number(longitude))) params.set('longitude', longitude);
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (area) params.set('area', area);
    if (pincode) params.set('pincode', pincode);
    params.set('radius', radius);

    return requestJson(`${API_BASE_URL}/drivers/nearby?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
  },

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

  bookRide: async (data) => {
    const response = await fetch(`${API_BASE_URL}/bookings/book-ride`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    const result = await parseJsonSafe(response);
    if (response.status === 404) {
      return {
        ...result,
        error: result.error || 'Booking endpoint not found. Verify the deployed backend is exposing /api/bookings/book-ride.'
      };
    }

    return result;
  },

  bookNow: async (data) => {
    const response = await fetch(`${API_BASE_URL}/bookings/book-now`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      return {
        ...result,
        error: result?.error || result?.message || `Request failed (${response.status})`
      };
    }

    return result;
  },

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

  markDriverArrived: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}/arrived`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(r => r.json()),

  startRideWithOTP: (id, otp) =>
    fetch(`${API_BASE_URL}/bookings/${id}/start`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ otp })
    }).then(r => r.json()),

  shareBookingOtp: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}/share-otp`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(r => r.json()),

  completeRide: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}/complete-ride`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(r => r.json()),

  addFeedback: (id, payload) =>
    fetch(`${API_BASE_URL}/bookings/${id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
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
    }).then(r => r.blob()),

  // Insurance
  addInsurance: (bookingId) =>
    fetch(`${API_BASE_URL}/ride/${bookingId}/add-insurance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(r => r.json()),

  addDriverInsurance: (bookingId) =>
    fetch(`${API_BASE_URL}/ride/${bookingId}/add-driver-insurance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(r => r.json()),

  suggestInsurance: (bookingId) =>
    fetch(`${API_BASE_URL}/ride/${bookingId}/suggest-insurance`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  getActiveRide: () =>
    fetch(`${API_BASE_URL}/ride/active`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()),

  getRideHistory: (page = 1) =>
    fetch(`${API_BASE_URL}/ride/history?page=${page}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json())
};

export default api;
