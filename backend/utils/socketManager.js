const { Server } = require('socket.io');

let ioInstance = null;

function initSocket(server, allowedOrigins = []) {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('CORS origin not allowed for socket'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    const queryBookingId = String(socket.handshake?.query?.bookingId || '').trim();
    const queryDriverId = String(socket.handshake?.query?.driverId || '').trim();
    if (queryBookingId) {
      socket.join(queryBookingId);
    }
    if (queryDriverId) {
      socket.join(`driver:${queryDriverId}`);
    }

    socket.on('join_booking_room', (payload = {}) => {
      const bookingId = String(payload.bookingId || '').trim();
      if (!bookingId) {
        return;
      }
      socket.join(bookingId);
      socket.emit('room_joined', { bookingId });
    });

    socket.on('join_driver_room', (payload = {}) => {
      const driverId = String(payload.driverId || '').trim();
      if (!driverId) {
        return;
      }
      const room = `driver:${driverId}`;
      socket.join(room);
      socket.emit('driver_room_joined', { driverId });
    });

    socket.on('driver_location_update', (payload = {}) => {
      const bookingId = String(payload.bookingId || '').trim();
      const latitude = Number(payload.latitude);
      const longitude = Number(payload.longitude);

      if (!bookingId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      const eventPayload = {
        bookingId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      };

      ioInstance.to(bookingId).emit('driver_location_update', eventPayload);
      ioInstance.to(bookingId).emit('location_update', eventPayload);
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = {
  initSocket,
  getIO,
};
