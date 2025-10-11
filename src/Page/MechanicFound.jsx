import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, Clock, User, Phone, Home, CheckCircle } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

export default function MechanicFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastMessage } = useWebSocket();

  const { mechanic: initialMechanic, estimatedTime } = location.state || {};

  const [mechanic] = useState(initialMechanic);
  const [userLocation, setUserLocation] = useState(null);
  const [mechanicLocation, setMechanicLocation] = useState(
    initialMechanic ? { lat: initialMechanic.current_latitude, lng: initialMechanic.current_longitude } : null
  );

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mechanicMarkerRef = useRef(null);

  const MAPPLS_KEY = "a645f44a39090467aa143b8da31f6dbd";

  // --- Map Initialization and Live Location Tracking ---
  useEffect(() => {
    let isMounted = true;
    let watchId;

    const initializeMap = () => {
      if (!mapContainerRef.current || !window.mappls || mapInstanceRef.current) return;
      try {
        const map = new window.mappls.Map(mapContainerRef.current, {
          center: mechanicLocation || { lat: 23.0225, lng: 72.5714 },
          zoom: 12,
        });
        mapInstanceRef.current = map;
        // Start tracking user location only after map is ready
        trackUserLocation();
      } catch (error) {
        console.error("❌ Error creating map instance:", error);
      }
    };

    const loadSDK = () => {
      if (window.mappls && window.mappls.Map) {
        if (isMounted) initializeMap();
        return;
      }
      if (document.getElementById("mappls-sdk")) {
        document.getElementById("mappls-sdk").addEventListener('load', () => {
          if (isMounted) initializeMap();
        });
        return;
      }
      const script = document.createElement("script");
      script.id = "mappls-sdk";
      script.src = `https://apis.mappls.com/advancedmaps/api/${MAPPLS_KEY}/map_sdk?layer=vector&v=3.0`;
      script.async = true;
      script.defer = true;
      script.onload = () => { if (isMounted) initializeMap(); };
      script.onerror = () => console.error("❌ Failed to load Mappls SDK");
      document.head.appendChild(script);
    };

    const trackUserLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        watchId = navigator.geolocation.watchPosition(
            (position) => setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            }),
            (error) => console.error("Geolocation error:", error),
            { enableHighAccuracy: true }
        );
    };
    
    loadSDK();

    return () => {
      isMounted = false;
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [MAPPLS_KEY, mechanicLocation]); // Depend on mechanicLocation to set initial center

  // --- WebSocket Message Handling ---
  useEffect(() => {
    if (lastMessage?.type === 'mechanic_location_update') {
      setMechanicLocation({
        lat: lastMessage.latitude,
        lng: lastMessage.longitude,
      });
    }
  }, [lastMessage]);

  // --- Map Marker and Viewport Updates ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.mappls) return;

    // Update user marker
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      } else {
        userMarkerRef.current = new window.mappls.Marker({
          map: map,
          position: userLocation,
          html: `<div style="font-size:1.8rem;">📍</div>`,
        });
      }
    }
    
    // Update mechanic marker
    if (mechanicLocation) {
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.setLngLat([mechanicLocation.lng, mechanicLocation.lat]);
      } else {
        mechanicMarkerRef.current = new window.mappls.Marker({
          map: map,
          position: mechanicLocation,
          html: `<div style="font-size:1.8rem;">🔧</div>`,
        });
      }
    }

    // Adjust map view
    if (userLocation && mechanicLocation) {
      const bounds = new window.mappls.LngLatBounds();
      bounds.extend([userLocation.lng, userLocation.lat]);
      bounds.extend([mechanicLocation.lng, mechanicLocation.lat]);
      map.fitBounds(bounds, { padding: 80 });
    } else if (userLocation) {
      map.setCenter(userLocation);
    } else if (mechanicLocation) {
      map.setCenter(mechanicLocation);
    }
  }, [userLocation, mechanicLocation]);
  
  if (!mechanic) {
    navigate('/');
    return null;
  }
  
  const handleGoHome = () => navigate('/');
  const handleCallMechanic = () => {
    if (mechanic?.phone_number) {
      window.open(`tel:${mechanic.phone_number}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-0 md:p-4 font-sans">
      <div className="w-full max-w-2xl h-screen md:h-auto md:max-h-[90vh] flex flex-col">
        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full flex-grow h-1/2 md:h-[400px] md:rounded-t-xl bg-slate-700" />
        
        {/* Details Container */}
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="bg-slate-800/80 backdrop-blur-md md:rounded-b-xl shadow-2xl p-6"
        >
          {/* Header */}
          <div className="text-center mb-4">
             <div className="flex justify-center mb-3">
              <div className="p-2 rounded-full bg-green-500/20 text-green-400">
                <CheckCircle size={28} />
              </div>
            </div>
            <h1 className="text-xl font-bold">Mechanic Assigned!</h1>
            <p className="text-slate-400 text-sm">Your mechanic is on the way.</p>
          </div>

          {/* Mechanic Details */}
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                {mechanic.Mechanic_profile_pic ? (
                  <img src={mechanic.Mechanic_profile_pic} alt="Mechanic" className="w-16 h-16 rounded-full object-cover border-2 border-green-500" />
                ) : (
                  <User className="text-green-400 w-16 h-16 p-3 bg-slate-800 rounded-full" />
                )}
                <div>
                  <h3 className="font-bold text-lg">{mechanic.first_name} {mechanic.last_name}</h3>
                  <p className="text-green-300 text-sm">Verified Mechanic</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
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
                    className="flex items-center gap-3 p-3 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                >
                    <Phone size={20} />
                    <div>
                        <span className="font-semibold block">Call Now</span>
                        <span className="text-xs text-green-200">Contact Mechanic</span>
                    </div>
                </button>
            </div>
          </div>
          
          {/* Home Button */}
          <div className="mt-6">
             <button
              onClick={handleGoHome}
              className="w-full py-3 px-4 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}