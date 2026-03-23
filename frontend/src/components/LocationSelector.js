import React, { useState, useMemo } from 'react';
import '../styles/LocationSelector.css';

// India location data - States, Cities, Pincodes
const INDIA_LOCATIONS = {
  'Andhra Pradesh': {
    'Hyderabad': ['500001', '500002', '500003', '500004', '500005'],
    'Vijayawada': ['520001', '520002', '520003'],
    'Visakhapatnam': ['530001', '530002', '530003']
  },
  'Delhi': {
    'New Delhi': ['110001', '110002', '110003', '110004', '110005'],
    'Delhi': ['110006', '110007', '110008', '110009', '110010']
  },
  'Georgia': {
    'Bangalore': ['560001', '560002', '560003', '560004', '560005'],
    'Mysore': ['570001', '570002', '570003'],
    'Pune': ['411001', '411002', '411003']
  },
  'Maharashtra': {
    'Mumbai': ['400001', '400002', '400003', '400004', '400005'],
    'Pune': ['411001', '411002', '411003'],
    'Nagpur': ['440001', '440002', '440003']
  },
  'Tamil Nadu': {
    'Chennai': ['600001', '600002', '600003', '600004', '600005'],
    'Coimbatore': ['641001', '641002', '641003'],
    'Madurai': ['625001', '625002', '625003']
  },
  'Uttar Pradesh': {
    'Lucknow': ['226001', '226002', '226003'],
    'Kanpur': ['208001', '208002', '208003'],
    'Varanasi': ['221001', '221002', '221003']
  },
  'West Bengal': {
    'Kolkata': ['700001', '700002', '700003', '700004', '700005'],
    'Howrah': ['711101', '711102', '711103'],
  }
};

export default function LocationSelector({ 
  onLocationSelect = null, 
  initialState = null, 
  initialCity = null, 
  initialPincode = null,
  showPincode = true 
}) {
  const [selectedState, setSelectedState] = useState(initialState || '');
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [selectedPincode, setSelectedPincode] = useState(initialPincode || '');
  const [searchState, setSearchState] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showPincodeDropdown, setShowPincodeDropdown] = useState(false);

  const states = Object.keys(INDIA_LOCATIONS);

  const filteredStates = useMemo(() => {
    return states.filter(state =>
      state.toLowerCase().includes(searchState.toLowerCase())
    );
  }, [searchState]);

  const cities = useMemo(() => {
    return selectedState ? Object.keys(INDIA_LOCATIONS[selectedState]) : [];
  }, [selectedState]);

  const filteredCities = useMemo(() => {
    return cities.filter(city =>
      city.toLowerCase().includes(searchCity.toLowerCase())
    );
  }, [cities, searchCity]);

  const pincodes = useMemo(() => {
    return selectedCity && selectedState ? 
      INDIA_LOCATIONS[selectedState][selectedCity] || [] : 
      [];
  }, [selectedState, selectedCity]);

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedCity('');
    setSelectedPincode('');
    setSearchState('');
    setShowStateDropdown(false);
    onLocationSelect?.({ state, city: '', pincode: '' });
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSelectedPincode('');
    setSearchCity('');
    setShowCityDropdown(false);
    onLocationSelect?.({ state: selectedState, city, pincode: '' });
  };

  const handlePincodeSelect = (pincode) => {
    setSelectedPincode(pincode);
    setShowPincodeDropdown(false);
    onLocationSelect?.({ state: selectedState, city: selectedCity, pincode });
  };

  return (
    <div className="location-selector">
      {/* State Selector */}
      <div className="location-field">
        <label>State *</label>
        <div className="dropdown-wrapper">
          <input
            type="text"
            className="location-input"
            placeholder="Search or select state..."
            value={showStateDropdown ? searchState : selectedState}
            onChange={(e) => setSearchState(e.target.value)}
            onFocus={() => setShowStateDropdown(true)}
            onBlur={() => setTimeout(() => setShowStateDropdown(false), 200)}
            autoComplete="off"
          />
          {showStateDropdown && (
            <div className="dropdown-menu">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <div
                    key={state}
                    className={`dropdown-item ${selectedState === state ? 'selected' : ''}`}
                    onClick={() => handleStateSelect(state)}
                  >
                    {state}
                  </div>
                ))
              ) : (
                <div className="dropdown-item disabled">No states found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* City Selector */}
      <div className="location-field" style={{ opacity: selectedState ? 1 : 0.5 }}>
        <label>City *</label>
        <div className="dropdown-wrapper">
          <input
            type="text"
            className="location-input"
            placeholder="Search or select city..."
            value={showCityDropdown ? searchCity : selectedCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onFocus={() => selectedState && setShowCityDropdown(true)}
            onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
            disabled={!selectedState}
            autoComplete="off"
          />
          {showCityDropdown && selectedState && (
            <div className="dropdown-menu">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <div
                    key={city}
                    className={`dropdown-item ${selectedCity === city ? 'selected' : ''}`}
                    onClick={() => handleCitySelect(city)}
                  >
                    {city}
                  </div>
                ))
              ) : (
                <div className="dropdown-item disabled">No cities found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pincode Selector */}
      {showPincode && (
        <div className="location-field" style={{ opacity: selectedCity ? 1 : 0.5 }}>
          <label>Pincode</label>
          <div className="dropdown-wrapper">
            <input
              type="text"
              className="location-input"
              placeholder="Select pincode..."
              value={selectedPincode}
              onFocus={() => selectedCity && setShowPincodeDropdown(true)}
              onBlur={() => setTimeout(() => setShowPincodeDropdown(false), 200)}
              disabled={!selectedCity}
              readOnly
            />
            {showPincodeDropdown && selectedCity && (
              <div className="dropdown-menu">
                {pincodes.length > 0 ? (
                  pincodes.map((pincode) => (
                    <div
                      key={pincode}
                      className={`dropdown-item ${selectedPincode === pincode ? 'selected' : ''}`}
                      onClick={() => handlePincodeSelect(pincode)}
                    >
                      {pincode}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-item disabled">No pincodes available</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {(selectedState || selectedCity || selectedPincode) && (
        <div className="selection-summary">
          <strong>📍 Selected:</strong> {selectedState} {selectedCity && `> ${selectedCity}`} {selectedPincode && `(${selectedPincode})`}
        </div>
      )}
    </div>
  );
}
