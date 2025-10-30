import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Loader2, Search, Navigation, Crosshair } from 'lucide-react';
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
      setPosition(lat, lng);
      map.flyTo([lat, lng], map.getZoom());
    },
    locationfound(e) {
      const { lat, lng } = e.latlng;
      setPosition(lat, lng);
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
          setPosition(lat, lng);
        },
      }}
    />
  ) : null;
};

const PlacePickerGujarat = ({ value = {}, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [usingMappls, setUsingMappls] = useState(true);

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
      setQuery(addr);
    }
  }, [value]);

  // **CORRECTED Mappls Search Function**
  // This now uses the "Advanced Maps" (geo_code) API which works with your static MAPPLS_KEY.
  const searchPlacesWithMappls = async (q) => {
    if (!q || q.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setUsingMappls(true);

    try {
      // Use the Mappls API endpoint that works with the static key
      const response = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/geo_code?address=${encodeURIComponent(q)}&filter=country:IND`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Mappls search successful (geo_code):', data);
        
        // This API returns a 'results' array
        if (data.results && data.results.length > 0) {
          
          // Client-side filter for Gujarat, as the API filter is not always strict
          const gujaratResults = data.results.filter(place => 
            (place.state && place.state.toLowerCase() === 'gujarat') ||
            (place.formattedAddress && place.formattedAddress.toLowerCase().includes('gujarat'))
          );

          if (gujaratResults.length > 0) {
              setResults(gujaratResults);
          } else {
              console.log('No Gujarat results from Mappls, trying OSM...');
              await searchPlacesWithOSM(q);
          }
        } else {
          console.log('No results from Mappls, trying OSM...');
          await searchPlacesWithOSM(q);
        }
      } else {
        console.warn('Mappls API (geo_code) returned error, falling back to OSM:', response.status);
        await searchPlacesWithOSM(q);
      }
    } catch (error) {
      console.warn('Mappls search (geo_code) failed, falling back to OSM:', error);
      await searchPlacesWithOSM(q); // Fallback on catch
    } finally {
      setIsSearching(false);
    }
  };

  // OpenStreetMap Search (Fallback)
  const searchPlacesWithOSM = async (q) => {
    try {
      const viewbox = '68.0,24.7,74.5,20.0'; // Gujarat bounding box
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Gujarat')}&format=json&countrycodes=in&viewbox=${viewbox}&bounded=1&limit=8`
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setUsingMappls(false);
      } else {
        throw new Error('OSM search failed');
      }
    } catch (error) {
      console.error('OSM search error:', error);
      setLocationError('Failed to search locations. Please check your connection.');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (val.length >= 3) {
      setTypingTimeout(setTimeout(() => searchPlacesWithMappls(val), 800));
    } else {
      setResults([]);
    }
  };

  // Mappls Reverse Geocoding (This was already correct)
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
    setQuery(finalAddress);

    if (onChange) {
      onChange({
        address: finalAddress,
        latitude: lat,
        longitude: lon,
      });
    }

    setResults([]);
    setLocationError('');
  };

  const handleSelect = (place) => {
    let lat, lon, placeName;
    
    // Handle Mappls format (from Autosuggest - not used here but good to keep)
    if (place.latitude !== undefined && place.longitude !== undefined) {
      lat = parseFloat(place.latitude);
      lon = parseFloat(place.longitude);
      placeName = place.place_name || place.formatted_address || place.address;
    }  
    // Handle OSM format
    else if (place.lat && place.lon && place.display_name) {
      lat = parseFloat(place.lat);
      lon = parseFloat(place.lon);
      placeName = place.display_name;
    }
    // Handle Mappls geo_code format (This is the one we are using)
    else if (place.lat !== undefined && place.lon !== undefined) {
      lat = parseFloat(place.lat);
      lon = parseFloat(place.lon);
      placeName = place.formattedAddress || place.address;
    }
    else {
      console.error('Unknown place format:', place);
      return;
    }
    
    updatePosition(lat, lon, placeName);
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

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  // Format result display based on data source
  const getPlaceDisplayName = (place) => {
    // Mappls geo_code format
    if (place.formattedAddress) return place.formattedAddress.split(',')[0];
    // Mappls Autosuggest format
    if (place.place_name) return place.place_name;
    if (place.address) return place.address.split(',')[0];
    
    // OSM format
    if (place.display_name) return place.display_name.split(',')[0];
    
    return 'Unknown location';
  };

  const getPlaceAddress = (place) => {
    // Mappls geo_code format
    if (place.formattedAddress) return place.formattedAddress.split(',').slice(1).join(',');
    // Mappls Autosuggest format
    if (place.address) return place.address;
    
    // OSM format
    if (place.display_name) return place.display_name.split(',').slice(1).join(',');
    
    return '';
  };

  // Safe position access with fallback
  const safePosition = position || [23.0225, 72.5714];
  const safeAddress = address || 'No location selected';

  return (
    <div className="w-full space-y-4">
      {/* Search Section */}
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            {usingMappls ? '🔍' : '🗺️'} <strong>
              {usingMappls ? 'Powered by MapMyIndia' : 'Using OpenStreetMap'}
            </strong>: Search for locations in Gujarat
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations in Gujarat (e.g., Gandhi Market, Surat)"
            value={query}
            onChange={handleInputChange}
            className="w-full pl-10 pr-10 py-3 bg-gray-200 text-gray-700 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="bg-gray-200 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] overflow-hidden">
            <div className="max-h-32 overflow-y-auto space-y-1 p-2">
              {results.map((place, index) => (
                <div
                  key={place.place_id || place.eLoc || place.osm_id || index}
                  className="p-2 rounded-md hover:bg-gray-300 cursor-pointer transition-colors"
                  onClick={() => handleSelect(place)}
                >
                  <div className="font-medium text-sm flex items-start">
                    <MapPin className="h-3 w-3 mt-1 mr-2 flex-shrink-0" />
                    <span>{getPlaceDisplayName(place)}</span>
                  </div>
                  <div className="text-xs text-gray-600 truncate ml-5">
                    {getPlaceAddress(place)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSearching && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-gray-600">
              {usingMappls ? 'Searching with MapMyIndia...' : 'Searching with OpenStreetMap...'}
            </span>
          </div>
        )}
      </div>

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

        <button
          type="button"
          onClick={() => updatePosition(23.0225, 72.5714, 'Ahmedabad, Gujarat, India')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] font-semibold hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
        >
          <Navigation className="h-4 w-4" />
          Ahmedabad
        </button>
      </div>
    </div>
  );
};

export default PlacePickerGujarat;