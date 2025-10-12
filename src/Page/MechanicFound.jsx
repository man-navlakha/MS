import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Clock, Phone, Home } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import AdBanner from '../components/AdBanner'; // adjust path if needed


export default function MechanicFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastMessage } = useWebSocket();

  const { mechanic: initialMechanic, estimatedTime: initialETA } = location.state || {};
  const [mechanic] = useState(initialMechanic);
  const [estimatedTime, setEstimatedTime] = useState(initialETA);
  const [userLocation, setUserLocation] = useState(null);
  const [mechanicLocation, setMechanicLocation] = useState(
    initialMechanic
      ? { lat: initialMechanic.current_latitude, lng: initialMechanic.current_longitude }
      : null
  );

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mechanicMarkerRef = useRef(null);

  const trackUserLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true }
    );
  };

  const initializeMap = () => {
    if (!window.maplibregl || !mapContainerRef.current || mapInstanceRef.current) return;
    const map = new window.maplibregl.Map({
      container: mapContainerRef.current,
      center: mechanicLocation || { lat: 28.6139, lng: 77.2090 },
      zoom: 13,
      style: `https://api.maptiler.com/maps/streets/style.json?key=wf1HtIzvVsvPfvNrhwPz`,
    });

    map.on('load', () => trackUserLocation());

    mapInstanceRef.current = map;
  };

  const loadMapSDK = () => {
    if (window.maplibregl) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@1.15.2/dist/maplibre-gl.js';
    script.async = true;
    script.onload = () => initializeMap();
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.href = 'https://unpkg.com/maplibre-gl@1.15.2/dist/maplibre-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  useEffect(() => {
    loadMapSDK();
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.maplibregl) return;

    // Update user marker
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      } else {
        userMarkerRef.current = new window.maplibregl.Marker({ color: 'blue' })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      }
    }

    // Update mechanic marker
    if (mechanicLocation) {
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.setLngLat([mechanicLocation.lng, mechanicLocation.lat]);
      } else {
        mechanicMarkerRef.current = new window.maplibregl.Marker({ color: 'green' })
          .setLngLat([mechanicLocation.lng, mechanicLocation.lat])
          .addTo(map);
      }
    }

    // Fit bounds
    if (userLocation && mechanicLocation) {
      const bounds = new window.maplibregl.LngLatBounds();
      bounds.extend([userLocation.lng, userLocation.lat]);
      bounds.extend([mechanicLocation.lng, mechanicLocation.lat]);
      map.fitBounds(bounds, { padding: 80 });
    }
  }, [userLocation, mechanicLocation]);

  useEffect(() => {
    if (lastMessage?.type === 'mechanic_location_update') {
      setMechanicLocation({
        lat: lastMessage.latitude,
        lng: lastMessage.longitude,
      });
    }

    if (lastMessage?.type === 'eta_update') {
      setEstimatedTime(lastMessage.eta);
    }
  }, [lastMessage]);

  const handleCallMechanic = () => {
    if (mechanic?.phone_number) {
      window.open(`tel:${mechanic.phone_number}`);
    }
  };

  const handleGoHome = () => navigate('/');

  if (!mechanic) {
    navigate('/');
    return null;
  }

  return (
    <>
  {/* Top Status Header */}
  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-5 shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">
          {estimatedTime ? `Arriving in ${estimatedTime} mins` : 'Calculating arrival time...'}
        </h1>
        <p className="text-sm opacity-90">Your mechanic is en route</p>
      </div>
      <div className="bg-white p-2 rounded-full text-green-600 shadow">
        <Clock size={24} />
      </div>
    </div>
  </div>

  {/* Main Content */}
  <div className="min-h-screen bg-gray-100 flex flex-col gap-4 p-4">

    {/* Mechanic Info Card */}
    <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
      {mechanic.Mechanic_profile_pic ? (
        <img
          src={mechanic.Mechanic_profile_pic}
          alt="Mechanic"
          className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
        />
      ) : (
        <User className="w-16 h-16 p-3 bg-gray-200 rounded-full text-green-600" />
      )}
      <div className="flex flex-col flex-grow">
        <h3 className="text-lg font-bold">
          {mechanic.first_name} {mechanic.last_name}
        </h3>
        <p className="text-sm text-gray-500">Verified Mechanic</p>
      </div>
      <button
        onClick={handleCallMechanic}
        className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-xl hover:bg-green-600 text-sm"
      >
        <Phone size={16} />
        <span className="hidden md:inline">{mechanic.phone_number}</span>
      </button>
    </div>

    {/* ETA + Call */}
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow">
        <Clock className="text-green-600" />
        <div>
          <p className="font-semibold text-sm">
            {estimatedTime ? `${estimatedTime} mins` : 'Calculating...'}
          </p>
          <p className="text-xs text-gray-500">ETA</p>
        </div>
      </div>
      <button
        onClick={handleCallMechanic}
        className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-2xl shadow hover:bg-green-600"
      >
        <Phone size={20} />
        <span>Call Mechanic</span>
      </button>
    </div>

    {/* Map Container */}
    <div className="rounded-2xl overflow-hidden border shadow">
      <div
        ref={mapContainerRef}
        className="w-full h-64 md:h-80"
        style={{ minHeight: '360px' }}
      />
    </div>
<AdBanner />
    {/* Actions */}
    <div className="flex flex-col gap-3 mt-4">
      <button
        onClick={handleGoHome}
        className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl font-semibold flex items-center justify-center gap-2 text-gray-800 shadow-sm"
      >
        <Home size={20} />
        Back to Home
      </button>
      <button
        onClick={handleGoHome}
        className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
      >
        Cancel Request
      </button>
    </div>
  </div>
</>

  );
}
