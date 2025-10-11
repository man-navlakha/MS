import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Clock, Phone, Home, CheckCircle } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

export default function MechanicFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastMessage } = useWebSocket();

  const { mechanic: initialMechanic, estimatedTime } = location.state || {};
  const [mechanic] = useState(initialMechanic);
  const [userLocation, setUserLocation] = useState(null);
  const [mechanicLocation, setMechanicLocation] = useState(initialMechanic ? {
    lat: initialMechanic.current_latitude,
    lng: initialMechanic.current_longitude,
  } : null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mechanicMarkerRef = useRef(null);

  const MAPPLS_KEY = "a645f44a39090467aa143b8da31f6dbd";

  // ⬇ Define trackUserLocation outside useEffect
  const trackUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true }
    );
  };

  const initializeMap = () => {
    if (!window.maplibregl || !mapContainerRef.current || mapInstanceRef.current) {
      console.error("❌ Cannot initialize map");
      return;
    }

    const map = new window.maplibregl.Map({
      container: mapContainerRef.current,
      center: mechanicLocation || { lat: 28.6139, lng: 77.2090 },
      zoom: 13,
      style: `https://api.maptiler.com/maps/streets/style.json?key=wf1HtIzvVsvPfvNrhwPz`,
    });

    map.on('load', () => {
      console.log("✅ Map loaded");
      trackUserLocation();
    });

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
  script.onload = () => {
    setTimeout(() => {
      initializeMap();
    }, 100); // ⏱ Ensure CSS loads too
  };
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

    // 👤 User Marker
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      } else {
        userMarkerRef.current = new window.maplibregl.Marker()
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      }
    }

    // 🔧 Mechanic Marker
    if (mechanicLocation) {
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.setLngLat([mechanicLocation.lng, mechanicLocation.lat]);
      } else {
        mechanicMarkerRef.current = new window.maplibregl.Marker()
          .setLngLat([mechanicLocation.lng, mechanicLocation.lat])
          .addTo(map);
      }
    }

    // Adjust map bounds
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
  }, [lastMessage]);

  const handleEnableLocation = () => {
    if (mapInstanceRef.current) {
      trackUserLocation();
    }
  };

  const handleGoHome = () => navigate('/');
  const handleCallMechanic = () => {
    if (mechanic?.phone_number) {
      window.open(`tel:${mechanic.phone_number}`);
    }
  };

  if (!mechanic) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl h-screen md:h-auto flex flex-col">
       <div
  ref={mapContainerRef}
  className="w-full bg-slate-700 rounded-t-xl"
  style={{ height: '400px', minHeight: '300px' }} // ✅ Fallback height
/>

        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="bg-slate-800/80 p-6 rounded-b-xl"
        >
          <div className="text-center mb-4">
            <div className="flex justify-center mb-3">
              <div className="p-2 rounded-full bg-green-500/20 text-green-400">
                <CheckCircle size={28} />
              </div>
            </div>
            <h1 className="text-xl font-bold">Mechanic Assigned!</h1>
            <p className="text-slate-400 text-sm">Your mechanic is on the way.</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-4">
              {mechanic.Mechanic_profile_pic ? (
                <img src={mechanic.Mechanic_profile_pic} alt="Mechanic" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="text-green-400 w-16 h-16 p-3 bg-slate-800 rounded-full" />
              )}
              <div>
                <h3 className="font-bold text-lg">{mechanic.first_name} {mechanic.last_name}</h3>
                <p className="text-green-300 text-sm">Verified Mechanic</p>
                <button
                  onClick={handleEnableLocation}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Enable Location
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            {estimatedTime && (
              <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                <Clock className="text-green-400" size={20} />
                <div>
                  <span className="font-semibold block">{estimatedTime} min</span>
                  <span className="text-xs text-slate-400">Est. Arrival</span>
                </div>
              </div>
            )}
            <button
              onClick={handleCallMechanic}
              className="flex items-center gap-3 p-3 bg-green-600 hover:bg-green-500 rounded-lg"
            >
              <Phone size={20} />
              <div>
                <span className="font-semibold block">Call Now</span>
                <span className="text-xs text-green-200">Contact Mechanic</span>
              </div>
            </button>
          </div>

          <button
            onClick={handleGoHome}
            className="w-full py-3 px-4 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  );
}
