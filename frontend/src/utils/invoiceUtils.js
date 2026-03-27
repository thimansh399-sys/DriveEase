export const getInvoiceHtml = (booking, role = 'customer') => {
  const bookingId = booking.bookingId || String(booking._id || '').slice(-6) || 'NA';
  const invoiceId = booking.invoice?.invoiceId || `INV-${bookingId}`;
  const total = Number(booking.invoice?.total || booking.finalPrice || booking.estimatedPrice || 0).toFixed(2);
  const subtotal = Number(booking.invoice?.subtotal || booking.estimatedPrice || 0).toFixed(2);
  const insurance = Number(booking.invoice?.insurance || booking.insurance?.amount || 0).toFixed(2);
  const paymentMethod = String(booking.invoice?.paymentMethod || booking.paymentMethod || 'upi').toUpperCase();
  const customerName = booking.customer?.name || booking.customerId?.name || 'Customer';
  const customerPhone = booking.customer?.phone || booking.customerId?.phone || '-';
  const driverName = booking.driver?.name || booking.driverId?.name || 'Driver';
  const routeStart = booking.pickupLocation?.address || 'Pickup';
  const routeEnd = booking.dropLocation?.address || 'Drop';
  const dateStr = new Date(booking.updatedAt || booking.startDate || booking.createdAt || Date.now()).toLocaleString('en-IN');
  const support = '+91-7836887228';
  const roleLine = role === 'driver' ? 'Driver earnings statement' : 'Customer trip invoice';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>DriveEase Invoice ${invoiceId}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px;color:#0f172a}
    .sheet{max-width:860px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:12px;overflow:hidden}
    .head{padding:24px;border-bottom:2px solid #22c55e;display:flex;justify-content:space-between;gap:16px}
    .brand{font-size:28px;font-weight:800;color:#16a34a}
    .meta{font-size:13px;color:#475569;line-height:1.6}
    .section{padding:18px 24px;border-bottom:1px solid #e5e7eb}
    .row{display:flex;justify-content:space-between;gap:12px;margin:8px 0}
    .label{color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em}
    .value{font-weight:700}
    .total{font-size:24px;color:#16a34a;font-weight:800}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .foot{padding:18px 24px;color:#475569;font-size:12px;background:#f8fafc}
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">DriveEase</div>
        <div class="meta">India's Personal Driver Network<br/>${roleLine}<br/>Support: ${support}</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>INVOICE:</strong> ${invoiceId}</div>
        <div><strong>Booking:</strong> ${bookingId}</div>
        <div>${dateStr}</div>
      </div>
    </div>

    <div class="section grid">
      <div>
        <div class="label">Customer</div>
        <div class="value">${customerName}</div>
        <div class="meta">${customerPhone}</div>
      </div>
      <div>
        <div class="label">Driver</div>
        <div class="value">${driverName}</div>
        <div class="meta">Verified DriveEase Partner</div>
      </div>
    </div>

    <div class="section">
      <div class="label">Route</div>
      <div class="row"><span>${routeStart}</span><span>to</span><span>${routeEnd}</span></div>
    </div>

    <div class="section">
      <div class="row"><span>Ride Charge</span><span>INR ${subtotal}</span></div>
      <div class="row"><span>Insurance Add-on</span><span>INR ${insurance}</span></div>
      <div class="row" style="border-top:2px solid #0f172a;padding-top:10px;margin-top:10px">
        <span class="value">Total Amount</span>
        <span class="total">INR ${total}</span>
      </div>
      <div class="meta" style="margin-top:8px">Payment via ${paymentMethod}</div>
    </div>

    <div class="foot">
      This is a computer-generated invoice. Thank you for choosing DriveEase. Drive Safe.
    </div>
  </div>
</body>
</html>`;
};

export const downloadInvoice = (booking, role = 'customer') => {
  const bookingId = booking.bookingId || String(booking._id || '').slice(-6) || 'booking';
  const invoiceId = booking.invoice?.invoiceId || `INV-${bookingId}`;
  const html = getInvoiceHtml(booking, role);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DriveEase-Invoice-${invoiceId}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
