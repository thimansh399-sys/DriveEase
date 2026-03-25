import React from 'react';

function Pay() {
  return (
    <div style={{ color: '#fff', background: '#101820', minHeight: '100vh', padding: '60px 0', textAlign: 'center' }}>
      <h1 style={{ color: '#16a34a', fontWeight: 800 }}>DriveEase Payment</h1>
      <p style={{ fontSize: 20, margin: '24px 0' }}>Pay securely for your bookings and subscriptions.</p>
      <div style={{ margin: '40px auto', maxWidth: 400, background: '#18232e', borderRadius: 12, padding: 32 }}>
        <h2 style={{ color: '#fff', fontWeight: 700 }}>Bank Transfer / UPI</h2>
        <div style={{ color: '#b6f5d8', margin: '16px 0' }}>
          <div><b>Account:</b> 922010062230782</div>
          <div><b>IFSC:</b> UTIB0004620</div>
          <div><b>Name:</b> Krishna Kant Pandey</div>
          <div><b>Bank:</b> Axis Bank</div>
        </div>
        <button style={{ background: '#16a34a', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: 8, border: 'none', marginTop: 18 }}>Copy Details</button>
      </div>
    </div>
  );
}

export default Pay;
