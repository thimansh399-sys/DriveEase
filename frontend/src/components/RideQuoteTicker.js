import React, { useEffect, useMemo, useState } from 'react';

const BANNER_LINES = [
  'Book Your Driver Today',
  '20% Off First Ride',
  'Police Verified Drivers',
  'GPS Tracked Every Ride',
  'Trusted by 5000+ Families',
  '24/7 Support Available',
  'Book in Under 60 Seconds',
  "India's #1 Driver Network"
];

const ROTATING_QUOTES = [
  'Drive smart, arrive safe.',
  'Every kilometer earns trust.',
  'A calm ride is a better ride.',
  'Professional drivers. Peaceful journeys.',
  'Your city. Your driver. Your time.',
  'Safe family travel, every single day.'
];

export default function RideQuoteTicker() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % ROTATING_QUOTES.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const scrollingText = useMemo(
    () => BANNER_LINES.map((line) => `* ${line}`).join('   '),
    []
  );

  return (
    <div className="ride-quote-shell" aria-label="Ride highlights ticker">
      <div className="ride-quote-banner">
        <div className="ride-quote-track">
          <span>{scrollingText}</span>
          <span>{scrollingText}</span>
        </div>
      </div>
      <div className="ride-quote-rotating">
        <span className="ride-quote-label">Ride Quote</span>
        <strong>{ROTATING_QUOTES[quoteIndex]}</strong>
      </div>
    </div>
  );
}
