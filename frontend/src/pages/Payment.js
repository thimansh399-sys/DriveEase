import React from 'react';
import QRCode from 'qrcode.react';
import { useSearchParams } from 'react-router-dom';

function Payment() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId') || 'DE20260323000001';
  const amount = searchParams.get('amount') || '2500';

  const paymentDetails = {
    upi: '7836887228@okaxis',
    bank: {
      account: '922010062230782',
      ifsc: 'UTIB0004620',
      name: 'Krishna Kant Pandey',
      bank: 'Axis Bank'
    }
  };

  return (
    <div className="section">
      <h1 className="section-title">Complete Payment</h1>

      <div className="grid grid-2">
        {/* Payment Details */}
        <div className="card">
          <h3>Payment Summary</h3>
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p><strong>Booking ID:</strong> {bookingId}</p>
            <p><strong>Amount:</strong> <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>₹{amount}</span></p>
            <p style={{ fontSize: '14px', color: '#666', borderTop: '1px solid #e5e7eb', paddingTop: '10px', marginTop: '10px' }}>
              Please complete the payment to confirm your booking
            </p>
          </div>

          {/* Bank Transfer Info */}
          <h4>Bank Transfer</h4>
          <div style={{ fontSize: '14px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
            <p><strong>Account Holder:</strong> {paymentDetails.bank.name}</p>
            <p><strong>Account:</strong> {paymentDetails.bank.account}</p>
            <p><strong>IFSC:</strong> {paymentDetails.bank.ifsc}</p>
            <p><strong>Bank:</strong> {paymentDetails.bank.bank}</p>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>Reference: {bookingId}</p>
          </div>

          <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
            <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>
              ⚠️ Add Reference: {bookingId} for instant confirmation
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Quick Payment via UPI</h3>
          <div style={{
            backgroundColor: '#f0f0f0',
            padding: '30px',
            borderRadius: '8px',
            display: 'inline-block',
            marginBottom: '20px'
          }}>
            <QRCode value={`upi://pay?pa=${paymentDetails.upi}&pn=DRIVEEASE&am=${amount}&tn=${bookingId}`} size={300} />
          </div>
          <p style={{ fontSize: '14px', color: '#666' }}>Scan this QR code with any UPI app</p>
          <p style={{ fontWeight: 'bold', color: '#16a34a' }}>UPI: {paymentDetails.upi}</p>
          
          <a href={`https://wa.me/${paymentDetails.upi.split('@')[0]}?text=Payment%20for%20${bookingId}%20-%20${amount}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }}>
            Pay via WhatsApp
          </a>
        </div>
      </div>

      {/* Payment Confirmation */}
      <div className="card" style={{ marginTop: '30px', backgroundColor: '#f0f9ff', borderLeft: '4px solid #16a34a' }}>
        <h4>After Payment</h4>
        <ol style={{ marginLeft: '20px' }}>
          <li>Take a screenshot of the payment confirmation</li>
          <li>Share it via WhatsApp to confirm</li>
          <li>Your booking will be confirmed within 5 minutes</li>
          <li>You'll receive driver details on your WhatsApp</li>
        </ol>
      </div>
    </div>
  );
}

export default Payment;
