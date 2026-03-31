import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import CustomerDashboard from './pages/CustomerDashboard';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DriversPage from './pages/DriversPage';
import DriverProfilePage from './pages/DriverProfilePage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/drivers/:id" element={<DriverProfilePage />} />
        {/* <Route path="/book-ride" element={<BookRide />} />
        <Route path="/track-ride" element={<TrackRide />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} /> */}
      </Routes>
    </Router>
  );
}
