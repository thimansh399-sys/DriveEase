function logEvent(event, payload = {}) {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };

  try {
    console.log(JSON.stringify(entry));
  } catch (_) {
    console.log(`[audit] ${event}`);
  }
}

function logBookingEvent(event, booking, extra = {}) {
  logEvent(event, {
    bookingId: booking?.bookingId || null,
    bookingDbId: booking?._id ? String(booking._id) : null,
    status: booking?.status || null,
    driverId: booking?.driverId ? String(booking.driverId) : null,
    customerId: booking?.customerId ? String(booking.customerId) : null,
    ...extra,
  });
}

module.exports = {
  logEvent,
  logBookingEvent,
};
