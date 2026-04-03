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
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    query: bookingId ? { bookingId: String(bookingId) } : {},
  });

  if (bookingId) {
    socket.emit('join_booking_room', { bookingId: String(bookingId) });
  }

  return socket;
}
