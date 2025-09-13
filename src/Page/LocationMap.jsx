// src/components/LocationMap.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaMapMarkerAlt } from 'react-icons/fa';
import Cookies from 'js-cookie'; // Import the js-cookie library

// Import and configure marker icons (Vite compatible)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const LocationMap = () => {
  // State variables
  const [position, setPosition] = useState([23.0225, 72.5714]); // Default to Ahmedabad
  const [locationName, setLocationName] = useState('Ahmedabad, Gujarat, India');
  const markerRef = useRef(null);
  const mapRef = useRef(null);

  // --- GET USER'S CURRENT LOCATION ---
  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = [latitude, longitude];
        setPosition(newPos);
        mapRef.current.flyTo(newPos, 15);
        reverseGeocode(newPos);
      },
      (err) => {
        console.error("Error getting location:", err);
        alert("Could not fetch your location. Please enable location services.");
      }
    );
  };
  
  // --- REVERSE GEOCODE (COORDINATES TO ADDRESS) ---
  const reverseGeocode = async (coords) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`);
        const data = await response.json();
        setLocationName(data.display_name || 'Unknown Location');
    } catch (error) {
        console.error("Error in reverse geocoding:", error);
        setLocationName('Could not fetch location name');
    }
  }

  // --- DRAGGABLE MARKER LOGIC ---
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          const newCoords = [newPos.lat, newPos.lng];
          setPosition(newCoords);
          reverseGeocode(newCoords);
        }
      },
    }),
    [],
  );

  // --- NEW: CONFIRM LOCATION AND SAVE TO COOKIES ---
  const handleConfirmLocation = () => {
    const locationData = {
        lat: position[0],
        lng: position[1],
        name: locationName
    };
    // Save to cookies for 7 days
    Cookies.set('selectedLocation', JSON.stringify(locationData), { expires: 7 });
    alert(`Location saved!\nLat: ${position[0]}\nLng: ${position[1]}`);
  };

  // Automatically locate user on first load
  useEffect(() => {
    handleLocateMe();
  }, []);

  return (
    <div className="relative h-screen flex flex-col">
      {/* --- SIDEBAR FOR CONTROLS --- */}
      <div className="absolute top-0 left-0 z-[1000] w-full md:w-96 p-4">
        <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
            <h1 className="text-xl font-bold text-gray-800">Location Selector</h1>
            
            {/* Locate Me Button */}
            <button 
              onClick={handleLocateMe} 
              className="w-full flex items-center justify-center p-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <FaMapMarkerAlt className="mr-2" /> Use My Current Location
            </button>
            
            {/* Location Display */}
            <div className="pt-2">
                <p className="text-sm text-gray-500">Selected Location:</p>
                <p className="font-semibold text-gray-800">{locationName}</p>
            </div>
            
            {/* Confirm Location Button */}
            <button
                onClick={handleConfirmLocation}
                className="w-full p-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors"
            >
                Confirm Location
            </button>
        </div>
      </div>
      
      {/* --- MAP CONTAINER --- */}
      <MapContainer 
        center={position} 
        zoom={13} 
        className="h-full w-full z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={position}
          draggable={true}
          eventHandlers={eventHandlers}
          ref={markerRef}
        >
          <Popup>Drag the pin to fine-tune your location.</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LocationMap;