import React from "react";
import { motion } from "framer-motion";

const categories = [
  {
    icon: "🚗",
    title: "One Way Ride",
    desc: "Quick city rides for daily commutes and errands."
  },
  {
    icon: "🕒",
    title: "Hourly Driver",
    desc: "Hire a driver for 2h/4h for flexible needs."
  },
  {
    icon: "🌏",
    title: "Outstation Trip",
    desc: "Long distance and intercity travel with comfort."
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family/Business",
    desc: "Special plans for families and business professionals."
  }
];

const DriverCategories = () => (
  <section className="max-w-7xl mx-auto py-16 px-4" id="services">
    <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5}} className="text-3xl md:text-4xl font-extrabold text-center mb-10 text-green-300 font-outfit">Our Services</motion.h2>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {categories.map((c, i) => (
        <motion.div key={c.title} initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:i*0.1, duration:0.5}} className="bg-[#151f2e] rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-slate-800 hover:scale-105 hover:shadow-green-500/20 transition-transform duration-200 cursor-pointer">
          <span className="text-4xl mb-4">{c.icon}</span>
          <h3 className="text-xl font-bold mb-2 text-green-400">{c.title}</h3>
          <p className="text-slate-300">{c.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

export default DriverCategories;
