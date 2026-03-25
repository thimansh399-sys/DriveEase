import CustomerProfile from './pages/CustomerProfile';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Booking from './pages/Booking';
import Login from './pages/Login';
import DriverRegister from './pages/DriverRegister';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import MyBookings from './pages/MyBookings';
import Services from './pages/Services';
import DriverDashboard from './pages/DriverDashboard';
import Payment from './pages/Payment';
import Insurance from './pages/Insurance';
import Pay from './pages/Pay';
import DriverRegistrationFlow from './components/DriverRegistrationFlow';
import AvailableDrivers from './pages/AvailableDrivers';
import AdminDashboardEnhanced from './components/AdminDashboardEnhanced';
import Drivers from './pages/Drivers';
import Live from './pages/Live';
import Subscriptions from './pages/Subscriptions';
import TrackBooking from './pages/TrackBooking';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');
    if (storedToken) {
      setToken(storedToken);
      setUserRole(storedRole);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (newToken, role) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', role);
    setToken(newToken);
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setToken(null);
    setUserRole(null);
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="app">
        {/* Modern sticky Navigation bar on all pages */}
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/browse" element={isLoggedIn ? <Browse /> : <Navigate to="/login" />} />
            <Route path="/available-drivers" element={<AvailableDrivers />} />
            <Route path="/booking/:driverId" element={isLoggedIn ? <Booking /> : <Navigate to="/login" />} />
            <Route path="/booking" element={isLoggedIn ? <Booking /> : <Navigate to="/login" />} />
            <Route path="/register-driver" element={<DriverRegistrationFlow />} />
            <Route path="/driver-registration" element={<DriverRegistrationFlow />} />
            <Route path="/my-bookings" element={isLoggedIn ? <MyBookings /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isLoggedIn ? <CustomerProfile /> : <Navigate to="/login" />} />
            <Route path="/services" element={isLoggedIn ? <Services /> : <Navigate to="/login" />} />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/payment" element={isLoggedIn ? <Payment /> : <Navigate to="/login" />} />
            <Route path="/driver-dashboard" element={isLoggedIn && userRole === 'driver' ? <DriverDashboard /> : <Navigate to="/login" />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={localStorage.getItem('adminAuth') === 'true' ? <AdminDashboard /> : <Navigate to="/admin-login" />} />
            <Route path="/admin-dashboard" element={localStorage.getItem('adminAuth') === 'true' ? <AdminDashboardEnhanced /> : <Navigate to="/admin-login" />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/track-booking" element={<TrackBooking />} />
          </Routes>
        </main>
        <Footer />
        
        {/* WhatsApp Button */}
        <a href="https://wa.me/+917836887228" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath fill='%23fff' d='M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L32 480l117.7-30.9c32.4 17.9 68.9 27.3 106.1 27.3 122.4 0 222-99.6 222-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-67.9-4.3-6.8c-18.4-29.4-28.2-63.3-28.2-98.2 0-101.9 83-184.9 185-184.9 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-83 184.9-186 184.9zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z'/%3E%3C/svg%3E" alt="WhatsApp" />
        </a>
      </div>
    </Router>
  );
}

export default App;
