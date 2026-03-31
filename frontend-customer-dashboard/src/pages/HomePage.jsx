import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-gray-900 text-black flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-gray-900 bg-opacity-90 flex items-center justify-between px-8 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-600">DriveEase</span>
          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">India’s First Personal Driver Network</span>
        </div>
        <nav className="flex gap-6 items-center">
          <Link to="/" className="hover:text-emerald-600 font-semibold">Home</Link>
          <Link to="/drivers" className="hover:text-emerald-600 font-semibold">Drivers</Link>
          <Link to="/services" className="hover:text-emerald-600 font-semibold">Services</Link>
          <Link to="/plans" className="hover:text-emerald-600 font-semibold">Plans</Link>
          <Link to="/insurance" className="hover:text-emerald-600 font-semibold">Insurance</Link>
          <Link to="/my-bookings" className="hover:text-emerald-600 font-semibold">My Bookings</Link>
          <Link to="/login">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow transition font-semibold">Book a Driver</button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between flex-1 px-8 py-16 bg-gradient-to-br from-gray-900 via-emerald-50/10 to-gray-900 overflow-hidden">
        {/* Left Content */}
        <div className="z-10 max-w-xl text-left animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Book a Professional Driver Anytime, Anywhere</h1>
          <p className="text-lg text-gray-700 mb-8">Verified drivers across India. Safe, reliable, and affordable rides at your fingertips.</p>
          <div className="flex gap-4 mb-6">
            <Link to="/login">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold text-lg transition-all duration-200">Book a Driver Now</button>
            </Link>
          </div>
          {/* Trust Indicators */}
          <div className="flex gap-6 text-gray-700 text-base font-medium mb-4">
            <span>⭐ 4.8 Rating</span>
            <span>🚗 5000+ Drivers</span>
            <span>👥 10,000+ Customers</span>
            <span>✅ Aadhaar Verified Drivers</span>
          </div>
        </div>
        {/* Right Image */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 z-0">
          <div className="relative h-full w-full flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80"
              alt="Indian driver near car"
              className="object-cover h-full w-full rounded-l-3xl shadow-2xl filter blur-sm brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-gray-900/80 to-transparent" />
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/917836887228"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 rounded-full shadow-lg p-4 flex items-center justify-center animate-fade-in"
        aria-label="WhatsApp"
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-8 h-8" />
      </a>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-8 mt-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <div className="font-bold text-lg text-emerald-500 mb-2">Contact</div>
            <div>Phone: <a href="tel:+917836887228" className="text-white hover:underline">+91-7836887228</a></div>
            <div>Email: <a href="mailto:support@driveease.in" className="text-white hover:underline">support@driveease.in</a></div>
          </div>
          <div>
            <div className="font-bold text-lg text-emerald-500 mb-2">Quick Links</div>
            <div className="flex flex-col gap-1">
              <Link to="/">Home</Link>
              <Link to="/login">Book Driver</Link>
              <Link to="/register-driver">Register Driver</Link>
              <Link to="/track-booking">Track Booking</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-gray-500">© 2026 DriveEase. All rights reserved.</div>
      </footer>
    </div>
  );
}
