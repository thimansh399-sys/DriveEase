import React, { useRef } from "react";
import { GoogleMap, LoadScript, Autocomplete, Marker } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "300px" };
const center = { lat: 26.8467, lng: 80.9462 }; // Lucknow

export default function LocationSelector({ label, value, onChange }) {
  const autocompleteRef = useRef(null);
  const apiKey = process.env.REACT_APP_GOOGLE_KEY;

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace?.();
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
          onLoad={(ref) => {
            autocompleteRef.current = ref;
          }}
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
