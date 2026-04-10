import React from "react";
import { motion } from "framer-motion";

const HeroSection = () => (
  <section className="relative flex flex-col md:flex-row items-center justify-between gap-12 pt-32 pb-16 px-4 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
    {/* Left: Text */}
    <div className="flex-1 flex flex-col gap-8 z-10">
      <motion.h1 initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{duration:0.6}} className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
        Book Your Personal Driver <span className="text-green-400">Instantly</span>
      </motion.h1>
      <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2, duration:0.6}} className="text-lg md:text-2xl text-slate-300 max-w-xl">
        India's #1 trusted personal driver service for daily commutes, family trips, and business travel.
      </motion.p>
      <div className="flex flex-wrap gap-4 items-center mt-2">
        <span className="bg-green-500/10 text-green-400 px-4 py-2 rounded-full font-semibold text-base flex items-center gap-2">✔ Verified Drivers</span>
        <span className="bg-green-500/10 text-green-400 px-4 py-2 rounded-full font-semibold text-base flex items-center gap-2">✔ 24/7 Support</span>
        <span className="bg-green-500/10 text-green-400 px-4 py-2 rounded-full font-semibold text-base flex items-center gap-2">✔ Instant Booking</span>
      </div>
    </div>
    {/* Right: Hero Image */}
    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.3, duration:0.7}} className="flex-1 flex items-center justify-center z-10">
      <img src={import.meta.env.BASE_URL + 'hero-driver.jpg'} alt="Premium driver" className="w-11/12 max-w-lg rounded-3xl shadow-2xl shadow-green-500/10 border-2 border-green-900/20" />
    </motion.div>
    {/* Animated Gradient/Glow BG */}
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5, duration:1}} className="absolute inset-0 -z-10 bg-gradient-to-br from-green-900/40 via-green-700/10 to-black/80 blur-2xl opacity-80" />
  </section>
);

export default HeroSection;
