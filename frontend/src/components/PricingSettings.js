import React, { useState, useEffect } from 'react';
import '../styles/PricingSettings.css';
import { buildApiUrl } from '../utils/network';

export default function PricingSettings() {
  const [pricing, setPricing] = useState({
    baseFare: 50,
    minFare: 100,
    ratePerKm: 15,
    tierRates: {
      tier1: { maxDistance: 5, price: 99 },
      tier2: { minDistance: 6, maxDistance: 20, ratePerKm: 12 },
      tier3: { minDistance: 20, ratePerKm: 10 }
    },
    hourlyRate: 100,
    dailyRate: 800,
    surcharges: {
      nightSurcharge: { active: true, percentage: 20, startTime: '22:00', endTime: '06:00' },
      peakHourSurcharge: { active: true, percentage: 10, times: ['08:00-09:00', '17:00-18:00'] },
      insuranceCharge: { active: true, percentage: 5 }
    }
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load pricing settings from API
    fetchPricingSettings();
  }, []);

  const fetchPricingSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/admin-dashboard/pricing/settings'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      }
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
      setError('Failed to load pricing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setPricing(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: isNaN(value) ? value : Number(value)
      }
    }));
    setSaved(false);
  };

  const handleTierChange = (tier, field, value) => {
    setPricing(prev => ({
      ...prev,
      tierRates: {
        ...prev.tierRates,
        [tier]: {
          ...prev.tierRates[tier],
          [field]: isNaN(value) ? value : Number(value)
        }
      }
    }));
    setSaved(false);
  };

  const handleSurchargeChange = (surcharge, field, value) => {
    setPricing(prev => ({
      ...prev,
      surcharges: {
        ...prev.surcharges,
        [surcharge]: {
          ...prev.surcharges[surcharge],
          [field]: typeof value === 'boolean' ? value : isNaN(value) ? value : Number(value)
        }
      }
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/admin-dashboard/pricing/update'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pricing)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save pricing settings');
      }
    } catch (error) {
      console.error('Error saving pricing settings:', error);
      setError('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-settings-container">
      <div className="settings-header">
        <h2>💰 Pricing Configuration</h2>
        <p>Manage all pricing rates and surcharges</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {saved && <div className="alert alert-success">✓ Settings saved successfully!</div>}

      <form className="pricing-form">
        {/* Base Pricing */}
        <section className="settings-section">
          <h3>Base Pricing</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Base Fare (₹)</label>
              <input
                type="number"
                value={pricing.baseFare}
                onChange={(e) => handleInputChange('baseFare', 'baseFare', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Minimum Fare (₹)</label>
              <input
                type="number"
                value={pricing.minFare}
                onChange={(e) => handleInputChange('minFare', 'minFare', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Default Rate per KM (₹)</label>
              <input
                type="number"
                step="0.5"
                value={pricing.ratePerKm}
                onChange={(e) => handleInputChange('ratePerKm', 'ratePerKm', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Tiered Pricing */}
        <section className="settings-section">
          <h3>Tiered Pricing (Distance-Based)</h3>
          
          <div className="tier-card">
            <h4>Tier 1: 0-5 KM (Flat Rate)</h4>
            <div className="form-group">
              <label>Flat Price (₹)</label>
              <input
                type="number"
                value={pricing.tierRates.tier1.price}
                onChange={(e) => handleTierChange('tier1', 'price', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="tier-card">
            <h4>Tier 2: 6-20 KM (Distance-Based)</h4>
            <div className="form-group">
              <label>Rate per KM (₹)</label>
              <input
                type="number"
                step="0.5"
                value={pricing.tierRates.tier2.ratePerKm}
                onChange={(e) => handleTierChange('tier2', 'ratePerKm', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="tier-card">
            <h4>Tier 3: 20+ KM (Long Distance)</h4>
            <div className="form-group">
              <label>Rate per KM (₹)</label>
              <input
                type="number"
                step="0.5"
                value={pricing.tierRates.tier3.ratePerKm}
                onChange={(e) => handleTierChange('tier3', 'ratePerKm', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Hourly & Daily */}
        <section className="settings-section">
          <h3>Subscription Rates</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Hourly Rate (₹/hour)</label>
              <input
                type="number"
                value={pricing.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', 'hourlyRate', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Daily Rate (₹/day - 8hrs)</label>
              <input
                type="number"
                value={pricing.dailyRate}
                onChange={(e) => handleInputChange('dailyRate', 'dailyRate', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Surcharges */}
        <section className="settings-section">
          <h3>Surcharges & Add-ons</h3>

          <div className="surcharge-card">
            <div className="surcharge-header">
              <h4>🌙 Night Surcharge (10 PM - 6 AM)</h4>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={pricing.surcharges.nightSurcharge.active}
                  onChange={(e) => handleSurchargeChange('nightSurcharge', 'active', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {pricing.surcharges.nightSurcharge.active && (
              <div className="surcharge-details">
                <div className="form-group">
                  <label>Additional Percentage (%)</label>
                  <input
                    type="number"
                    value={pricing.surcharges.nightSurcharge.percentage}
                    onChange={(e) => handleSurchargeChange('nightSurcharge', 'percentage', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="surcharge-card">
            <div className="surcharge-header">
              <h4>🚗 Peak Hour Surcharge (8-9 AM, 5-6 PM)</h4>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={pricing.surcharges.peakHourSurcharge.active}
                  onChange={(e) => handleSurchargeChange('peakHourSurcharge', 'active', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {pricing.surcharges.peakHourSurcharge.active && (
              <div className="surcharge-details">
                <div className="form-group">
                  <label>Additional Percentage (%)</label>
                  <input
                    type="number"
                    value={pricing.surcharges.peakHourSurcharge.percentage}
                    onChange={(e) => handleSurchargeChange('peakHourSurcharge', 'percentage', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="surcharge-card">
            <div className="surcharge-header">
              <h4>🛡️ Insurance Add-on</h4>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={pricing.surcharges.insuranceCharge.active}
                  onChange={(e) => handleSurchargeChange('insuranceCharge', 'active', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {pricing.surcharges.insuranceCharge.active && (
              <div className="surcharge-details">
                <div className="form-group">
                  <label>Additional Percentage (%)</label>
                  <input
                    type="number"
                    value={pricing.surcharges.insuranceCharge.percentage}
                    onChange={(e) => handleSurchargeChange('insuranceCharge', 'percentage', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Preview */}
        <section className="settings-section preview-section">
          <h3>💡 Price Calculation Preview</h3>
          <div className="preview-card">
            <div className="preview-row">
              <span>10 km ride (default time)</span>
              <strong>₹{(pricing.baseFare + (pricing.tierRates.tier2.ratePerKm * 4)).toFixed(0)}</strong>
            </div>
            <div className="preview-row">
              <span>10 km ride (with night surcharge)</span>
              <strong>₹{(pricing.baseFare + (pricing.tierRates.tier2.ratePerKm * 4) * (1 + pricing.surcharges.nightSurcharge.percentage / 100)).toFixed(0)}</strong>
            </div>
            <div className="preview-row">
              <span>2-hour booking</span>
              <strong>₹{pricing.hourlyRate * 2}</strong>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            {loading ? 'Saving...' : '💾 Save Pricing Settings'}
          </button>
          <button
            type="button"
            onClick={() => fetchPricingSettings()}
            disabled={loading}
            className="btn btn-outline btn-lg"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
