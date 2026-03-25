
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/DriverRegister.css';


function DriverRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: phone, 1: OTP, 2: details, 3: payment, 4: docs, 5: wait
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [displayedOtp, setDisplayedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [driverId, setDriverId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [docs, setDocs] = useState({ aadhar: null, pan: null, license: null, selfie: null });
  const [docsStatus, setDocsStatus] = useState({ aadhar: false, pan: false, license: false, selfie: false });
  const [waitInterval, setWaitInterval] = useState(null);

  const [driverData, setDriverData] = useState({
    dateOfBirth: '',
    address: '',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '',
    vehicle: 'Honda City',
    registrationNumber: '',
    bankAccount: '',
    ifscCode: '',
    upiId: ''
  });


  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter valid phone');
      return;
    }
    setLoading(true);
    try {
      const response = await api.sendOTP(phone, 'driver');
      setDisplayedOtp(response.otp);
      setStep(1);
      setError('');
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };


  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.verifyOTP(phone, otp, name, 'driver');
      setStep(2);
      setSuccess('OTP verified! Now enter your details.');
      setError('');
    } catch (err) {
      setError('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };


  // Step 3: Submit personal/vehicle details
  const handleDriverDataChange = (field, value) => {
    setDriverData(prev => ({ ...prev, [field]: value }));
  };


  const handleSubmitDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        phone,
        name,
        ...driverData
      };
      const response = await api.registerDriver(payload);
      if (response.error) {
        setError(response.error);
      } else {
        setDriverId(response.driverId);
        setStep(3);
        setSuccess('Details submitted! Please upload payment screenshot.');
        setError('');
      }
    } catch (err) {
      setError('Failed to register');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Upload payment screenshot
  const handlePaymentScreenshot = async (e) => {
    e.preventDefault();
    if (!paymentScreenshot) {
      setError('Please upload payment screenshot');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', paymentScreenshot);
      const res = await fetch(`/api/driver-registration/${driverId}/payment/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setStep(4);
        setSuccess('Payment screenshot uploaded! Now upload your documents.');
        setError('');
      } else {
        setError(data.error || 'Failed to upload screenshot');
      }
    } catch (err) {
      setError('Failed to upload screenshot');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Upload documents (Aadhar, PAN, License, Selfie)
  const handleDocUpload = async (type, file) => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(type, file);
      const res = await fetch(`/api/driver-registration/${driverId}/upload/${type}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setDocsStatus(prev => ({ ...prev, [type]: true }));
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`);
        setError('');
      } else {
        setError(data.error || 'Failed to upload');
      }
    } catch (err) {
      setError('Failed to upload');
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Wait for approval (poll status)
  useEffect(() => {
    if (step === 5 && driverId) {
      const interval = setInterval(async () => {
        const res = await fetch(`/api/driver-registration/${driverId}/registration-progress`);
        const data = await res.json();
        setProgress(data);
        if (data.steps && data.steps.approval.status === 'approved') {
          clearInterval(interval);
          setSuccess('Approved! You can now login.');
          setTimeout(() => navigate('/login'), 2000);
        }
      }, 5000);
      setWaitInterval(interval);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [step, driverId]);


  // Stepper UI
  const steps = [
    'Phone Verification',
    'OTP Verification',
    'Personal & Vehicle Details',
    'Payment Screenshot',
    'Document Uploads',
    'Approval Wait'
  ];

  return (
    <div className="section">
      <h1 className="section-title">🚗 Register as DriveEase Driver</h1>
      <div className="stepper">
        {steps.map((label, idx) => (
          <div key={label} className={`step ${step === idx ? 'active' : ''} ${step > idx ? 'completed' : ''}`}>
            <div className="step-number">{idx + 1}</div>
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Step 0: Phone */}
        {step === 0 && (
          <form onSubmit={handleSendOTP}>
            <h3>Step 1: Verify Your Phone</h3>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 1: OTP */}
        {step === 1 && (
          <form onSubmit={handleVerifyOTP}>
            <h3>Step 2: Verify OTP</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">OTP</label>
              <input
                type="text"
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
              />
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>OTP: {displayedOtp}</small>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Personal & Vehicle Details */}
        {step === 2 && (
          <form onSubmit={handleSubmitDetails}>
            <h3>Step 3: Personal & Vehicle Details</h3>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={driverData.dateOfBirth}
                  onChange={(e) => handleDriverDataChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={driverData.city}
                  onChange={(e) => handleDriverDataChange('city', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <input
                type="text"
                className="form-input"
                value={driverData.vehicle}
                onChange={(e) => handleDriverDataChange('vehicle', e.target.value)}
                placeholder="e.g. Honda City"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Registration Number</label>
              <input
                type="text"
                className="form-input"
                value={driverData.registrationNumber}
                onChange={(e) => handleDriverDataChange('registrationNumber', e.target.value)}
                placeholder="e.g. DL-01-AB-1234"
              />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Bank Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={driverData.bankAccount}
                  onChange={(e) => handleDriverDataChange('bankAccount', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={driverData.ifscCode}
                  onChange={(e) => handleDriverDataChange('ifscCode', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                type="text"
                className="form-input"
                value={driverData.upiId}
                onChange={(e) => handleDriverDataChange('upiId', e.target.value)}
                placeholder="your.name@bankname"
              />
            </div>
            <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
              <strong>📄 Document Upload Note:</strong> You'll be asked to upload Aadhar, PAN, Driving License, and Selfie after registration completion for verification.
            </div>
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              <strong>💳 Registration Fee:</strong> ₹150 (One-time) - Payment screenshot required next.
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Step 3: Payment Screenshot */}
        {step === 3 && (
          <form onSubmit={handlePaymentScreenshot}>
            <h3>Step 4: Upload Payment Screenshot</h3>
            <div className="form-group">
              <label className="form-label">Upload Screenshot</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={e => setPaymentScreenshot(e.target.files[0])}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Uploading...' : 'Upload & Continue'}
            </button>
          </form>
        )}

        {/* Step 4: Document Uploads */}
        {step === 4 && (
          <div>
            <h3>Step 5: Upload Documents</h3>
            <div className="form-group">
              <label className="form-label">Aadhar Card</label>
              <input type="file" accept="image/*" className="form-input" onChange={e => handleDocUpload('aadhar', e.target.files[0])} />
              {docsStatus.aadhar && <span className="badge badge-success">Uploaded</span>}
            </div>
            <div className="form-group">
              <label className="form-label">PAN Card</label>
              <input type="file" accept="image/*" className="form-input" onChange={e => handleDocUpload('pan', e.target.files[0])} />
              {docsStatus.pan && <span className="badge badge-success">Uploaded</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Driving License</label>
              <input type="file" accept="image/*" className="form-input" onChange={e => handleDocUpload('license', e.target.files[0])} />
              {docsStatus.license && <span className="badge badge-success">Uploaded</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Selfie</label>
              <input type="file" accept="image/*" className="form-input" onChange={e => handleDocUpload('selfie', e.target.files[0])} />
              {docsStatus.selfie && <span className="badge badge-success">Uploaded</span>}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !Object.values(docsStatus).every(Boolean)} onClick={() => setStep(5)}>
              Continue to Approval Wait
            </button>
          </div>
        )}

        {/* Step 5: Approval Wait */}
        {step === 5 && (
          <div>
            <h3>Step 6: Awaiting Admin Approval</h3>
            <div className="alert alert-info">Your registration is under review. You will be notified once approved.</div>
            {progress && (
              <div className="progress-status">
                <div><strong>Status:</strong> {progress.steps.approval.status}</div>
                <div><strong>Payment:</strong> {progress.steps.paymentVerification.status}</div>
                <div><strong>Documents:</strong> {progress.steps.documentVerification.status}</div>
                <div><strong>Overall Progress:</strong> {progress.overallProgress}%</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverRegister;
