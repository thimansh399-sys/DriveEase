import React from "react";

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur bg-black/40 border-b border-white/10 shadow-lg">
    <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
      {/* Logo */}
      <div className="flex items-center gap-2 font-extrabold text-2xl text-green-400 tracking-tight">
        <span className="rounded-full bg-green-500/20 p-2">🚗</span>
        DriveEase
      </div>
      {/* Nav Links */}
      <div className="hidden md:flex gap-8 text-white/80 font-medium text-lg">
        <a href="#how" className="hover:text-green-400 transition">How it Works</a>
        <a href="#services" className="hover:text-green-400 transition">Services</a>
        <a href="#testimonials" className="hover:text-green-400 transition">Testimonials</a>
        <a href="#contact" className="hover:text-green-400 transition">Contact</a>
      </div>
      {/* Auth Buttons */}
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-lg bg-transparent border border-green-400 text-green-400 hover:bg-green-500/10 transition font-semibold">Login</button>
        <button className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition font-semibold shadow">Register</button>
      </div>
    </div>
  </nav>
);

export default Navbar;
