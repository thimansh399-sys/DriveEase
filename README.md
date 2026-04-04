# DriveEase - India's First Personal Driver Network

A comprehensive full-stack application for booking trusted personal drivers across India.

## Project Structure

```
DriveEase/
├── backend/              # Node.js/Express server
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
│   ├── seeds/           # Database seeders
│   ├── utils/           # Helper functions
│   ├── server.js        # Main server file
│   └── package.json
└── frontend/            # React application
    ├── public/          # Static files
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── styles/      # CSS files
    │   ├── utils/       # API calls
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Features

✅ **Customer Features:**
- Direct phone login (register-first flow)
- Browse 50+ verified drivers across India
- Real-time driver location tracking
- Book drivers for hourly/daily/outstation rides
- Subscription-based plans (₹1,999 - ₹7,999/month)
- Save multiple addresses
- SOS emergency button with helpline
- Insurance options for rides
- Payment via UPI/Bank transfer
- Booking history and feedback
- Family account management

✅ **Driver Features:**
- Document verification (Aadhar, PAN, DL, Selfie)
- ₹150 one-time registration fee
- Online/offline status management
- Real-time earnings tracking
- Daily income withdrawal
- Bank/UPI payment setup
- Performance ratings
- Online hours tracking

✅ **Admin Dashboard:**
- Password-protected (configured via ADMIN_PASSWORD env)
- Driver registration approval/rejection
- Booking management
- Customer management
- Earnings reports
- Export data to Excel
- Real-time statistics
- 10-second auto-refresh

## Setup Instructions

### Backend Setup

1. **Clone and Navigate:**
```bash
cd DriveEase/backend
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Create .env file (copy from .env.example):**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/driveease
JWT_SECRET=your_secret_key_here
ADMIN_PASSWORD=126312
MAX_AUTO_ASSIGN_DISTANCE_KM=20
PENDING_ASSIGNMENT_WORKER_INTERVAL_MS=30000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=800
NODE_ENV=development
LOCATIONIQ_API_KEY=pk.your_api_key
```

4. **Start MongoDB:**
```bash
# Make sure MongoDB is running locally or update MONGODB_URI
```

5. **Seed Database with 50 Drivers:**
```bash
node seeds/seedDrivers.js
```

    **Seed Kanpur Demo Pool (recommended for nearby testing):**
```bash
npm run seed:kanpur-demo
# optional overrides:
# KANPUR_ONLINE_DRIVERS=80 KANPUR_OFFLINE_DRIVERS=25 npm run seed:kanpur-demo
```

6. **Start Backend Server:**
```bash
npm start
# API will run on http://localhost:5000
```

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd ../frontend
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Create .env file:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. **Start Frontend:**
```bash
npm start
# App will run on http://localhost:3000
```

## Database Schema

### User (Customer)
- Name, Phone, Email
- Saved Addresses
- Family Members
- Subscription Plan
- Booking History
- Payment Information

### Driver
- Personal Details
- Documents (Aadhar, PAN, DL, Selfie)
- Vehicle Information
- Bank/UPI Details
- Experience & Ratings
- Training Certificates
- Service Areas
- Online Status
- Earnings Tracking
- Background Verification

### Booking
- Customer & Driver Info
- Pickup & Drop Location
- Booking Type (hourly/daily/outstation)
- Price Calculation
- Insurance Options
- Payment Status
- SOS & Feedback
- Route Information

### Subscription
- Customer & Driver Assignment
- Plan Type
- Monthly Price
- Duration
- Payment History
- Auto-renewal 

## API Endpoints

### Authentication
```
POST /api/auth/direct-login      - Customer/Driver direct login
POST /api/auth/register-customer - Register customer account
POST /api/auth/admin-login       - Admin password login
GET  /api/auth/profile           - Get user profile
PUT  /api/auth/profile           - Update profile
```

### Drivers
```
GET  /api/drivers/all            - Get all approved drivers
GET  /api/drivers/nearby         - Get nearby drivers
GET  /api/drivers/:id            - Get driver details
POST /api/drivers/register       - Register new driver
PUT  /api/drivers/documents      - Update driver documents
PUT  /api/drivers/status         - Update online/offline status
```

### Bookings
```
POST /api/bookings/create        - Create new booking
GET  /api/bookings/customer      - Get my bookings
GET  /api/bookings/:id           - Get booking details
PUT  /api/bookings/:id/confirm   - Confirm booking
PUT  /api/bookings/:id/cancel    - Cancel booking
POST /api/bookings/:id/feedback  - Add feedback
POST /api/bookings/:id/sos       - Trigger SOS
```

### Admin
```
GET  /api/admin/dashboard/stats  - Dashboard statistics
GET  /api/admin/drivers/registrations - Pending driver registrations
PUT  /api/admin/drivers/:id/approve  - Approve driver
PUT  /api/admin/drivers/:id/reject   - Reject driver
GET  /api/admin/bookings         - All bookings
GET  /api/admin/customers        - All customers
GET  /api/admin/enquiries        - Customer enquiries
PUT  /api/admin/enquiries/:id/respond - Send response
GET  /api/admin/export/bookings  - Export to Excel
```

## Payment Integration

### Accepting Payments:

**UPI/PhonePe:**
- Account: +91-7836887228

**Bank Transfer:**
- Account Holder: Krishna Kant Pandey
- Account: 922010062230782
- IFSC: UTIB0004620
- Bank: Axis Bank

## Login Credentials

🔐 **Admin Dashboard:**
- URL: http://localhost:3000/admin
- Password: value of ADMIN_PASSWORD in backend environment

👥 **Test User (Customer):**
- Phone: 9876543210
- OTP: (shown in console/response)

🚗 **Test Driver:**
- Phone: 9876543212
- OTP: (shown in console/response)

##City Coverage

Drivers seeded in 10 major Indian cities:
- Delhi
- Mumbai
- Bangalore
- Hyderabad
- Pune
- Kolkata
- Chennai
- Jaipur
- Amritsar
- Indore

## Design Features

🎨 **UI/UX:**
- Premium dark theme with green accents (#16a34a)
- Clean, modern interface
- Mobile-responsive design
- Smooth animations & transitions
- Professional trust badges
- Family-first layout

📱 **Responsive:**
- Desktop, Tablet, Mobile optimized
- Touch-friendly buttons
- Adaptive layouts

## Support & Contact

📞 **Phone:** +91-7836887228
📧 **Email:** support@driveease.in
💬 **WhatsApp:** https://wa.me/+917836887228

👨‍💼 **Brand Ambassador:** Himanshu Thakur

## Tech Stack

**Backend:**
- Node.js & Express
- MongoDB
- JWT Authentication
- Bcrypt for password hashing

**Frontend:**
- React 18
- React Router v6
- Leaflet.js for maps
- Axios for API calls
- QR Code generation

## Future Enhancements

- Real-time GPS tracking with Leaflet maps
- Video call support with drivers
- Emergency incident reporting
- AI-powered driver recommendations
- Loyalty rewards system
- Corporate partnerships
- Insurance partner integration
- Multi-language support

## Deployment

### Backend (Heroku/Railway):
```bash
npm install -g heroku
heroku login
heroku create driveease-backend
git push heroku main
```

### Frontend (Vercel):
```bash
npm install -g vercel
vercel
```

## Notes

- Admin password is hardcoded for demo purposes. Use environment variables in production
- OTP is displayed in console for testing. Integrate Twilio for production SMS
- Use environment-specific configs
- Implement rate limiting for security
- Add email notifications
- Set up proper error logging

## License

MIT License - DriveEase 2026

---

**"Not just a ride, a trusted driver." 🚗**

Built with ❤️ for Indian families seeking trust and safety in transportation.
