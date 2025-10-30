// src/Page/MechanicFound.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
// ✨ ADDED MapPin and Wrench
import { Car, Bike , Truck , Clock, Phone, Wifi, WifiOff, X, MapPin, Wrench, NotebookPen } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import AdBanner from '../components/AdBanner';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const ACTIVE_JOB_STORAGE_KEY = 'activeJobData';
// ✨ ADDED localStorage key for form data
const FORM_STORAGE_KEY = 'punctureRequestFormData';


// --- ✨ ADDED: Haversine distance calculation ---
/**
 * Calculates the great-circle distance between two points
 * on the Earth (specified in decimal degrees).
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculates ETA in minutes based on distance and average speed.
 */
function calculateETA(userCoords, mechCoords) {
  if (!userCoords || !mechCoords) {
    return null;
  }
  const distance = getDistanceFromLatLonInKm(
    userCoords.lat,
    userCoords.lng,
    mechCoords.lat,
    mechCoords.lng
  );
  // Assume average speed of 30 km/h (0.5 km/min) in city traffic
  const avgSpeedKmh = 30;
  const timeHours = distance / avgSpeedKmh;
  const timeMinutes = Math.round(timeHours * 60);

  // Add a 5-minute buffer for starting off
  return timeMinutes + 5;
}
// --- END: Haversine functions ---


// Reusable ConnectionStatus Component (No changes)
const ConnectionStatus = () => {
  const { connectionStatus } = useWebSocket();
  const neumorphicShadow = "shadow-[5px_5px_10px_#b8bec9,_-5px_-5px_10px_#ffffff]";

  let statusContent;
  switch (connectionStatus) {
    case 'connected':
      statusContent = <div className="flex items-center text-green-600"><Wifi size={16} className="mr-2" /><span>Connected</span></div>;
      break;
    case 'connecting':
      statusContent = <div className="flex items-center text-yellow-600"><Clock size={16} className="mr-2 animate-spin" /><span>Connecting...</span></div>;
      break;
    default:
      statusContent = <div className="flex items-center text-red-600"><WifiOff size={16} className="mr-2" /><span>Disconnected</span></div>;
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-slate-200 px-4 py-2 rounded-full text-sm font-semibold z-20 ${neumorphicShadow}`}>
      {statusContent}
    </div>
  );
};


export default function MechanicFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { request_id: paramRequestId } = useParams();

  // --- Neumorphism Style Constants ---
  const baseBg = "bg-slate-200";
  const primaryTextColor = "text-slate-700";
  const secondaryTextColor = "text-slate-500";
  const neumorphicShadow = "shadow-[8px_8px_16px_#b8bec9,_-8px_-8px_16px_#ffffff]";
  const neumorphicInsetShadow = "shadow-[inset_6px_6px_12px_#b8bec9,_inset_-6px_-6px_12px_#ffffff]";
  const buttonActiveShadow = `active:shadow-[inset_4px_4px_8px_#b8bec9,_inset_-4px_-4px_8px_#ffffff]`;

  // Function to get initial state from either location or localStorage
  const getInitialState = () => {
    // 1. Prioritize navigation state (if user just arrived)
    if (location.state) {
      // For Customer: mechanic details are passed directly
      if (location.state.mechanic) {
        return {
          mechanic: location.state.mechanic,
          jobDetails: null, // This is fine, we get job details from form data
          request_id: location.state.requestId || paramRequestId,
        };
      }
      // For Mechanic: full job details are passed
      if (location.state.jobDetails) {
        return {
          mechanic: location.state.jobDetails.assigned_mechanic,
          jobDetails: location.state.jobDetails,
          request_id: location.state.requestId || paramRequestId,
        };
      }
    }

    // 2. Fallback to localStorage (on page refresh)
    try {
      // This key only stores MECHANIC data
      const savedJobData = JSON.parse(localStorage.getItem(ACTIVE_JOB_STORAGE_KEY));
      if (savedJobData && savedJobData.request_id === paramRequestId) {
        return savedJobData;
      }
    } catch (error) {
      console.error("Failed to parse job data from localStorage", error);
    }

    return { mechanic: null, jobDetails: null, request_id: paramRequestId };
  };

  const [initialState] = useState(getInitialState());
  const [mechanic, setMechanic] = useState(initialState.mechanic);
  const [jobDetails] = useState(initialState.jobDetails); // This is for mechanic view, keep it.
  
  // ✨ ADDED: State for user's job request details
  const [jobRequestDetails, setJobRequestDetails] = useState(null);
  
  // ✨ MODIFIED: States for user location, mechanic location, and ETA
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [mechanicLocation, setMechanicLocation] = useState(() => {
    // Set initial mechanic location from mechanic data
    if (initialState.mechanic?.current_latitude && initialState.mechanic?.current_longitude) {
      return { lat: initialState.mechanic.current_latitude, lng: initialState.mechanic.current_longitude };
    }
    return null;
  });
  const [userLocation, setUserLocation] = useState(null); // Will be { lat, lng }

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const username = "User"; // Replace with actual logged-in username

  const { socket, lastMessage } = useWebSocket();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mechanicMarkerRef = useRef(null);

  const clearActiveJobData = () => {
    localStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
    // ✨ Also clear the form data, as the job is no longer active
    localStorage.removeItem(FORM_STORAGE_KEY);
  };

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (mechanic && paramRequestId) {
      // This just saves the mechanic/active job data
      const jobData = { mechanic, jobDetails, request_id: paramRequestId };
      localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(jobData));
    }
  }, [mechanic, jobDetails, paramRequestId]);
  

  // ✨ ADDED: Load job and user data from localStorage on mount
  useEffect(() => {
    try {
      const savedJobRequest = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedJobRequest) {
        const data = JSON.parse(savedJobRequest);
        setJobRequestDetails(data);
        if (data.latitude && data.longitude) {
          setUserLocation({ lat: data.latitude, lng: data.longitude });
        }
      } else {
        toast.error("Could not load your job details.");
      }
    } catch (e) {
      console.error("Failed to load job request data", e);
      toast.error("Error reading job details.");
    }
  }, []); // Runs once on mount


  // Handle WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    // Handle location updates
    if (lastMessage.type === 'mechanic_location_update' && lastMessage.request_id?.toString() === paramRequestId) {
      console.log(`[MechanicFound] Received location update for job ${paramRequestId}:`, {
        lat: lastMessage.latitude,
        lng: lastMessage.longitude
      });
      setMechanicLocation({ lat: lastMessage.latitude, lng: lastMessage.longitude });
      // ETA will be recalculated by the other useEffect
      return; // Message handled
    }

    // Handle other job-specific messages
    if (lastMessage.request_id?.toString() !== paramRequestId) {
      // If it's not a location update AND not for this job, ignore it.
      return;
    }

    switch (lastMessage.type) {
      // ✨ REMOVED 'eta_update' case, we calculate it now
      // case 'eta_update':
      //   setEstimatedTime(lastMessage.eta);
      //   break;
      case 'job_completed':
      case 'job_cancelled':
      case 'job_cancelled_notification':
        toast.success(lastMessage.message || "The request has been resolved.");
        clearActiveJobData();
        navigate('/');
        break;
      case 'no_mechanic_found':
        toast.error(lastMessage.message || "The mechanic could not be found.");
        clearActiveJobData();
        navigate('/');
        break;
      default:
        console.log('[MechanicFound] Ignored message type:', lastMessage.type);
        break;
    }
  }, [lastMessage, navigate, paramRequestId]);


  // ✨ ADDED: Calculate ETA whenever user or mechanic location changes
  useEffect(() => {
    if (userLocation && mechanicLocation) {
      const eta = calculateETA(userLocation, mechanicLocation);
      setEstimatedTime(eta);
    }
  }, [userLocation, mechanicLocation]);


  // Initialize and update the map
  useEffect(() => {
    // ✨ Wait for userLocation and mechanicLocation to be loaded
    if (!mapContainerRef.current || !mechanic || !userLocation || !mechanicLocation) return;
    
    if (!mapInstanceRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        // ✨ Center between user and mechanic
        center: [
          (userLocation.lng + mechanicLocation.lng) / 2,
          (userLocation.lat + mechanicLocation.lat) / 2
        ],
        zoom: 13,
        style: `https://api.maptiler.com/maps/streets/style.json?key=wf1HtIzvVsvPfvNrhwPz`,
      });
      mapInstanceRef.current = map;

      map.on('load', () => {
        // User Marker
        const userEl = document.createElement('img');
        userEl.src = '/ms.png'; // Assuming this is the user icon
        userEl.style.width = '35px';
        userEl.style.height = '35px';
        userEl.style.borderRadius = '50%';
        userEl.style.border = '3px solid #10b981';
        userMarkerRef.current = new maplibregl.Marker(userEl)
          .setLngLat([userLocation.lng, userLocation.lat]) // ✨ Use userLocation state
          .addTo(map);

        // Mechanic Marker
        const mechanicEl = document.createElement('img');
        mechanicEl.src = mechanic.Mechanic_profile_pic || '/ms.png';
        mechanicEl.style.width = '35px';
        mechanicEl.style.height = '35px';
        mechanicEl.style.objectFit = 'cover';
        mechanicEl.style.borderRadius = '50%';
        mechanicEl.style.border = '3px solid #3b82f6';
        mechanicMarkerRef.current = new maplibregl.Marker(mechanicEl)
          .setLngLat([mechanicLocation.lng, mechanicLocation.lat]) // ✨ Use mechanicLocation state
          .addTo(map);

        fitMapToMarkers();
      });
    }

    // Update mechanic marker position
    if (mechanicLocation && mechanicMarkerRef.current) {
      mechanicMarkerRef.current.setLngLat([mechanicLocation.lng, mechanicLocation.lat]);
      fitMapToMarkers();
    }
    
    // Update user marker position (though it shouldn't change)
    if (userLocation && userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }

  // ✨ Add userLocation to dependency array
  }, [mechanic, mechanicLocation, userLocation]);

  const fitMapToMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation || !mechanicLocation) return;
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([userLocation.lng, userLocation.lat]);
    bounds.extend([mechanicLocation.lng, mechanicLocation.lat]);
    map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mechanic) {
        toast.error("Could not find active job details.");
        clearActiveJobData();
        navigate('/');
      }
    }, 1000); // Allow a moment for state to settle
    return () => clearTimeout(timer);
  }, [mechanic, navigate]);

  const handleCallMechanic = () => {
    if (mechanic?.phone_number) {
      window.open(`tel:${mechanic.phone_number}`);
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedReason) return toast.error("Please select a reason for cancellation.");

    try {
      await api.post(`jobs/CancelServiceRequest/${paramRequestId}/`, {
        cancellation_reason: `${username} - ${selectedReason}`,
      });

      if (socket && socket.readyState === WebSocket.OPEN) {
        const cancelMessage = {
          type: 'cancel_request',
          request_id: parseInt(paramRequestId)
        };
        socket.send(JSON.stringify(cancelMessage));
      }

      clearActiveJobData();
      toast.success("Service request cancelled.");
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Cancellation failed.";
      toast.error(errorMessage);
    } finally {
      setCancelModalOpen(false);
    }
  };



  if (!mechanic) {
    return (
      <div className={`min-h-screen ${baseBg} flex items-center justify-center ${primaryTextColor}`}>
        Loading job details...
      </div>
    );
  }

  return (
    <>
      <ConnectionStatus />
      <div className={`min-h-screen ${baseBg} ${primaryTextColor} pt-28 font-sans`}>
        <div className="fixed top-0 left-0 right-0 z-10">
          <div className={`${baseBg} rounded-b-3xl p-5 ${neumorphicShadow} flex items-center justify-between`}>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {/* ✨ MODIFIED: Show calculated ETA */}
                {estimatedTime ? `Arriving in ~${estimatedTime} mins` : 'Calculating ETA...'}
              </h1>
              <p className={`${secondaryTextColor} text-sm`}>Your mechanic is on the way</p>
            </div>
            <div className={`p-3 rounded-full ${neumorphicInsetShadow}`}>
              <Clock size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="flex flex-col p-3 gap-5">
          {/* Mechanic Info Card (No changes) */}
          <div className={`${baseBg} rounded-3xl ${neumorphicShadow} p-5 flex items-center gap-4`}>
            <img
              src={mechanic.Mechanic_profile_pic || '/ms.png'}
              alt="Mechanic"
              className="w-16 h-16 rounded-full object-cover border-4 border-slate-200 shadow-md"
            />
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-slate-800">{mechanic.first_name} {mechanic.last_name}</h3>
              <p className={`text-sm ${secondaryTextColor}`}>Verified Mechanic</p>
            </div>
            <button
              onClick={handleCallMechanic}
              className={`${baseBg} p-3 rounded-full transition-all duration-200 ${neumorphicShadow} ${buttonActiveShadow}`}
            >
              <Phone size={20} className="text-green-600" />
            </button>
          </div>

          {/* ✨ ADDED: Job Details Card ✨ */}
          {jobRequestDetails && (
            <div className={`${baseBg} rounded-3xl ${neumorphicShadow} p-5 flex flex-col gap-3`}>
              <h3 className="text-lg font-bold text-slate-800">Your Request Details</h3>
              
              <div className="flex items-center gap-3">
                <Wrench size={18} className={secondaryTextColor} />
                <span className="font-medium">{jobRequestDetails.problem}</span>
              </div>
              
             <div className="flex items-center gap-3">
  {jobRequestDetails.vehicleType === "car" && (
    <Car size={18} className={secondaryTextColor} />
  )}
  {jobRequestDetails.vehicleType === "bike" && (
    <Bike size={18} className={secondaryTextColor} />
  )}
  {jobRequestDetails.vehicleType === "truck" && (
    <Truck size={18} className={secondaryTextColor} />
  )}
  <span className="font-medium capitalize">
    {jobRequestDetails.vehicleType}
  </span>
</div>

              {jobRequestDetails.additionalNotes && 
              <div className="flex items-start gap-3">
                <NotebookPen size={18} className={`${secondaryTextColor} mt-1 flex-shrink-0`} />
                <span className="text-sm">{jobRequestDetails.additionalNotes}</span>
              </div>
              }

              <div className="flex items-start gap-3">
                <MapPin size={18} className={`${secondaryTextColor} mt-1 flex-shrink-0`} />
                <span className="text-sm">{jobRequestDetails.location}</span>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className={`rounded-3xl p-2 ${neumorphicInsetShadow}`}>
            <div ref={mapContainerRef} className="w-full h-80 rounded-2xl" />
          </div>

          {/* ✨ ADDED: Job Details Card ✨ */}
          {jobRequestDetails && (
            <div className={`${baseBg} rounded-3xl ${neumorphicShadow} p-5 flex flex-col gap-3`}>
              <AdBanner />
            </div>
          )}
          

          {/* Action Buttons */}
          <div className="flex flex-col mb-32 gap-4 mt-2">
            <button
              onClick={() => setCancelModalOpen(true)}
              className={`${baseBg} w-full py-4 rounded-xl font-semibold text-red-600 transition-all duration-200 ${neumorphicShadow} ${buttonActiveShadow} flex items-center justify-center gap-2`}
            >
              <X size={20} />
              Cancel Request
            </button>
          </div>
        </div>
      </div>

      {/* Cancellation Modal (No changes) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-200 bg-opacity-25 z-50 flex items-center justify-center p-4">
          <div className={`${baseBg} w-full max-w-md p-6 rounded-3xl ${neumorphicShadow}`}>
            <h2 className="text-lg font-bold mb-5 text-slate-800">Why are you cancelling?</h2>
            <div className="space-y-3">
              {['Mechanic delayed', 'Changed my mind', 'Found help elsewhere', 'Other'].map((reason) => (
                <div
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 font-medium ${selectedReason === reason
                    ? `text-red-600 ${neumorphicInsetShadow}`
                    : `${neumorphicShadow} hover:text-blue-600`
                    }`}
                >
                  {reason}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className={`${baseBg} px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${neumorphicShadow} ${buttonActiveShadow}`}
              >
                Go Back
              </button>
              <button
                disabled={!selectedReason}
                onClick={handleCancelConfirm}
                className={`${baseBg} px-5 py-2 text-red-600 rounded-lg font-semibold transition-all duration-200 ${neumorphicShadow} ${buttonActiveShadow} disabled:opacity-50 disabled:text-slate-400 disabled:shadow-none`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}