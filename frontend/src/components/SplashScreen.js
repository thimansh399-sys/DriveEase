import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function SplashScreen({ visible }) {
  const [phase, setPhase] = useState('hello');

  useEffect(() => {
    if (!visible) return undefined;

    const timer = setTimeout(() => setPhase('welcome'), 900);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="splash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="splash-core"
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.05, opacity: 0, y: -6 }}
            transition={{ duration: 0.45 }}
          >
            <div className="splash-logo-wrap">
              <img src="/driveease-logo.svg" alt="DriveEase logo" className="splash-logo" />
            </div>
            <motion.h1
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {phase === 'hello' ? 'Hello' : 'Welcome To DriveEase'}
            </motion.h1>
            <p>Verified drivers, safer rides, better journeys.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
