import React, { useState, useEffect, useRef } from 'react';
import '../styles/LiveMapView.css';

export default function LiveMapView({ drivers = [], selectedDriver = null, onDriverSelect = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    // Initialize map with Google Maps API
    if (!window.google) {
      setMapError('Google Maps API not loaded');
      setLoading(false);
      return;
    }

    try {
      // Default center (India)
      const defaultCenter = { lat: 28.6139, lng: 77.2090 };

      if (!map.current) {
        map.current = new window.google.maps.Map(mapContainer.current, {
          zoom: 12,
          center: defaultCenter,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e8f1f5' }]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.fill',
              stylers: [{ color: '#ffffff' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#ffffff' }]
            }
          ]
        });

        // Handle map click
        map.current.addListener('click', () => {
          onDriverSelect?.(null);
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
      setLoading(false);
    }
  }, [onDriverSelect]);

  // Update driver markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    Object.values(markers.current).forEach(marker => marker.setMap(null));
    markers.current = {};

    // Add markers for drivers
    drivers.forEach(driver => {
      if (!markers.current[driver.id]) {
        const marker = new window.google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map: map.current,
          title: driver.name,
          icon: {
            url: '/driver-icon.png',
            scaledSize: new window.google.maps.Size(40, 40)
          }
        });

        marker.addListener('click', () => {
          if (onDriverSelect) onDriverSelect(driver);
        });

        markers.current[driver.id] = marker;
      } else {
        markers.current[driver.id].setPosition({ lat: driver.lat, lng: driver.lng });
      }
    });

    // Fit bounds if multiple drivers
    if (drivers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      drivers.forEach(driver => {
        if (driver.location?.latitude && driver.location?.longitude) {
          bounds.extend({
            lat: parseFloat(driver.location.latitude),
            lng: parseFloat(driver.location.longitude)
          });
        }
      });
      map.current.fitBounds(bounds);
    }
  }, [drivers, onDriverSelect]);

  if (loading) return <div>Loading map...</div>;
  if (mapError) return <div>Error: {mapError}</div>;

  return <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />;
}
