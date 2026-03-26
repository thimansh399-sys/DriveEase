import React, { useRef } from "react";
import { GoogleMap, LoadScript, Autocomplete, Marker } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "300px" };
const center = { lat: 26.8467, lng: 80.9462 }; // Lucknow

export default function LocationSelector({ label, value, onChange }) {
  const autocompleteRef = useRef(null);
  const apiKey = process.env.REACT_APP_GOOGLE_KEY;

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place && place.geometry) {
      onChange({
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
      <div>
        <label>{label}</label>
        <Autocomplete
          onLoad={ref => (autocompleteRef.current = ref)}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder={`Enter ${label}`}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
            defaultValue={value?.address || ""}
          />
        </Autocomplete>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={value?.lat ? { lat: value.lat, lng: value.lng } : center}
          zoom={12}
        >
          {value?.lat && <Marker position={{ lat: value.lat, lng: value.lng }} />}
        </GoogleMap>
      </div>
    </LoadScript>
  );
}
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
