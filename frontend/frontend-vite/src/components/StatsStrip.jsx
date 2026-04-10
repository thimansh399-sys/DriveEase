import React from "react";
import { motion } from "framer-motion";

const StatsStrip = () => (
  <section className="w-full bg-gradient-to-r from-green-900/60 via-black/80 to-green-900/60 py-8 px-4">
    <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
      <motion.div whileHover={{scale:1.05}} className="flex flex-col items-center">
        <span className="text-3xl md:text-4xl font-bold text-green-400">5,000+</span>
        <span className="text-slate-300 mt-1">Drivers</span>
      </motion.div>
      <motion.div whileHover={{scale:1.05}} className="flex flex-col items-center">
        <span className="text-3xl md:text-4xl font-bold text-green-400">30+</span>
        <span className="text-slate-300 mt-1">Cities Served</span>
      </motion.div>
      <motion.div whileHover={{scale:1.05}} className="flex flex-col items-center">
        <span className="text-3xl md:text-4xl font-bold text-green-400">50,000+</span>
        <span className="text-slate-300 mt-1">Happy Customers</span>
      </motion.div>
      <motion.div whileHover={{scale:1.05}} className="flex flex-col items-center">
        <span className="text-3xl md:text-4xl font-bold text-green-400">4.9★</span>
        <span className="text-slate-300 mt-1">Avg. Rating</span>
      </motion.div>
    </div>
  </section>
);

export default StatsStrip;
