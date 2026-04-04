import { io } from 'socket.io-client';

function getSocketBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const envApi = String(process.env.REACT_APP_API_URL || '').trim();
  if (envApi) {
    try {
      return new URL(envApi).origin;
    } catch (_) {
      return window.location.origin;
    }
  }

  return window.location.origin;
}

export function connectRideSocket(bookingId) {
  const socket = io(getSocketBaseUrl(), {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 30,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 12000,
    randomizationFactor: 0.5,
    timeout: 10000,
    query: bookingId ? { bookingId: String(bookingId) } : {},
  });

  let forcedPolling = false;

  socket.on('connect_error', () => {
    if (!forcedPolling) {
      forcedPolling = true;
      socket.io.opts.transports = ['polling'];
      socket.connect();
    }
  });

  socket.on('reconnect_attempt', (attempt) => {
    if (attempt >= 5) {
      socket.io.opts.transports = ['polling'];
    }
  });

  if (bookingId) {
    socket.emit('join_booking_room', { bookingId: String(bookingId) });
  }

  return socket;
}
