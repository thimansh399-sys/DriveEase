import React from 'react';

function Insurance() {
  return (
    <div style={{ color: '#fff', background: '#101820', minHeight: '100vh', padding: '60px 0', textAlign: 'center' }}>
      <h1 style={{ color: '#16a34a', fontWeight: 800 }}>DriveEase Insurance Plans</h1>
      <p style={{ fontSize: 20, margin: '24px 0' }}>Protect your ride with our affordable insurance options. Instant help in case of emergency.</p>
      <div style={{ margin: '40px auto', maxWidth: 600, background: '#18232e', borderRadius: 12, padding: 32 }}>
        <h2 style={{ color: '#fff', fontWeight: 700 }}>Per-Ride Insurance</h2>
        <p style={{ color: '#b6f5d8' }}>₹49 per ride — covers accidental damage, medical, and ambulance support.</p>
        <button style={{ background: '#16a34a', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: 8, border: 'none', marginTop: 18 }}>Get Insurance</button>
      </div>
      <div style={{ marginTop: 40, color: '#b6f5d8' }}>
        <b>Helpline:</b> <a href="tel:+917836887228" style={{ color: '#16a34a', textDecoration: 'none' }}>+91-7836887228</a>
      </div>
    </div>
  );
}

export default Insurance;
