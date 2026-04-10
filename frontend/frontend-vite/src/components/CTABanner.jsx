import React from "react";
import { motion } from "framer-motion";

const CTABanner = () => (
  <motion.section id="contact" className="w-full max-w-4xl mx-auto bg-gradient-to-br from-green-700/20 via-green-500/10 to-green-700/20 rounded-2xl shadow-xl p-10 md:p-16 flex flex-col items-center text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
    <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-green-300 font-outfit">Ready to Ride?</h2>
    <p className="text-slate-300 mb-8">Join 10,000+ happy customers or register as a driver today.</p>
    <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
      <a href="#booking" className="w-full md:w-auto">
        <motion.button className="w-full md:w-auto px-8 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-lg transition-all duration-150 mb-2 md:mb-0" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          Book a Ride Now
        </motion.button>
      </a>
      <a href="#" className="w-full md:w-auto">
        <motion.button className="w-full md:w-auto px-8 py-3 rounded-xl border border-green-400 text-green-300 bg-transparent hover:bg-slate-800/60 font-semibold transition-all duration-150" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          Register as Driver
        </motion.button>
      </a>
    </div>
  </motion.section>
);

export default CTABanner;
