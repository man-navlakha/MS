import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftPanel from "../components/Leftpenal";

const MainPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [locationStatus, setLocationStatus] = useState("getting");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const MAPPLS_KEY = "a645f44a39090467aa143b8da31f6dbd";

  // Load Mappls SDK
  useEffect(() => {
    const loadSDK = () => {
      if (document.getElementById("mappls-sdk") || window.mappls) {
        initializeMap();
        return;
      }

      const script = document.createElement("script");
      script.id = "mappls-sdk";
      script.src = `https://apis.mappls.com/advancedmaps/api/${MAPPLS_KEY}/map_sdk?layer=vector&v=3.0`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => setMapStatus("error");

      document.head.appendChild(script);
    };

    loadSDK();
  }, []);

  // Initialize map
  const initializeMap = () => {
    if (!window.mappls || !mapRef.current) return;

    const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi fallback
    const mapInstance = new window.mappls.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: true,
    });

    setMap(mapInstance);
    setMapStatus("loaded");
    getUserLocation(mapInstance);
  };

  // Get user's live location
  const getUserLocation = (mapInstance) => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      setShowLocationPrompt(true);
      return;
    }

    setLocationStatus("getting");
    setShowLocationPrompt(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPosition(pos);
        setLocationStatus("success");

        // Center and mark position
        mapInstance.setCenter(pos);
        new window.mappls.Marker({
          map: mapInstance,
          position: pos,
          html: `<div style="font-size:1.8rem;">📍</div>`,
        });
      },
      (error) => {
        console.error("Location error:", error.message);
        setShowLocationPrompt(true);
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Handle retry button
  const handleEnableLocation = () => {
    if (map) getUserLocation(map);
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Map Container */}
      <div ref={mapRef} id="map" className="absolute inset-0 -z-0" />

      {/* Left Panel (over map) */}
      <div className="absolute top-20 left-4 z-10">
        <LeftPanel />
      </div>

      {/* Map Status */}
      {mapStatus === "loading" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-800 px-4 py-2 rounded-md shadow-md">
          Loading map...
        </div>
      )}

      {/* Location Prompt */}
      {showLocationPrompt && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg shadow-lg max-w-md z-20">
          <h3 className="text-lg font-semibold mb-2">Enable Location Access</h3>
          <p className="text-sm mb-3">
            Please allow location access in your browser settings to view your live position.
          </p>
          <button
            onClick={handleEnableLocation}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default MainPage;
