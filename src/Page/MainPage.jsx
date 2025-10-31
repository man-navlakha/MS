// src/Page/MainPage.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftPanel from "../components/Leftpenal";
import { ArrowRight } from 'lucide-react';
import api from "../utils/api";
// Key for storing active job data in localStorage (must match MechanicFound.jsx)
const MainPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [locationStatus, setLocationStatus] = useState("getting");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [activeJob, setActiveJob] = useState(null);

  const MAPPLS_KEY = "a645f44a39090467aa143b8da31f6dbd";

  // Check for an active job in localStorage when the component mounts
useEffect(() => {
    const checkForJobAndSync = async () => {
      let jobIdFromStorage = null;

      // First, check localStorage for an active job ID.
      try {
        const savedJobDataString = localStorage.getItem('activeJobData');
        if (savedJobDataString) {
          const savedJobData = JSON.parse(savedJobDataString);
          if (savedJobData && savedJobData.request_id) {
            jobIdFromStorage = savedJobData.request_id;
          }
        }
      } catch (error) {
        console.error("Could not parse job data from localStorage.", error);
      
      }

      if (jobIdFromStorage) {
        try {
          console.log("Found job in localStorage, syncing with server...");
          const { data } = await api.get("/jobs/SyncActiveJob/");
          console.log("5. Received data from Sync API:", data);

          if (data && data.message === 'No active job found.') {
            console.log("Server confirms no active job. Clearing stale data.");
  
            setActiveJob(null);
            return;
          }

          // Case 1: The user is a CUSTOMER with a PENDING job
          if (data.status === 'PENDING' && data.job_id) {
            console.log("Navigating: Customer, PENDING job.");
            navigate(`/finding/${data.job_id}`);
          
          // Case 2: The user is a CUSTOMER with an ACCEPTED job (API sends mechanic details)
          // We check for properties unique to the mechanic data (like `first_name` and `phone_number`)
          // and crucially, we reuse the `jobIdFromStorage` we already have.
          } else if (data.first_name && data.phone_number && !data.status) {
            console.log("Navigating: Customer, ACCEPTED job.");
            
            const jobDataToStore = {
              mechanic: data,
              request_id: jobIdFromStorage, // Use the ID from localStorage
              mechanicLocation: (data.current_latitude && data.current_longitude)
                ? { lat: data.current_latitude, lng: data.current_longitude }
                : null,
              estimatedTime: null
            };
            
            navigate(`/mechanic-found/${jobIdFromStorage}`, { // Use the ID from localStorage
              state: { mechanic: data, requestId: jobIdFromStorage }
            });

          } else {
             console.log("API response did not match any known navigation conditions.");
          }
        } catch (error) {
          if (error.response?.status !== 401) {
            console.error("Failed to sync active job with the server:", error);
          }
          setActiveJob(null);
        }
      } else {
        console.log("No active job found in localStorage. Skipping API sync.");
        setActiveJob(null);
      }
    };

    checkForJobAndSync();
  }, [navigate]);

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

  // Handle navigating to the active job
  const handleGoToActiveJob = () => {
    if (activeJob && activeJob.request_id) {
      navigate(`/mechanic-found/${activeJob.request_id}`);
    }
  };


  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Active Job Banner */}
      {activeJob && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-md">
          <button
            onClick={handleGoToActiveJob}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between hover:bg-green-700 transition-transform active:scale-95"
          >
            <div className="text-left">
              <p className="font-bold">A job is currently in progress!</p>
              <p className="text-sm opacity-90">Click to view mechanic's location.</p>
            </div>
            <ArrowRight size={20} />
          </button>
        </div>
      )}


      {/* Map Container */}
      <div ref={mapRef} id="map" className="absolute inset-0 -z-0" />

      {/* Left Panel (over map) */}
      <div className="absolute top-20 left-4 z-10">
        <LeftPanel activeJob={activeJob} />
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