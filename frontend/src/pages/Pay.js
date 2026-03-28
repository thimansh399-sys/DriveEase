import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode.react';
import '../styles/Pay.css';
import { buildApiUrl } from '../utils/network';

const PAYMENT_INFO = {
  upi: '7836887228@okaxis',
  bank: {
    account: '922010062230782',
    ifsc: 'UTIB0004620',
    name: 'Krishna Kant Pandey',
    bank: 'Axis Bank',
  },
};

const TRUST_ITEMS = [
  { icon: '🔒', text: '256-bit Encrypted' },
  { icon: '✔', text: 'Verified Account' },
  { icon: '⏱', text: 'Instant Confirmation' },
  { icon: '🛡️', text: 'Money-back Guarantee' },
];

function Pay() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const amountParam = searchParams.get('amount') || '';

  const [activeMethod, setActiveMethod] = useState('upi');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle | confirming | success | failed
  const [copied, setCopied] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [amount, setAmount] = useState(amountParam);
  const [refId, setRefId] = useState(bookingId);
  const fileRef = useRef(null);

  const upiLink = `upi://pay?pa=${PAYMENT_INFO.upi}&pn=DRIVEEASE&am=${amount || '0'}&tn=${refId || 'DriveEase'}`;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleConfirmPayment = async () => {
    if (!refId) return alert('Please enter your Booking / Reference ID');
    setPaymentStatus('confirming');
    try {
      const formData = new FormData();
      formData.append('bookingId', refId);
      formData.append('amount', amount);
      formData.append('method', activeMethod);
      if (screenshot) formData.append('screenshot', screenshot);

      const res = await fetch(buildApiUrl('/payments/confirm'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      }).then((r) => r.json());

      if (res.success) {
        setPaymentStatus('success');
      } else {
        setPaymentStatus('failed');
        setTimeout(() => setPaymentStatus('idle'), 3000);
      }
    } catch {
      setPaymentStatus('failed');
      setTimeout(() => setPaymentStatus('idle'), 3000);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-container">
        {/* ===== HEADER ===== */}
        <div className="pay-header">
          <h1 className="pay-title">
            💳 <span>DriveEase</span> Payment
          </h1>
          <p className="pay-subtitle">Secure & fast payment for your ride</p>
        </div>

        {/* ===== AMOUNT HERO ===== */}
        <div className="pay-amount-hero">
          <span className="pay-amount-label">Amount to Pay</span>
          {amount ? (
            <span className="pay-amount-value">₹{Number(amount).toLocaleString('en-IN')}</span>
          ) : (
            <div className="pay-amount-input-wrap">
              <span className="pay-rupee">₹</span>
              <input
                type="number"
                className="pay-amount-input"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}
          {refId && <span className="pay-ref">Booking: {refId}</span>}
          {!refId && (
            <input
              className="pay-ref-input"
              placeholder="Enter Booking ID / Reference"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
            />
          )}
        </div>

        {/* ===== PAYMENT METHODS ===== */}
        <div className="pay-methods">
          {[
            { id: 'upi', label: 'UPI', icon: '📱', tag: 'Recommended' },
            { id: 'qr', label: 'Scan QR', icon: '📷', tag: 'Fastest' },
            { id: 'bank', label: 'Bank Transfer', icon: '🏦', tag: '' },
          ].map((m) => (
            <button
              key={m.id}
              className={`pay-method-btn ${activeMethod === m.id ? 'active' : ''}`}
              onClick={() => setActiveMethod(m.id)}
            >
              <span className="pay-method-icon">{m.icon}</span>
              <span className="pay-method-label">{m.label}</span>
              {m.tag && <span className="pay-method-tag">{m.tag}</span>}
            </button>
          ))}
        </div>

        {/* ===== UPI SECTION ===== */}
        {activeMethod === 'upi' && (
          <div className="pay-section pay-upi">
            <div className="pay-upi-id-box">
              <div>
                <span className="pay-section-label">UPI ID</span>
                <span className="pay-upi-id">{PAYMENT_INFO.upi}</span>
              </div>
              <button
                className={`pay-copy-btn ${copied === 'upi' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(PAYMENT_INFO.upi, 'upi')}
              >
                {copied === 'upi' ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <div className="pay-upi-apps">
              <span className="pay-section-label">Open in App</span>
              <div className="pay-app-buttons">
                <a href={upiLink} className="pay-app-btn gpay">
                  <span>G</span> GPay
                </a>
                <a href={upiLink} className="pay-app-btn phonepe">
                  <span>P</span> PhonePe
                </a>
                <a href={upiLink} className="pay-app-btn paytm">
                  <span>₹</span> Paytm
                </a>
                <a href={upiLink} className="pay-app-btn upi">
                  <span>U</span> Any UPI
                </a>
              </div>
            </div>

            <div className="pay-small-qr">
              <QRCode
                value={upiLink}
                size={120}
                bgColor="transparent"
                fgColor="#22c55e"
                level="M"
              />
              <span>or scan to pay</span>
            </div>
          </div>
        )}

        {/* ===== QR SECTION ===== */}
        {activeMethod === 'qr' && (
          <div className="pay-section pay-qr">
            <div className="pay-qr-box">
              <div className="pay-qr-frame">
                <QRCode
                  value={upiLink}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#080d14"
                  level="H"
                  includeMargin
                />
              </div>
              <p className="pay-qr-hint">Scan with any UPI app — GPay, PhonePe, Paytm</p>
            </div>
            <div className="pay-upi-id-box" style={{ marginTop: 16 }}>
              <div>
                <span className="pay-section-label">UPI ID</span>
                <span className="pay-upi-id">{PAYMENT_INFO.upi}</span>
              </div>
              <button
                className={`pay-copy-btn ${copied === 'upi2' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(PAYMENT_INFO.upi, 'upi2')}
              >
                {copied === 'upi2' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* ===== BANK SECTION ===== */}
        {activeMethod === 'bank' && (
          <div className="pay-section pay-bank">
            <div className="pay-bank-grid">
              {[
                { label: 'Account Holder', value: PAYMENT_INFO.bank.name, key: 'name' },
                { label: 'Account Number', value: PAYMENT_INFO.bank.account, key: 'acc' },
                { label: 'IFSC Code', value: PAYMENT_INFO.bank.ifsc, key: 'ifsc' },
                { label: 'Bank', value: PAYMENT_INFO.bank.bank, key: 'bank' },
              ].map((item) => (
                <div key={item.key} className="pay-bank-item">
                  <span className="pay-bank-label">{item.label}</span>
                  <div className="pay-bank-value-row">
                    <span className="pay-bank-value">{item.value}</span>
                    <button
                      className={`pay-copy-sm ${copied === item.key ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(item.value, item.key)}
                    >
                      {copied === item.key ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pay-bank-note">
              ⚠️ Add <strong>{refId || 'Booking ID'}</strong> as payment reference for instant verification
            </div>
          </div>
        )}

        {/* ===== CONFIRM PAYMENT ===== */}
        <div className="pay-confirm-section">
          <div className="pay-screenshot-row">
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              style={{ display: 'none' }}
              onChange={(e) => setScreenshot(e.target.files[0])}
            />
            <button className="pay-screenshot-btn" onClick={() => fileRef.current?.click()}>
              📎 {screenshot ? screenshot.name : 'Attach Screenshot (optional)'}
            </button>
          </div>

          {paymentStatus === 'idle' && (
            <button className="pay-confirm-btn" onClick={handleConfirmPayment}>
              ✅ I've Paid — Confirm Payment
            </button>
          )}
          {paymentStatus === 'confirming' && (
            <button className="pay-confirm-btn confirming" disabled>
              <span className="pay-btn-spinner"></span> Verifying...
            </button>
          )}
          {paymentStatus === 'success' && (
            <div className="pay-status-msg success">
              <span>✅</span>
              <div>
                <strong>Payment Received!</strong>
                <p>Your booking will be confirmed within 5 minutes</p>
              </div>
            </div>
          )}
          {paymentStatus === 'failed' && (
            <div className="pay-status-msg failed">
              <span>❌</span>
              <div>
                <strong>Verification Failed</strong>
                <p>Try again or contact support on WhatsApp</p>
              </div>
            </div>
          )}
        </div>

        {/* ===== TRUST BAR ===== */}
        <div className="pay-trust-bar">
          {TRUST_ITEMS.map((t, i) => (
            <div key={i} className="pay-trust-item">
              <span>{t.icon}</span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>

        {/* ===== HELP ===== */}
        <div className="pay-help">
          <p>Need help? <a href="https://wa.me/917836887228?text=Payment%20help%20needed" target="_blank" rel="noopener noreferrer">Chat on WhatsApp →</a></p>
        </div>
      </div>
    </div>
  );
}

export default Pay;
