import React, { useState } from 'react';
import '../styles/Plans.css';

const driverPlans = [
  {
    id: 'zero',
    name: 'ZERO RISK',
    icon: '🆓',
    tagline: 'Start earning with zero investment',
    price: '₹0',
    period: '/month',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #334155, #1e293b)',
    featured: false,
    commission: '10%',
    commissionNote: 'Free until ₹2,000 earnings, then 10%',
    rideLimit: '25 rides/day',
    features: [
      { text: 'Zero joining fee', highlight: true },
      { text: 'Up to 25 rides per day', highlight: false },
      { text: '10% commission after ₹2,000', highlight: false },
      { text: 'Standard ride allocation', highlight: false },
      { text: 'Basic support', highlight: false },
      { text: 'Auto-upgrade suggestion at ₹5,000+', highlight: true },
    ],
    allocation: {
      score: 10,
      label: 'Standard Priority',
    },
    earnings: {
      peakBoost: false,
      weeklyBonus: false,
      retentionBonus: true,
    },
  },
  {
    id: 'growth',
    name: 'GROWTH',
    icon: '📈',
    tagline: 'Grow your income with smart features',
    price: '₹499',
    period: '/month',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    featured: true,
    commission: '7%',
    commissionNote: 'Flat 7% on all earnings',
    rideLimit: 'Unlimited',
    features: [
      { text: 'Unlimited daily rides', highlight: true },
      { text: 'Only 7% commission', highlight: true },
      { text: '1.3x peak hour fare boost', highlight: true },
      { text: 'Priority ride allocation', highlight: false },
      { text: '₹200 bonus on 50+ weekly rides', highlight: true },
      { text: 'Priority support', highlight: false },
      { text: 'Earnings analytics dashboard', highlight: false },
      { text: 'Auto-upgrade suggestion at 100+ rides', highlight: false },
    ],
    allocation: {
      score: 30,
      label: 'Priority Allocation',
    },
    earnings: {
      peakBoost: true,
      weeklyBonus: true,
      retentionBonus: true,
    },
  },
  {
    id: 'elite',
    name: 'ELITE',
    icon: '👑',
    tagline: 'Maximum earnings, minimum commission',
    price: '₹999',
    period: '/month',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    featured: false,
    commission: '3%',
    commissionNote: 'Lowest commission — just 3%',
    rideLimit: 'Unlimited',
    features: [
      { text: 'Unlimited daily rides', highlight: true },
      { text: 'Lowest 3% commission', highlight: true },
      { text: '1.5x peak hour fare boost', highlight: true },
      { text: 'Highest priority allocation', highlight: true },
      { text: 'Dedicated relationship manager', highlight: false },
      { text: '₹500 bonus on 50+ weekly rides', highlight: true },
      { text: 'Premium badge on profile', highlight: false },
      { text: 'Advanced analytics & reports', highlight: false },
      { text: 'Rating must stay above 4.5★', highlight: false },
    ],
    allocation: {
      score: 50,
      label: '🔥 Highest Priority',
    },
    earnings: {
      peakBoost: true,
      weeklyBonus: true,
      retentionBonus: true,
    },
  },
];

const algorithmSteps = [
  {
    step: 1,
    title: 'Filter Nearby Drivers',
    icon: '📍',
    desc: 'Only online drivers within 5km radius who haven\'t hit daily limits are eligible.',
  },
  {
    step: 2,
    title: 'Smart Score Calculation',
    icon: '⚡',
    desc: 'Each driver gets a score based on Plan (50/30/10), Distance, Rating, Acceptance Rate & Idle Time.',
  },
  {
    step: 3,
    title: 'Best Match Assigned',
    icon: '🏆',
    desc: 'Highest scoring driver gets the ride instantly. Elite drivers always get first preference.',
  },
];

export default function Plans() {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="plans-page">
      <div className="plans-container">
        {/* Header */}
        <div className="plans-header">
          <h1>Driver Plans & Algorithm</h1>
          <p>Choose your plan wisely — higher plan = more rides = more earnings</p>
        </div>

        {/* Tab Switcher */}
        <div className="plans-tabs">
          <button className={`plans-tab ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>
            💰 Plans & Pricing
          </button>
          <button className={`plans-tab ${activeTab === 'algorithm' ? 'active' : ''}`} onClick={() => setActiveTab('algorithm')}>
            🧠 Ride Algorithm
          </button>
          <button className={`plans-tab ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>
            📊 Earnings Logic
          </button>
        </div>

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="plans-content">
            <div className="plans-grid">
              {driverPlans.map((plan) => (
                <div key={plan.id} className={`plan-card ${plan.featured ? 'featured' : ''}`}>
                  {plan.featured && <div className="plan-badge-popular">🔥 MOST POPULAR</div>}
                  <div className="plan-header" style={{ background: plan.gradient }}>
                    <span className="plan-icon">{plan.icon}</span>
                    <h3>{plan.name}</h3>
                    <p className="plan-tagline">{plan.tagline}</p>
                  </div>
                  <div className="plan-price-section">
                    <span className="plan-amount">{plan.price}</span>
                    <span className="plan-period">{plan.period}</span>
                  </div>
                  <div className="plan-commission-box">
                    <div className="plan-commission-rate">{plan.commission} Commission</div>
                    <div className="plan-commission-note">{plan.commissionNote}</div>
                  </div>
                  <div className="plan-ride-limit">
                    <span className="plan-limit-icon">🚗</span>
                    <span>{plan.rideLimit}</span>
                  </div>
                  <div className="plan-allocation-badge" style={{ borderColor: plan.color }}>
                    <span className="plan-alloc-score">Score: +{plan.allocation.score}</span>
                    <span className="plan-alloc-label">{plan.allocation.label}</span>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((f, i) => (
                      <li key={i} className={f.highlight ? 'highlight' : ''}>
                        <span className="plan-check">{f.highlight ? '🌟' : '✅'}</span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  <div className="plan-action">
                    <button className="plan-btn" style={{ background: plan.featured ? plan.gradient : 'rgba(255,255,255,0.08)' }}>
                      {plan.price === '₹0' ? 'Start Free' : `Subscribe — ${plan.price}/mo`}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="plans-comparison">
              <h2>📋 Quick Comparison</h2>
              <div className="comparison-table-wrap">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>🆓 ZERO RISK</th>
                      <th className="highlight-col">📈 GROWTH</th>
                      <th>👑 ELITE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Monthly Fee</td><td>₹0</td><td className="highlight-col">₹499</td><td>₹999</td></tr>
                    <tr><td>Commission</td><td>10%</td><td className="highlight-col">7%</td><td>3%</td></tr>
                    <tr><td>Daily Ride Limit</td><td>25</td><td className="highlight-col">Unlimited</td><td>Unlimited</td></tr>
                    <tr><td>Allocation Score</td><td>+10</td><td className="highlight-col">+30</td><td>+50</td></tr>
                    <tr><td>Peak Fare Boost</td><td>❌</td><td className="highlight-col">1.3x</td><td>1.5x</td></tr>
                    <tr><td>Weekly Bonus</td><td>❌</td><td className="highlight-col">₹200</td><td>₹500</td></tr>
                    <tr><td>Priority Support</td><td>❌</td><td className="highlight-col">✅</td><td>✅</td></tr>
                    <tr><td>Dedicated Manager</td><td>❌</td><td className="highlight-col">❌</td><td>✅</td></tr>
                    <tr><td>Premium Badge</td><td>❌</td><td className="highlight-col">❌</td><td>✅</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Algorithm Tab */}
        {activeTab === 'algorithm' && (
          <div className="plans-content">
            <div className="algo-section">
              <h2 className="algo-title">🧠 Master Ride Allocation Engine</h2>
              <p className="algo-subtitle">How we assign the best driver to every ride request</p>

              <div className="algo-steps">
                {algorithmSteps.map((s) => (
                  <div key={s.step} className="algo-step-card">
                    <div className="algo-step-num">Step {s.step}</div>
                    <div className="algo-step-icon">{s.icon}</div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* Score Breakdown */}
              <div className="algo-score-section">
                <h3>⚡ Score Calculation Formula</h3>
                <div className="algo-formula">
                  <div className="formula-row">
                    <span className="formula-label">Plan Weight</span>
                    <span className="formula-value">ELITE +50 / GROWTH +30 / ZERO +10</span>
                  </div>
                  <div className="formula-row">
                    <span className="formula-label">Distance Score</span>
                    <span className="formula-value">(5 - distance_km) × 5</span>
                  </div>
                  <div className="formula-row">
                    <span className="formula-label">Rating Score</span>
                    <span className="formula-value">rating × 4</span>
                  </div>
                  <div className="formula-row">
                    <span className="formula-label">Acceptance Rate</span>
                    <span className="formula-value">acceptance_rate × 10</span>
                  </div>
                  <div className="formula-row">
                    <span className="formula-label">Idle Time Boost</span>
                    <span className="formula-value">idle_minutes × 2</span>
                  </div>
                </div>
                <div className="algo-example">
                  <h4>Example: Elite driver, 2km away, 4.8★, 95% acceptance, 10min idle</h4>
                  <div className="algo-calc">
                    <span>50 + (5-2)×5 + 4.8×4 + 0.95×10 + 10×2 = <strong className="algo-total">108.7</strong></span>
                  </div>
                </div>
              </div>

              {/* Retention Logic */}
              <div className="algo-retention">
                <h3>🧲 Driver Retention Logic</h3>
                <div className="retention-cards">
                  <div className="retention-card">
                    <span className="retention-icon">⏰</span>
                    <h4>Inactive 3+ Days</h4>
                    <p>₹100 comeback bonus + push notification</p>
                  </div>
                  <div className="retention-card">
                    <span className="retention-icon">📈</span>
                    <h4>Zero Plan earning ₹5K+</h4>
                    <p>Auto-suggest upgrade to Growth Plan</p>
                  </div>
                  <div className="retention-card">
                    <span className="retention-icon">🏆</span>
                    <h4>Growth Plan 100+ rides</h4>
                    <p>Auto-suggest upgrade to Elite Club</p>
                  </div>
                  <div className="retention-card">
                    <span className="retention-icon">⚠️</span>
                    <h4>Elite rating below 4.5★</h4>
                    <p>Downgrade warning issued</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="plans-content">
            <div className="earnings-section">
              <h2 className="earnings-title">💰 Earnings & Commission Breakdown</h2>
              <p className="earnings-subtitle">See exactly how much you keep from every ride</p>

              <div className="earnings-cards">
                {/* Zero Plan */}
                <div className="earnings-plan-card">
                  <div className="earnings-plan-head" style={{ background: 'linear-gradient(135deg, #334155, #1e293b)' }}>
                    <span>🆓</span>
                    <h3>ZERO RISK Plan</h3>
                  </div>
                  <div className="earnings-plan-body">
                    <div className="earnings-rule">
                      <div className="rule-condition">Monthly Earnings &lt; ₹2,000</div>
                      <div className="rule-result good">0% Commission — Keep everything!</div>
                    </div>
                    <div className="earnings-rule">
                      <div className="rule-condition">Monthly Earnings ≥ ₹2,000</div>
                      <div className="rule-result">10% Commission applies</div>
                    </div>
                    <div className="earnings-rule">
                      <div className="rule-condition">Daily Limit</div>
                      <div className="rule-result warn">Max 25 rides/day — blocked after</div>
                    </div>
                    <div className="earnings-example">
                      <h4>Example: ₹8,000 earned this month</h4>
                      <p>First ₹2,000 = ₹0 commission</p>
                      <p>Next ₹6,000 × 10% = ₹600 commission</p>
                      <p className="earnings-total">You keep: <strong>₹7,400</strong></p>
                    </div>
                  </div>
                </div>

                {/* Growth Plan */}
                <div className="earnings-plan-card featured">
                  <div className="earnings-plan-head" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                    <span>📈</span>
                    <h3>GROWTH Plan</h3>
                  </div>
                  <div className="earnings-plan-body">
                    <div className="earnings-rule">
                      <div className="rule-condition">Commission Rate</div>
                      <div className="rule-result good">Flat 7% on all earnings</div>
                    </div>
                    <div className="earnings-rule">
                      <div className="rule-condition">Peak Hour (8-10AM, 5-8PM)</div>
                      <div className="rule-result good">Fare × 1.3x boost</div>
                    </div>
                    <div className="earnings-rule">
                      <div className="rule-condition">50+ rides/week</div>
                      <div className="rule-result good">₹200 weekly bonus</div>
                    </div>
                    <div className="earnings-example">
                      <h4>Example: ₹15,000 earned (5 peak rides × ₹500)</h4>
                      <p>Peak boost: 5 × ₹500 × 1.3 = ₹3,250</p>
                      <p>Commission: ₹15,000 × 7% = ₹1,050</p>
                      <p>Weekly bonus: ₹200</p>
                      <p className="earnings-total">You keep: <strong>₹14,150 + bonuses</strong></p>
                    </div>
                  </div>
                </div>

                {/* Elite Plan */}
                <div className="earnings-plan-card">
                  <div className="earnings-plan-head" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <span>👑</span>
                    <h3>ELITE Plan</h3>
                  </div>
                  <div className="earnings-plan-body">
                    <div className="earnings-rule">
                      <div className="rule-condition">Commission Rate</div>
                      <div className="rule-result good">Lowest 3% on all earnings</div>
                    </div>
                    <div className="earnings-rule">
                      <div className="rule-condition">Peak Hour (8-10AM, 5-8PM)</div>
                      <div className="rule-result good">Fare × 1.5x boost</div>
                    </div>
                    <div className="earnings-rule">
                      <div className="rule-condition">50+ rides/week</div>
                      <div className="rule-result good">₹500 weekly bonus</div>
                    </div>
                    <div className="earnings-rule">
                      <div className="rule-condition">Rating Requirement</div>
                      <div className="rule-result warn">Must maintain 4.5★+</div>
                    </div>
                    <div className="earnings-example">
                      <h4>Example: ₹25,000 earned (10 peak rides)</h4>
                      <p>Peak boost: 10 × ₹500 × 1.5 = ₹7,500</p>
                      <p>Commission: ₹25,000 × 3% = ₹750</p>
                      <p>Weekly bonus: ₹500</p>
                      <p className="earnings-total">You keep: <strong>₹24,750 + bonuses</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Upgrade Suggestions */}
              <div className="smart-upgrade">
                <h3>🎯 Smart Auto-Upgrade Suggestions</h3>
                <div className="upgrade-flow">
                  <div className="upgrade-step">
                    <div className="upgrade-from">🆓 ZERO</div>
                    <div className="upgrade-arrow">→</div>
                    <div className="upgrade-trigger">Earn ₹5,000+</div>
                    <div className="upgrade-arrow">→</div>
                    <div className="upgrade-to">📈 GROWTH</div>
                  </div>
                  <div className="upgrade-step">
                    <div className="upgrade-from">📈 GROWTH</div>
                    <div className="upgrade-arrow">→</div>
                    <div className="upgrade-trigger">100+ rides/month</div>
                    <div className="upgrade-arrow">→</div>
                    <div className="upgrade-to">👑 ELITE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
