import React from "react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Amit S.",
    review: "DriveEase made my daily commute stress-free. The drivers are always on time and professional!",
    rating: 5
  },
  {
    name: "Priya K.",
    review: "I booked an outstation trip for my family. The experience was premium and safe.",
    rating: 5
  },
  {
    name: "Rahul M.",
    review: "The booking process is so easy and transparent. Highly recommend DriveEase!",
    rating: 4.5
  }
];

const Testimonials = () => (
  <section className="max-w-7xl mx-auto py-16 px-4" id="testimonials">
    <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5}} className="text-3xl md:text-4xl font-extrabold text-center mb-10 text-green-300 font-outfit">What Our Customers Say</motion.h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {testimonials.map((t, i) => (
        <motion.div key={t.name} initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:i*0.1, duration:0.5}} className="bg-[#151f2e] rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-slate-800 hover:shadow-green-500/10 transition-shadow duration-200">
          <div className="flex gap-1 mb-2">
            {Array.from({length:Math.floor(t.rating)}).map((_,i)=>(<span key={i} className="text-yellow-400 text-xl">★</span>))}
            {t.rating%1!==0 && <span className="text-yellow-400 text-xl">☆</span>}
          </div>
          <p className="text-slate-200 mb-4">“{t.review}”</p>
          <span className="text-green-400 font-bold">{t.name}</span>
        </motion.div>
      ))}
    </div>
  </section>
);

export default Testimonials;
