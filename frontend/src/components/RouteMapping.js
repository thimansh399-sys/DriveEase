import React, { useState, useEffect, useRef } from 'react';
import '../styles/RouteMapping.css';

export default function RouteMapping({ 
  pickupLocation = null, 
  dropoffLocation = null, 
  driverLocation = null,
  onRouteData = null 
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const routePath = useRef(null);
  const pickupMarker = useRef(null);
  const dropoffMarker = useRef(null);
  const driverMarker = useRef(null);

  useEffect(() => {
    if (!window.google) {
      setError('Google Maps API not loaded');
      setLoading(false);
      return;
    }

    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: 13,
        center: { lat: 28.6139, lng: 77.2090 },
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!map.current || !pickupLocation || !dropoffLocation) return;

    plotRoute();
  }, [pickupLocation, dropoffLocation, driverLocation]);

  const plotRoute = async () => {
    try {
      setLoading(true);
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map.current,
        polylineOptions: {
          strokeColor: '#667eea',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });

      const pickupLatLng = new window.google.maps.LatLng(
        pickupLocation.latitude,
        pickupLocation.longitude
      );

      const dropoffLatLng = new window.google.maps.LatLng(
        dropoffLocation.latitude,
        dropoffLocation.longitude
      );

      // Request directions
      const request = {
        origin: pickupLatLng,
        destination: dropoffLatLng,
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      const result = await new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      directionsRenderer.setDirections(result);

      const route = result.routes[0];
      const leg = route.legs[0];

      const routeData = {
        distance: leg.distance.value / 1000, // Convert to km
        duration: leg.duration.value / 60, // Convert to minutes
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        polyline: result.routes[0].overview_polyline
      };

      setRouteInfo(routeData);
      onRouteData?.(routeData);

      // Add pickup marker
      if (pickupMarker.current) pickupMarker.current.setMap(null);
      pickupMarker.current = new window.google.maps.Marker({
        position: pickupLatLng,
        map: map.current,
        title: 'Pickup Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });

      // Add dropoff marker
      if (dropoffMarker.current) dropoffMarker.current.setMap(null);
      dropoffMarker.current = new window.google.maps.Marker({
        position: dropoffLatLng,
        map: map.current,
        title: 'Dropoff Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });

      // Add driver marker if provided
      if (driverLocation) {
        const driverLatLng = new window.google.maps.LatLng(
          driverLocation.latitude,
          driverLocation.longitude
        );

        if (driverMarker.current) driverMarker.current.setMap(null);
        driverMarker.current = new window.google.maps.Marker({
          position: driverLatLng,
          map: map.current,
          title: 'Driver Location',
          icon: {
            path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
            fillColor: '#667eea',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
            scale: 2,
            anchor: { x: 12, y: 12 }
          }
        });
      }

      // Fit bounds
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(pickupLatLng);
      bounds.extend(dropoffLatLng);
      if (driverLocation) {
        bounds.extend(new window.google.maps.LatLng(
          driverLocation.latitude,
          driverLocation.longitude
        ));
      }
      map.current.fitBounds(bounds, 50);

      setLoading(false);
    } catch (err) {
      console.error('Error plotting route:', err);
      setError('Failed to calculate route');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="route-error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="route-mapping-container">
      <div ref={mapContainer} className="route-map"></div>

      {loading && (
        <div className="route-loading">
          <div className="spinner"></div>
          <p>Calculating route...</p>
        </div>
      )}

      {routeInfo && (
        <div className="route-info-card">
          <div className="route-header">
            <h3>📍 Route Information</h3>
          </div>

          <div className="route-details">
            <div className="detail-row">
              <span className="detail-label">📏 Distance</span>
              <span className="detail-value">{routeInfo.distanceText}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">⏱️ Duration</span>
              <span className="detail-value">{routeInfo.durationText}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">💰 Estimated Fare</span>
              <span className="detail-value" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                ₹{(50 + (routeInfo.distance * 15)).toFixed(0)}
              </span>
            </div>
          </div>

          <div className="route-legend">
            <div className="legend-item">
              <span className="legend-marker pickup"></span> Pickup
            </div>
            <div className="legend-item">
              <span className="legend-marker dropoff"></span> Dropoff
            </div>
            {driverLocation && (
              <div className="legend-item">
                <span className="legend-marker driver"></span> Driver
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
