import React from 'react';
import '../styles/Plans.css';

const plans = [
  {
    name: 'Basic Plan',
    price: '₹199/month',
    duration: '1 Month',
    features: [
      'Book personal driver anytime',
      'Up to 30 rides/month',
      'Standard support',
    ],
  },
  {
    name: 'Premium Plan',
    price: '₹499/month',
    duration: '1 Month',
    features: [
      'Unlimited rides',
      'Priority driver allocation',
      'Premium support',
      'Free cancellation',
    ],
  },
  {
    name: 'Annual Saver',
    price: '₹4999/year',
    duration: '12 Months',
    features: [
      'Unlimited rides',
      'Dedicated relationship manager',
      'Exclusive offers',
      'Annual savings',
    ],
  },
];

export default function Plans() {
  return (
    <div className="plans-container">
      <h1 className="plans-title">Our Subscription Plans</h1>
      <div className="plans-list">
        {plans.map((plan, idx) => (
          <div className="plan-card" key={idx}>
            <h2>{plan.name}</h2>
            <div className="plan-price">{plan.price}</div>
            <div className="plan-duration">{plan.duration}</div>
            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
