import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DriverRegistration.css';

export default function DriverRegistrationFlow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [driverId, setDriverId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    phone: '',
    email: '',
    bloodGroup: '',
    yearsOfExperience: '0',

    // Step 2: Vehicle Details
    vehicle: {
      model: '',
      registrationNumber: '',
      color: '',
      seatCapacity: '0',
      insuranceExpiry: ''
    },

    // Step 3: Payment
    paymentScreenshot: '',
    paymentId: ''
  });

  const [paymentStatus, setPaymentStatus] = useState(null);
  const [verificationWaitTime, setVerificationWaitTime] = useState(30); // minutes

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('vehicle.')) {
      const vehicleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  // Step 1: Submit Basic Info
  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/drivers/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            city: 'Kanpur', // Get from location selector
            state: 'Uttar Pradesh',
            pincode: '208001',
            bloodGroup: formData.bloodGroup,
            yearsOfExperience: formData.yearsOfExperience,
            vehicle: formData.vehicle
          })
        }
      );

      if (!response.ok) throw new Error('Registration failed');

      const data = await response.json();
      setDriverId(data.driverId);
      setCurrentStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Upload Payment Screenshot
  const handleDocumentUpload = async (e) => {
    e.preventDefault();

    if (!formData.paymentScreenshot) {
      setError('Please upload payment screenshot');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/drivers/${driverId}/payment/upload`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenshotUrl: formData.paymentScreenshot,
            paymentId: formData.paymentId
          })
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setPaymentStatus(data.currentStatus);
      setCurrentStep(3);

      // Start polling for verification status
      startVerificationPolling();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Poll verification status
  const startVerificationPolling = () => {
    let timeRemaining = 30;
    const interval = setInterval(async () => {
      timeRemaining--;
      setVerificationWaitTime(timeRemaining);

      if (timeRemaining <= 0) {
        clearInterval(interval);
        // Check final status
        checkPaymentStatus();
        return;
      }

      // Optional: Check status every minute
      if (timeRemaining % 1 === 0) {
        checkPaymentStatus();
      }
    }, 1000);
  };

  // Check payment verification status
  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/drivers/${driverId}/payment/status`
      );
      const data = await response.json();
      setPaymentStatus(data.verificationStatus);

      if (data.verificationStatus.label === 'Verified') {
        setCurrentStep(4);
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert to base64 or handle file upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          paymentScreenshot: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="driver-registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h1>DriveEase Driver Registration</h1>
          <p>Complete steps to become a verified driver</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-title">Basic Info</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-title">Vehicle Details</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-title">Payment</div>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-title">Verification</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <form onSubmit={handleBasicInfoSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="10-digit mobile number"
                maxLength="10"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Continue to Vehicle Details'}
            </button>
          </form>
        )}

        {/* Step 2: Vehicle Details */}
        {currentStep === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(3); }}>
            <div className="form-group">
              <label>Vehicle Model *</label>
              <input
                type="text"
                name="vehicle.model"
                value={formData.vehicle.model}
                onChange={handleInputChange}
                placeholder="e.g., Maruti Swift"
                required
              />
            </div>

            <div className="form-group">
              <label>Registration Number *</label>
              <input
                type="text"
                name="vehicle.registrationNumber"
                value={formData.vehicle.registrationNumber}
                onChange={handleInputChange}
                placeholder="e.g., UP 14 AB 1234"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Color</label>
                <input
                  type="text"
                  name="vehicle.color"
                  value={formData.vehicle.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Silver"
                />
              </div>

              <div className="form-group">
                <label>Seat Capacity</label>
                <input
                  type="number"
                  name="vehicle.seatCapacity"
                  value={formData.vehicle.seatCapacity}
                  onChange={handleInputChange}
                  min="1"
                  max="9"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Insurance Expiry Date</label>
              <input
                type="date"
                name="vehicle.insuranceExpiry"
                value={formData.vehicle.insuranceExpiry}
                onChange={handleInputChange}
              />
            </div>

            <div className="button-group">
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>
                Back
              </button>
              <button type="submit" className="btn-primary">
                Continue to Payment
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Payment & Verification */}
        {currentStep === 3 && (
          <form onSubmit={handleDocumentUpload}>
            <div className="payment-info">
              <h3>Registration Fee: ₹150</h3>
              <p>Make payment via any UPI app and upload screenshot below</p>
            </div>

            <div className="upi-section">
              <h4>Payment Options:</h4>
              <div className="payment-methods">
                <div className="payment-method">
                  <strong>UPI Address:</strong>
                  <p>driveease@paytm</p>
                  <button type="button" className="btn-copy">Copy UPI</button>
                </div>
                <div className="payment-method">
                  <strong>Bank Transfer</strong>
                  <p>Account: DriveEase Driver Registration</p>
                  <p>IFSC: SBIN0001234</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Upload Payment Screenshot *</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                {formData.paymentScreenshot && (
                  <img src={formData.paymentScreenshot} alt="Payment proof" className="preview" />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Payment ID/Reference (if applicable)</label>
              <input
                type="text"
                name="paymentId"
                value={formData.paymentId}
                onChange={handleInputChange}
                placeholder="Optional: Enter transaction ID"
              />
            </div>

            <div className="button-group">
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep(2)}>
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Uploading...' : 'Submit Payment & Continue'}
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Verification Status */}
        {currentStep === 4 && paymentStatus && (
          <div className="verification-status">
            <div className={`status-icon ${paymentStatus.color}`}>
              {paymentStatus.icon === 'hourglass' && '⏳'}
              {paymentStatus.icon === 'checkmark' && '✓'}
              {paymentStatus.icon === 'close' && '✗'}
            </div>

            <h3>{paymentStatus.label}</h3>
            <p>{paymentStatus.description}</p>

            {paymentStatus.label === 'Pending Verification' && (
              <div className="wait-timer">
                <p>Estimated wait time: {verificationWaitTime} minutes</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${((30 - verificationWaitTime) / 30) * 100}%`}}></div>
                </div>
              </div>
            )}

            {paymentStatus.label === 'Verified' && (
              <div className="success-message">
                <p>Congratulations! Your payment is verified.</p>
                <p>You can now log in as a driver.</p>
                <button className="btn-primary" onClick={() => navigate('/login')}>
                  Go to Driver Login
                </button>
              </div>
            )}

            {paymentStatus.label === 'Verification Failed' && (
              <div className="error-section">
                <p>Please resubmit your payment screenshot</p>
                <button className="btn-primary" onClick={() => setCurrentStep(3)}>
                  Resubmit Payment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
