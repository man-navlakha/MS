import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { User, Clock, Phone, Home, Wifi, WifiOff, X } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import AdBanner from '../components/AdBanner';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const ACTIVE_JOB_STORAGE_KEY = 'activeJobData';

// Reusable ConnectionStatus Component with Neumorphic Style
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


  const getInitialState = () => {
    try {
      const savedJobData = JSON.parse(localStorage.getItem(ACTIVE_JOB_STORAGE_KEY));
      if (savedJobData && savedJobData.request_id === paramRequestId) {
        return savedJobData;
      }
    } catch (error) {
      console.error("Failed to parse job data from localStorage", error);
    }
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
  const [userLocation, setUserLocation] = useState({ lat: 23.0225, lng: 72.5714 }); // Default to Ahmedabad

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const username = "test_user";

  const { socket, lastMessage } = useWebSocket();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mechanicMarkerRef = useRef(null);

  const clearActiveJobData = () => localStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);

  useEffect(() => {
    if (mechanic && request_id) {
      const jobData = { mechanic, estimatedTime, mechanicLocation, request_id };
      localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(jobData));
    }
  }, [mechanic, estimatedTime, mechanicLocation, request_id]);

  useEffect(() => {
    if (!lastMessage || lastMessage.request_id !== parseInt(request_id)) return;
    switch (lastMessage.type) {
      case 'mechanic_location_update':
        setMechanicLocation({ lat: lastMessage.latitude, lng: lastMessage.longitude });
        break;
      case 'eta_update':
        setEstimatedTime(lastMessage.eta);
        break;
      case 'job_completed':
        toast.success(lastMessage.message || "Job completed!");
        clearActiveJobData();
        navigate('/');
        break;
      case 'job_cancelled':
        toast.error(lastMessage.message || "The request was cancelled.");
        clearActiveJobData();
        navigate('/');
        break;
      default:
        break;
    }
  }, [lastMessage, navigate, request_id]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !mechanicLocation || !userLocation) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [mechanicLocation.lng, mechanicLocation.lat],
      zoom: 13,
      style: `https://api.maptiler.com/maps/streets/style.json?key=wf1HtIzvVsvPfvNrhwPz`, // Replace with your key
    });
    mapInstanceRef.current = map;

    map.on('load', () => {
      // User Marker
      const userEl = document.createElement('div');
      userEl.style.backgroundImage = 'url(/ms.png)'; // Replace with user icon if available
      userEl.style.width = '35px';
      userEl.style.height = '35px';
      userEl.style.backgroundSize = '100%';
      userEl.style.borderRadius = '50%';
      userEl.style.border = '3px solid #10b981'; // green-600
      userEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      userMarkerRef.current = new maplibregl.Marker(userEl)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);

      // Mechanic Marker
      const mechanicEl = document.createElement('img');
      mechanicEl.src = mechanic.Mechanic_profile_pic || '/ms.png'; // Use mechanic's pic
      mechanicEl.style.width = '35px';
      mechanicEl.style.height = '35px';
      mechanicEl.style.borderRadius = '50%';
      mechanicEl.style.border = '3px solid #3b82f6'; // blue-500
      mechanicEl.style.objectFit = 'cover';
      mechanicEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      mechanicMarkerRef.current = new maplibregl.Marker(mechanicEl)
        .setLngLat([mechanicLocation.lng, mechanicLocation.lat])
        .addTo(map);

      fitMapToMarkers();
    });
  }, [mechanicLocation, userLocation, mechanic]);

  useEffect(() => {
    if (mechanicLocation && mechanicMarkerRef.current) {
      mechanicMarkerRef.current.setLngLat([mechanicLocation.lng, mechanicLocation.lat]);
    }
    fitMapToMarkers();
  }, [mechanicLocation]);


  const fitMapToMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation || !mechanicLocation) return;
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([userLocation.lng, userLocation.lat]);
    bounds.extend([mechanicLocation.lng, mechanicLocation.lat]);
    map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
  };
  
  useEffect(() => {
      // Fallback: If no mechanic data exists, redirect.
      const timer = setTimeout(() => {
          if (!mechanic) {
              toast.error("Could not find active job details.");
              navigate('/');
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [mechanic, navigate]);

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
        cancellation_reason: `${username} - ${selectedReason}`,
      });
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
                      {estimatedTime ? `Arriving in ${estimatedTime} mins` : 'Calculating ETA...'}
                  </h1>
                  <p className={`${secondaryTextColor} text-sm`}>Your mechanic is on the way</p>
              </div>
              <div className={`p-3 rounded-full ${neumorphicInsetShadow}`}>
                  <Clock size={24} className="text-green-600" />
              </div>
          </div>
        </div>

        <div className="flex flex-col p-3 gap-5">
          {/* Mechanic Info Card */}
          <div className={`${baseBg} rounded-3xl ${neumorphicShadow} p-5 flex items-center gap-4`}>
            <img
              src={mechanic.Mechanic_profile_pic || '/default-user.png'}
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

          {/* Map Container */}
          <div className={`rounded-3xl p-2 ${neumorphicInsetShadow}`}>
            <div ref={mapContainerRef} className="w-full h-80 rounded-2xl" />
          </div>

          <AdBanner />

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 mt-2">
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

      {/* Cancellation Modal */}
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