
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import StatsStrip from '../components/StatsStrip';
import WhyChooseUs from '../components/WhyChooseUs';
import HowItWorks from '../components/HowItWorks';
import DriverCategories from '../components/DriverCategories';
import Testimonials from '../components/Testimonials';
import CTABanner from '../components/CTABanner';
import BookingCard from '../components/BookingCard';
import Footer from '../components/Footer';

function LocationInput({ value, onChange, onSelect, placeholder, icon }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

function Home() {
  const plans = [
    { name: 'Basic', price: '₹299/day', desc: 'For short city rides and errands.' },
    { name: 'Family', price: '₹999/week', desc: 'Perfect for families and regular commutes.' },
    { name: 'Business', price: '₹3499/month', desc: 'For business professionals and frequent travelers.' }
  ];

  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupPlace, setPickupPlace] = useState(null);
  const [dropPlace, setDropPlace] = useState(null);
  const [inputError, setInputError] = useState('');
  const [rideMode, setRideMode] = useState('one_way');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  function handleBookRide() {
    if (!pickup || (rideMode !== 'hourly' && !drop)) {
      setInputError('Please enter all required locations.');
      return;
    }
    navigate('/book-ride', {
      state: {
        pickup,
        drop,
        rideMode,
        pickupPlace,
        dropPlace
      }
    });
  }

  function useCurrentLocation() {
    setDetectingLocation(true);
    if (!navigator.geolocation) {

      function Home() {
        const navigate = useNavigate();
        const [pickup, setPickup] = useState('');
        const [drop, setDrop] = useState('');
        const [pickupPlace, setPickupPlace] = useState(null);
        const [dropPlace, setDropPlace] = useState(null);
        const [inputError, setInputError] = useState('');
        const [rideMode, setRideMode] = useState('one_way');
        const [detectingLocation, setDetectingLocation] = useState(false);
        const [locationNote, setLocationNote] = useState('');

        function handleBookRide() {
          if (!pickup || (rideMode !== 'hourly' && !drop)) {
            setInputError('Please enter all required locations.');
            return;
          }
          navigate('/book-ride', {
            state: {
              pickup,
              drop,
              rideMode,
              pickupPlace,
              dropPlace
            }
          });
        }

        function useCurrentLocation() {
          setDetectingLocation(true);
          if (!navigator.geolocation) {
            setLocationNote('Geolocation is not supported by your browser.');
            setDetectingLocation(false);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setPickup(`Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
              setLocationNote('Location detected!');
              setDetectingLocation(false);
            },
            (error) => {
              setLocationNote('Unable to detect location. Please enter manually.');
              setDetectingLocation(false);
            }
          );
        }

        return (
          <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0f172a] text-white flex flex-col">
            <Navbar />
            <HeroSection />
            <BookingCard
              pickup={pickup}
              setPickup={setPickup}
              drop={drop}
              setDrop={setDrop}
              pickupPlace={pickupPlace}
              setPickupPlace={setPickupPlace}
              dropPlace={dropPlace}
              setDropPlace={setDropPlace}
              inputError={inputError}
              setInputError={setInputError}
              rideMode={rideMode}
              setRideMode={setRideMode}
              detectingLocation={detectingLocation}
              setDetectingLocation={setDetectingLocation}
              locationNote={locationNote}
              setLocationNote={setLocationNote}
              handleBookRide={handleBookRide}
              useCurrentLocation={useCurrentLocation}
            />
            <StatsStrip />
            <WhyChooseUs />
            <HowItWorks />
            <DriverCategories />
            <Testimonials />
            <CTABanner />
            <Footer />
          </div>
        );
      }
                onClick={useCurrentLocation}
                disabled={detectingLocation}
                style={{ marginTop: 8 }}
              >
                {detectingLocation ? 'Detecting GPS...' : '📍 Use current location'}
              </button>
              {locationNote ? <p className="home-optional-hint">{locationNote}</p> : null}
            </div>
          </div>
          {/* Right: Hero Image */}
          <div style={{flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <img
              src={import.meta.env.BASE_URL + 'hero-driver.jpg'}
              alt="Professional driver opening car door"
              style={{width: '92%', maxWidth: 520, borderRadius: 24, boxShadow: '0 8px 48px rgba(34,197,94,0.13)'}}
            />
          </div>
        </section>

        <div className="home-v2-divider" />

        {/* ── PLANS ── */}
        <section className="home-v2-section home-v2-plans">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="section-header"
          >
            Our Plans
          </motion.h2>
          <div className="home-v2-plan-grid">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.name}
                className="home-v2-plan-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <h3>{plan.name}</h3>
                <p className="home-plan-price">{plan.price}</p>
                <p className="home-plan-desc">{plan.desc}</p>
                <Link to="/subscriptions" className="home-v2-btn home-v2-btn-primary home-v2-plan-action">
                  Choose Plan
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="home-v2-divider" />

        {/* ── CTA BANNER ── */}
        <motion.section
          className="cta-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="cta-content">
            <h2>Ready to Ride?</h2>
            <p>Join 10,000+ happy customers who trust DriveEase every day.</p>
            <div className="hero-buttons">
              <Link to="/book-ride" className="home-cta-link">
                <motion.button
                  className="btn btn-primary home-book-btn home-cta-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started →
                </motion.button>
              </Link>
              <Link to="/drivers" className="home-cta-link">
                <motion.button
                  className="btn btn-outline home-v2-btn home-v2-btn-outline home-cta-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Drivers
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.section>

        <Footer />
      </div>
    </>
  );
}

export default Home;
