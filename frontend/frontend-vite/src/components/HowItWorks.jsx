import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: "📝",
    title: "Enter Route",
    desc: "Fill in your pickup and destination details."
  },
  {
    icon: "👨‍✈️",
    title: "Choose Driver",
    desc: "Select from a list of available, verified drivers."
  },
  {
    icon: "🛡️",
    title: "Ride Safely",
    desc: "Enjoy your journey with real-time tracking and support."
  }
];

const HowItWorks = () => (
  <section className="max-w-7xl mx-auto py-16 px-4" id="how">
    <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5}} className="text-3xl md:text-4xl font-extrabold text-center mb-10 text-green-300 font-outfit">How It Works</motion.h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {steps.map((s, i) => (
        <motion.div key={s.title} initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:i*0.1, duration:0.5}} className="bg-[#151f2e] rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-slate-800 hover:shadow-green-500/10 transition-shadow duration-200">
          <span className="text-4xl mb-4">{s.icon}</span>
          <h3 className="text-xl font-bold mb-2 text-green-400">{s.title}</h3>
          <p className="text-slate-300">{s.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

export default HowItWorks;
