import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "🛡️",
    title: "Verified Drivers",
    desc: "All drivers are background-checked and verified for your safety."
  },
  {
    icon: "📡",
    title: "Real-Time Tracking",
    desc: "Track your ride and driver location live from your phone."
  },
  {
    icon: "🚨",
    title: "Emergency Support",
    desc: "24/7 customer support and emergency assistance."
  },
  {
    icon: "💸",
    title: "Affordable Pricing",
    desc: "Transparent, competitive rates with no hidden charges."
  }
];

const WhyChooseUs = () => (
  <section className="max-w-7xl mx-auto py-16 px-4" id="why">
    <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5}} className="text-3xl md:text-4xl font-extrabold text-center mb-10 text-green-300 font-outfit">Why Choose DriveEase?</motion.h2>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {features.map((f, i) => (
        <motion.div key={f.title} initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:i*0.1, duration:0.5}} className="bg-[#151f2e] rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-slate-800 hover:shadow-green-500/10 transition-shadow duration-200">
          <span className="text-4xl mb-4">{f.icon}</span>
          <h3 className="text-xl font-bold mb-2 text-green-400">{f.title}</h3>
          <p className="text-slate-300">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

export default WhyChooseUs;
