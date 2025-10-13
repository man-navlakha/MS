import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { User, Clock, Phone, Home } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import AdBanner from '../components/AdBanner';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

// Key for storing active job data in localStorage
const ACTIVE_JOB_STORAGE_KEY = 'activeJobData';

export default function MechanicFound() {
  const navigate = useNavigate();
  const location = useLocation();
  // Get request_id from URL parameters
  const { request_id: paramRequestId } = useParams();

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const username = "test_user"; // This should be replaced with the actual logged-in username

  const { socket, lastMessage } = useWebSocket();

  // --- State Initialization with LocalStorage Fallback ---

  // Function to load initial state, prioritizing localStorage, then router state
  const getInitialState = () => {
    try {
      const savedJobData = JSON.parse(localStorage.getItem(ACTIVE_JOB_STORAGE_KEY));
      // Ensure the saved data is for the current job
      if (savedJobData && savedJobData.request_id === paramRequestId) {
        return savedJobData;
      }
    } catch (error) {
      console.error("Failed to parse job data from localStorage", error);
    }
    // Fallback to the state passed via router navigation
    return {
      mechanic: location.state?.mechanic || null,
      estimatedTime: location.state?.estimatedTime || null,
      mechanicLocation: location.state?.mechanic
        ? { lat: location.state.mechanic.current_latitude, lng: location.state.mechanic.current_longitude }
        : null,
      request_id: paramRequestId || null,
    };
  };

  const [mechanic, setMechanic] = useState(getInitialState().mechanic);
  const [estimatedTime, setEstimatedTime] = useState(getInitialState().estimatedTime);
  const [mechanicLocation, setMechanicLocation] = useState(getInitialState().mechanicLocation);
  const [request_id] = useState(paramRequestId || getInitialState().request_id);

  const [userLocation, setUserLocation] = useState(null);

  // Refs for map elements
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mechanicMarkerRef = useRef(null);

  // --- Helper Functions ---

  // Clears the job data from localStorage
  const clearActiveJobData = () => {
    localStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
  };

  // --- useEffect Hooks for Core Logic ---

  // Effect to save state to localStorage on any change
  useEffect(() => {
    if (mechanic && request_id) {
      const jobData = {
        mechanic,
        estimatedTime,
        mechanicLocation,
        request_id,
      };
      localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(jobData));
    }
  }, [mechanic, estimatedTime, mechanicLocation, request_id]);

  // Effect to handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log("WebSocket Message Received:", lastMessage);

    switch (lastMessage.type) {
      case 'mechanic_location_update':
        setMechanicLocation({
          lat: lastMessage.latitude,
          lng: lastMessage.longitude,
        });
        break;
      case 'eta_update':
        setEstimatedTime(lastMessage.eta);
        break;
      case 'job_completed':
        toast.success(lastMessage.message || "Your mechanic has completed the job.");
        clearActiveJobData();
        navigate('/');
        break;
      case 'job_cancelled_notification':
      case 'job_cancelled':
        toast.error(lastMessage.message || "The request has been cancelled.");
        clearActiveJobData();
        navigate('/');
        break;
      default:
        // Do nothing for unknown message types
        break;
    }
  }, [lastMessage, navigate]);

  // Effect to send a heartbeat message periodically
  useEffect(() => {
    const sendHeartbeat = (jobId) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
          type: "user_heartbeat",
          job_id: jobId,
        };
        socket.send(JSON.stringify(message));
        console.log("Sent heartbeat for job:", jobId);
      }
    }

    if (socket && request_id) {
      // Send a heartbeat every 30 seconds to keep the connection alive
      const heartbeatInterval = setInterval(() => sendHeartbeat(request_id), 30000);
      // Clean up the interval when the component unmounts
      return () => clearInterval(heartbeatInterval);
    }
  }, [socket, request_id]);


  // Effect for initializing and loading the map SDK
  useEffect(() => {
    const loadMapSDK = () => {
      if (window.maplibregl) {
        initializeMap();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@1.15.2/dist/maplibre-gl.js';
      script.async = true;
      script.onload = initializeMap;
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://unpkg.com/maplibre-gl@1.15.2/dist/maplibre-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    };

    const initializeMap = () => {
      if (!window.maplibregl || !mapContainerRef.current || mapInstanceRef.current) return;
      const map = new window.maplibregl.Map({
        container: mapContainerRef.current,
        center: mechanicLocation || { lat: 28.6139, lng: 77.2090 }, // Default to a central location
        zoom: 13,
        style: `https://api.maptiler.com/maps/streets/style.json?key=wf1HtIzvVsvPfvNrhwPz`,
      });
      map.on('load', trackUserLocation);
      mapInstanceRef.current = map;
    };

    const trackUserLocation = () => {
      if (!navigator.geolocation) return toast.error("Geolocation is not supported by your browser.");
      navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Location tracking error:", error),
        { enableHighAccuracy: true }
      );
    };

    loadMapSDK();
  }, [mechanicLocation]); // Rerun if mechanic location is loaded from storage

  // Effect for updating map markers and bounds
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

    // Fit map bounds to show both markers
    if (userLocation && mechanicLocation) {
      const bounds = new window.maplibregl.LngLatBounds();
      bounds.extend([userLocation.lng, userLocation.lat]);
      bounds.extend([mechanicLocation.lng, mechanicLocation.lat]);
      map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    }
  }, [userLocation, mechanicLocation]);


  // --- Event Handlers ---

  const handleCallMechanic = () => {
    if (mechanic?.phone_number) {
      window.open(`tel:${mechanic.phone_number}`);
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedReason) {
        toast.error("Please select a reason for cancellation.");
        return;
    }
    try {
      await api.post(`jobs/CancelServiceRequest/${request_id}/`, {
        cancellation_reason: username + " " + selectedReason,
      });
      clearActiveJobData(); // Clear storage on successful cancellation
      toast.success("Service request cancelled.");
      alert("Service request cancelled.")
      navigate('/');
    } catch (error) {
      console.error("Failed to cancel service request:", error);
      const errorMessage = error.response?.data?.message || "Cancellation failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setCancelModalOpen(false);
    }
  };

  const handleGoHome = () => navigate('/');

  // --- Render Logic ---

  // Effect to navigate home if no mechanic data is available after checks
  useEffect(() => {
    if (!mechanic) {
      navigate('/');
    }
  }, [mechanic, navigate]);
  
  if (!mechanic) {
    return null; // Render nothing while redirecting
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

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md mx-4 p-6 rounded-xl shadow-lg relative">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Why are you cancelling?</h2>
            <div className="space-y-3">
              {['Mechanic delayed', 'Changed my mind', 'Found help elsewhere', 'Other'].map((reason) => (
                <div
                  key={reason}
                  className={`w-full px-4 py-2 rounded-lg border cursor-pointer transition ${selectedReason === reason
                    ? 'bg-red-100 border-red-400 text-red-700'
                    : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  onClick={() => setSelectedReason(reason)}
                >
                  {reason}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
              >
                Go Back
              </button>
              <button
                disabled={!selectedReason}
                onClick={handleCancelConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handleGoHome}
            className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl font-semibold flex items-center justify-center gap-2 text-gray-800 shadow-sm"
          >
            <Home size={20} />
            Back to Home
          </button>
          <button
            onClick={() => setCancelModalOpen(true)}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
          >
            Cancel Request
          </button>
        </div>
      </div>
    </>
  );
}
