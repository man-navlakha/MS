import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Loader2, Navigation, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Mappls API Configuration
const MAPPLS_KEY = "a645f44a39090467aa143b8da31f6dbd"; // This is your static REST API Key

// Custom marker icon
const createCustomIcon = () => {
  return L.divIcon({
    html: `<div class="relative">
      <div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
      <div class="absolute inset-0 animate-ping bg-red-400 rounded-full opacity-75"></div>
    </div>`,
    className: 'bg-transparent border-0',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(lat, lng, null); // Pass null for displayName to trigger reverse geocode
      map.flyTo([lat, lng], map.getZoom());
    },
    locationfound(e) {
      const { lat, lng } = e.latlng;
      setPosition(lat, lng, null); // Pass null for displayName to trigger reverse geocode
      map.flyTo([lat, lng], map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <Marker
      position={position}
      icon={createCustomIcon()}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          setPosition(lat, lng, null); // Pass null for displayName to trigger reverse geocode
        },
      }}
    />
  ) : null;
};

const PlacePickerGujarat = ({ value = {}, onChange }) => {
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Initialize position with proper fallback and validation
  const getInitialPosition = () => {
    const lat = parseFloat(value.latitude);
    const lon = parseFloat(value.longitude);

    if (!isNaN(lat) && !isNaN(lon) && lat >= 20 && lat <= 25 && lon >= 68 && lon <= 75) {
      return [lat, lon];
    }
    return [23.0225, 72.5714]; // Default to Ahmedabad
  };

  const [position, setPosition] = useState(getInitialPosition);
  const [address, setAddress] = useState(value.address || '');

  // Sync with parent value
  useEffect(() => {
    const lat = parseFloat(value.latitude);
    const lon = parseFloat(value.longitude);
    const addr = value.address;

    if (!isNaN(lat) && !isNaN(lon) && lat >= 20 && lat <= 25 && lon >= 68 && lon <= 75) {
      const isDifferent = !position || lat !== position[0] || lon !== position[1];
      if (isDifferent) {
        setPosition([lat, lon]);
      }
    }

    if (addr && addr !== address) {
      setAddress(addr);
    }
  }, [value]);

  // Mappls Reverse Geocoding
  const reverseGeocodeWithMappls = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/rev_geocode?lat=${lat}&lng=${lon}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Mappls reverse geocode success:', data);
        
        if (data?.results?.[0]?.formatted_address) {
          return data.results[0].formatted_address;
        }
      }
      
      // Fallback to OSM
      return await reverseGeocodeWithOSM(lat, lon);
    } catch (error) {
      console.warn('Mappls reverse geocoding failed:', error);
      return await reverseGeocodeWithOSM(lat, lon);
    }
  };

  // OpenStreetMap Reverse Geocoding
  const reverseGeocodeWithOSM = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      return data.display_name || `Location at ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch (error) {
      console.error('OSM reverse geocoding error:', error);
      return `Location at ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  const updatePosition = async (lat, lon, displayName = null) => {
    // Validate coordinates for Gujarat region
    if (isNaN(lat) || isNaN(lon) || lat < 20 || lat > 25 || lon < 68 || lon > 75) {
      setLocationError('Selected location is outside Gujarat.');
      return;
    }

    const newPosition = [lat, lon];
    setPosition(newPosition);

    let finalAddress = displayName;
    if (!finalAddress) {
      // Try Mappls first, then fallback to OSM
      finalAddress = await reverseGeocodeWithMappls(lat, lon);
    }

    setAddress(finalAddress);

    if (onChange) {
      onChange({
        address: finalAddress,
        latitude: lat,
        longitude: lon,
      });
    }

    setLocationError('');
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;

        // Check if location is within Gujarat bounds
        if (latitude >= 20 && latitude <= 25 && longitude >= 68 && longitude <= 75) {
          await updatePosition(latitude, longitude);
        } else {
          setLocationError('Your location is outside Gujarat. Please select a location within Gujarat.');
        }
        setIsDetectingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsDetectingLocation(false);
        setLocationError('Unable to retrieve your location. Please ensure location permissions are granted.');
      },
      {
        timeout: 15000,
        enableHighAccuracy: true
      }
    );
  };

  // Safe position access with fallback
  const safePosition = position || [23.0225, 72.5714];
  const safeAddress = address || 'No location selected';

  return (
    <div className="w-full space-y-4">
      
      {/* Map Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Interactive Map</span>
          <span className="text-xs text-gray-500 bg-gray-300 px-2 py-1 rounded">
            Click on map to set location
          </span>
        </div>

        <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
          <MapContainer
            center={safePosition}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="rounded-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={safePosition} setPosition={updatePosition} />
          </MapContainer>
        </div>
      </div>

      {/* Selected Location Display
      {address && (
          <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
              <p><strong>Selected Location:</strong> {address}</p>
          </div>
      )} */}

      {/* Location Error */}
      {locationError && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {locationError}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={detectLocation}
          disabled={isDetectingLocation}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] font-semibold hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition disabled:opacity-50"
        >
          {isDetectingLocation ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4" />
              Current Location
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlacePickerGujarat;