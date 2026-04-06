import React, { useState } from 'react';
import '../styles/Plans.css';

const customerPlans = [
  {
    id: 'basic',
    name: 'BASIC',
    icon: '🟢',
    badge: '',
    tagline: 'Best for normal users',
    price: '₹0',
    period: '/month',
    estimatedPrice: '₹250',
    priorityBadge: 'Standard',
    driverQuality: 'Normal drivers',
    cardTheme: 'basic',
    features: [
      { text: 'Standard pricing per ride', enabled: true },
      { text: 'Normal driver allocation', enabled: true },
      { text: 'Limited offers', enabled: true },
      { text: 'Priority booking', enabled: false },
      { text: 'Ride discounts', enabled: false },
    ],
    useCase: 'First-time users / casual riders',
  },
  {
    id: 'smart',
    name: 'SMART',
    icon: '🔵',
    badge: 'MOST POPULAR',
    tagline: 'Most users ke liye perfect',
    price: '₹99',
    period: '/month',
    estimatedPrice: '₹230',
    priorityBadge: 'Priority',
    driverQuality: '4★+ drivers',
    cardTheme: 'smart',
    features: [
      { text: 'Faster driver allocation', enabled: true },
      { text: '5–10% discount per ride', enabled: true },
      { text: 'Better rated drivers', enabled: true },
      { text: 'Priority support', enabled: true },
      { text: 'Weekly coupons', enabled: true },
    ],
    useCase: 'Daily riders who want savings + faster pickups',
  },
  {
    id: 'elite',
    name: 'PREMIUM / ELITE',
    icon: '🟡',
    badge: '',
    tagline: 'High-value customers ke liye',
    price: '₹299',
    period: '/month',
    estimatedPrice: '₹210',
    priorityBadge: '🔥 Fastest Pickup',
    driverQuality: '4.5★+ verified drivers',
    cardTheme: 'elite',
    features: [
      { text: 'Instant driver matching (top priority)', enabled: true },
      { text: '10–15% discount on rides', enabled: true },
      { text: 'Top-rated drivers only', enabled: true },
      { text: 'Premium live tracking + premium support', enabled: true },
      { text: 'Free cancellation (limited)', enabled: true },
      { text: 'Corporate use friendly', enabled: true },
    ],
    useCase: 'Power users, business travel, corporate teams',
  },
];

const bookingComparison = [
  {
    label: 'Estimated Price',
    basic: '₹250',
    smart: '₹230 (discount applied)',
    elite: '₹210',
  },
  {
    label: 'Driver Priority Badge',
    basic: 'Standard',
    smart: 'Priority',
    elite: '🔥 Fastest Pickup',
  },
  {
    label: 'Driver Quality',
    basic: 'Normal drivers',
    smart: '4★+ drivers',
    elite: '4.5★+ verified drivers',
  },
];

const extraFeatures = [
  'Wallet cashback',
  'Referral rewards',
  'Ride history insights',
  'Favourite driver option',
  'Safety badge for premium users',
];

const backendSteps = [
  {
    title: 'Plan read and validation',
    detail: 'On ride request, read user subscription plan from MongoDB: BASIC / SMART / ELITE.',
  },
  {
    title: 'Price and discount engine',
    detail: 'Apply plan-based discount rules before quote generation and return final payable fare.',
  },
  {
    title: 'Driver filtering by plan',
    detail: 'BASIC: all eligible drivers. SMART: minimum 4★. ELITE: minimum 4.5★ verified drivers.',
  },
  {
    title: 'Priority scoring',
    detail: 'Boost assignment score by plan priority so SMART gets faster allocation and ELITE gets top priority.',
  },
  {
    title: 'Conversion popup trigger',
    detail: 'If BASIC user can save money on this ride, show: Upgrade to Smart & save ₹20 on this ride.',
  },
];

export default function Plans() {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="plans-page-customer">
      <div className="plans-shell">
        <header className="plans-header-customer">
          <p className="plans-kicker">Customer Plans (DriveEase ke liye)</p>
          <h1>Choose the right plan for every ride style</h1>
          <p>
            Faster allocation, better drivers, and smarter pricing from BASIC to ELITE.
          </p>
        </header>

        <div className="plans-tabs-customer">
          <button
            className={`plans-tab-customer ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            Plans
          </button>
          <button
            className={`plans-tab-customer ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            Booking Screen Impact
          </button>
          <button
            className={`plans-tab-customer ${activeTab === 'logic' ? 'active' : ''}`}
            onClick={() => setActiveTab('logic')}
          >
            Backend Logic
          </button>
        </div>

        {activeTab === 'plans' && (
          <section className="plans-grid-customer">
            {customerPlans.map((plan) => (
              <article key={plan.id} className={`plan-card-customer ${plan.cardTheme}`}>
                {plan.badge ? <span className="plan-popular-badge">{plan.badge}</span> : null}

                <div className="plan-card-top">
                  <span className="plan-dot-icon">{plan.icon}</span>
                  <h3>{plan.name}</h3>
                  <p>{plan.tagline}</p>
                </div>

                <div className="plan-price-wrap">
                  <span className="plan-price-main">{plan.price}</span>
                  <span className="plan-price-period">{plan.period}</span>
                </div>

                <div className="plan-micro-metrics">
                  <div>
                    <strong>Booking Quote</strong>
                    <span>{plan.estimatedPrice}</span>
                  </div>
                  <div>
                    <strong>Priority Badge</strong>
                    <span>{plan.priorityBadge}</span>
                  </div>
                  <div>
                    <strong>Driver Quality</strong>
                    <span>{plan.driverQuality}</span>
                  </div>
                </div>

                <ul className="plan-feature-list-customer">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className={feature.enabled ? 'enabled' : 'disabled'}>
                      <span>{feature.enabled ? '✅' : '❌'}</span>
                      {feature.text}
                    </li>
                  ))}
                </ul>

                <p className="plan-use-case">
                  <strong>Use case:</strong> {plan.useCase}
                </p>

                <button className={`plan-cta-btn ${plan.cardTheme}`} type="button">
                  {plan.id === 'basic' ? 'Continue Free' : `Choose ${plan.name.split(' ')[0]}`}
                </button>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'booking' && (
          <section className="booking-impact-section">
            <h2>Booking ke time ye change clearly dikhega</h2>
            <div className="booking-table-wrap">
              <table className="booking-impact-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>BASIC</th>
                    <th>SMART</th>
                    <th>ELITE</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingComparison.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.basic}</td>
                      <td className="smart-col">{row.smart}</td>
                      <td>{row.elite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="upgrade-idea-card">
              <h3>Smart UX Conversion Popup</h3>
              <p>
                If user is on BASIC at booking time, show this conversion nudge:
              </p>
              <div className="popup-preview">
                Upgrade to Smart &amp; save ₹20 on this ride
              </div>
              <p className="small-note">This helps increase plan upgrades during checkout.</p>
            </div>

            <div className="extras-wrap">
              <h3>Extra features you can add</h3>
              <div className="extras-grid">
                {extraFeatures.map((feature) => (
                  <div key={feature} className="extra-item">🎁 {feature}</div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'logic' && (
          <section className="backend-logic-section">
            <h2>Backend Logic (Simple Samajh)</h2>
            <div className="logic-cards-grid">
              {backendSteps.map((step) => (
                <article key={step.title} className="logic-card">
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </article>
              ))}
            </div>

            <div className="logic-formula-box">
              <h3>Assignment Score Formula</h3>
              <p>
                score = planWeight + proximityScore + driverRatingScore + acceptanceScore
              </p>
              <ul>
                <li>BASIC weight = 10</li>
                <li>SMART weight = 25</li>
                <li>ELITE weight = 40</li>
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
