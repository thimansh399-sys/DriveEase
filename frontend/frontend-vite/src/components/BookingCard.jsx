import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import LocationInput from "../pages/Home";

const BookingCard = ({
  pickup,
  setPickup,
  drop,
  setDrop,
  pickupPlace,
  setPickupPlace,
  dropPlace,
  setDropPlace,
  inputError,
  setInputError,
  rideMode,
  setRideMode,
  detectingLocation,
  setDetectingLocation,
  locationNote,
  setLocationNote,
  handleBookRide,
  useCurrentLocation
}) => (
  <div className="relative z-20 w-full max-w-lg mx-auto -mt-24 mb-12">
    <motion.div initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{duration:0.5}} className="bg-[#151f2e]/80 rounded-2xl shadow-2xl p-8 flex flex-col gap-4 border border-slate-800 backdrop-blur-lg glassmorphism-card">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-150 border ${rideMode === 'one_way' ? 'bg-green-500 text-white shadow border-green-600' : 'bg-transparent text-green-300 border-slate-700 hover:bg-slate-800/60'}`}
          onClick={() => setRideMode('one_way')}
        >
          One-way Ride
        </button>
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-150 border ${rideMode === 'hourly' ? 'bg-green-500 text-white shadow border-green-600' : 'bg-transparent text-green-300 border-slate-700 hover:bg-slate-800/60'}`}
          onClick={() => {
            setRideMode('hourly');
            setDrop('');
            setDropPlace(null);
          }}
        >
          Hire Driver (2h/4h)
        </button>
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-150 border ${rideMode === 'outstation' ? 'bg-green-500 text-white shadow border-green-600' : 'bg-transparent text-green-300 border-slate-700 hover:bg-slate-800/60'}`}
          onClick={() => setRideMode('outstation')}
        >
          Outstation Trip
        </button>
      </div>
      <LocationInput
        value={pickup}
        onChange={(v) => { setPickup(v); setInputError(''); }}
        onSelect={setPickupPlace}
        placeholder="Pickup Location"
        icon={<span className="text-green-400">●</span>}
      />
      {rideMode !== 'hourly' && (
        <>
          <div className="h-2" />
          <LocationInput
            value={drop}
            onChange={(v) => { setDrop(v); setInputError(''); }}
            onSelect={setDropPlace}
            placeholder="Destination"
            icon={<span className="text-rose-400">●</span>}
          />
        </>
      )}
      {/* Date/Time selector placeholder (implement as needed) */}
      {/* <input type="datetime-local" className="mt-2 p-2 rounded bg-slate-800 text-white" /> */}
      <AnimatePresence>
        {inputError && (
          <motion.p
            className="text-rose-400 font-medium text-base mt-2"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ⚠️ {inputError}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button
        className="w-full mt-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-lg transition-all duration-150"
        onClick={handleBookRide}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Find Drivers Now
      </motion.button>
      <button
        type="button"
        className="w-full mt-1 py-2 rounded-xl border border-green-400 text-green-300 bg-transparent hover:bg-slate-800/60 font-semibold transition-all duration-150"
        onClick={useCurrentLocation}
        disabled={detectingLocation}
      >
        {detectingLocation ? 'Detecting GPS...' : '📍 Use current location'}
      </button>
      {locationNote ? <p className="text-xs text-slate-400 mt-1">{locationNote}</p> : null}
    </motion.div>
    {/* Floating shadow/glow */}
    <div className="absolute inset-0 -z-10 blur-2xl bg-green-500/10 rounded-2xl shadow-2xl" />
  </div>
);

export default BookingCard;
