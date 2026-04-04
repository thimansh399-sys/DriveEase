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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const AUTH_RETRY_DELAYS_MS = [1200, 2500, 4500];
const WAKE_RETRY_DELAYS_MS = [0, 1200, 2500, 4500, 6500];

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
    for (let attempt = 0; attempt <= AUTH_RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await fetch(`${base}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await parseJsonSafe(response);
        if (!response.ok) {
          const message = String(data?.error || `Request failed (${response.status})`);

          if (/database unavailable/i.test(message)) {
            return { error: message };
          }

          // Render free/hibernate wake can briefly return transient 5xx.
          if ([502, 503, 504].includes(response.status) && attempt < AUTH_RETRY_DELAYS_MS.length) {
            await wait(AUTH_RETRY_DELAYS_MS[attempt]);
            continue;
          }

          return {
            error: message
          };
        }

        return data;
      } catch (error) {
        lastNetworkError = error;
        if (attempt < AUTH_RETRY_DELAYS_MS.length) {
          await wait(AUTH_RETRY_DELAYS_MS[attempt]);
          continue;
        }
      }
    }
  }

  throw new Error(
    lastNetworkError?.message ||
    'Unable to connect to backend API. Check REACT_APP_API_URL or your deployed /api proxy.'
  );
};

const warmBackend = async () => {
  const bases = getAuthBaseUrls();

  for (const base of bases) {
    for (let attempt = 0; attempt < WAKE_RETRY_DELAYS_MS.length; attempt += 1) {
      if (WAKE_RETRY_DELAYS_MS[attempt] > 0) {
        await wait(WAKE_RETRY_DELAYS_MS[attempt]);
      }

      try {
        const response = await fetch(`${base}/ready`, {
          method: 'GET'
        });

        if (response.ok) {
          return true;
        }
      } catch (_) {
        // Ignore transient wake-up failures; auth call will handle final error state.
      }
    }
  }

  return false;
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

  adminLogin: async (password) => {
    await warmBackend();
    return postAuthWithFallback('/auth/admin-login', { password });
  },

  directLogin: async (payload) => {
    await warmBackend();
    return postAuthWithFallback('/auth/direct-login', payload);
  },

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

  getDriverProfile: () =>
    fetch(`${API_BASE_URL}/drivers/me`, {
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

    registerCustomer: (payload) =>
      postAuthWithFallback('/auth/register-customer', payload),
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

  verifyRideOtp: async ({ bookingId, otp }) => {
    const response = await fetch(`${API_BASE_URL}/ride/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ bookingId, otp })
    });

    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error(result?.error || `Request failed (${response.status})`);
    }

    return result;
  },

  shareBookingOtp: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}/share-otp`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(r => r.json()),

  completeRide: (id) =>
    fetch(`${API_BASE_URL}/ride/${id}/end`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({})
    }).then(r => r.json()),

  updateRideLocation: (payload) =>
    fetch(`${API_BASE_URL}/ride/location/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    }).then(r => r.json()),

  trackRideByBooking: (bookingId) =>
    fetch(`${API_BASE_URL}/ride/${bookingId}/track`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

  // Admin — use separate adminToken to avoid conflicts with customer session
  getAdminStats: () =>
    fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => r.json()),

  getAllBookings: () =>
    fetch(`${API_BASE_URL}/admin/bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => r.json()),

  approveDriver: (id) =>
    fetch(`${API_BASE_URL}/admin/drivers/${id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => r.json()),

  rejectDriver: (id, reason) =>
    fetch(`${API_BASE_URL}/admin/drivers/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ reason })
    }).then(r => r.json()),

  removeDriver: (id) =>
    fetch(`${API_BASE_URL}/admin/drivers/${id}/remove`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => r.json()),

  getDriverRegistrations: (status) =>
    fetch(`${API_BASE_URL}/admin/drivers/registrations?status=${status}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => r.json()),

  exportBookingsToExcel: () =>
    fetch(`${API_BASE_URL}/admin/export/bookings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => r.blob()),

  resolveTicket: (ticketId) =>
    fetch(`${API_BASE_URL}/support-tickets/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => r.json()),

  updateTicketStatus: (ticketId, status) =>
    fetch(`${API_BASE_URL}/support-tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ status })
    }).then(r => r.json()),

  getAssignmentSettings: () =>
    fetch(`${API_BASE_URL}/admin/settings/assignment`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => r.json()),

  updateAssignmentSettings: (payload) =>
    fetch(`${API_BASE_URL}/admin/settings/assignment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(payload)
    }).then(r => r.json()),

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
