import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import WelcomeCard from '../components/WelcomeCard';
import ActiveRideCard from '../components/ActiveRideCard';
import BookRideCard from '../components/BookRideCard';
import NearbyDrivers from '../components/NearbyDrivers';
import MyBookings from '../components/MyBookings';
import PaymentsCard from '../components/PaymentsCard';
import ProfileCard from '../components/ProfileCard';
import Toast from '../components/Toast';
import Loader from '../components/Loader';
import {
  mockUser,
  mockActiveRide,
  mockDrivers,
  mockBookings,
  mockPayments,
} from '../utils/mockData';
import { getUser } from '../utils/localStorage';
import { useNavigate } from 'react-router-dom';

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const u = getUser();
    if (!u) {
      navigate('/login');
      return;
    }
    setUser(u);
    setActiveRide(mockActiveRide);
    setDrivers(mockDrivers);
    setBookings(mockBookings);
    setPayments(mockPayments);
  }, [navigate]);

  const handleFindDriver = (pickup, drop) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast({ message: 'Driver found!', type: 'success' });
    }, 1200);
  };

  const handleBookDriver = (driver) => {
    setToast({ message: `Booked ${driver.name}!`, type: 'success' });
  };

  const handleDownloadInvoice = (ride) => {
    setToast({ message: `Invoice for ${ride.id} downloaded!`, type: 'success' });
  };

  const handleEditProfile = () => {
    setToast({ message: 'Profile edit coming soon!', type: 'info' });
  };

  const handleTrack = () => {
    setToast({ message: 'Live tracking opened!', type: 'success' });
  };

  const handleCall = () => {
    setToast({ message: 'Calling driver...', type: 'success' });
  };

  if (!user) return null;

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Navbar user={user} />
      <div className="flex flex-1">
        <Sidebar className="hidden md:block" />
        <main className="flex-1 p-4 grid gap-6 grid-cols-1 md:grid-cols-3">
          <section className="md:col-span-2 space-y-6">
            <WelcomeCard user={user} />
            <ActiveRideCard ride={activeRide} onTrack={handleTrack} onCall={handleCall} />
            <BookRideCard onFindDriver={handleFindDriver} />
            <NearbyDrivers drivers={drivers} onBook={handleBookDriver} />
            <MyBookings bookings={bookings} onDownload={handleDownloadInvoice} />
          </section>
          <aside className="space-y-6">
            <PaymentsCard payments={payments} />
            <ProfileCard user={user} onEdit={handleEditProfile} />
          </aside>
        </main>
      </div>
      {loading && <Loader />}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
