import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Car, Bike, Clock, Phone, Wifi, WifiOff, X, MapPin, Wrench, NotebookPen } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import AdBanner from '../components/AdBanner';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import OrderDetailsCard from '../components/OrderDetailsCard';

const ACTIVE_JOB_STORAGE_KEY = 'mechanicAcceptedData';
const FORM_STORAGE_KEY = 'punctureRequestFormData';

// --- Haversine Helpers ---
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function calculateETA(userCoords, mechCoords) {
  if (!userCoords || !mechCoords) return null;
  const distance = getDistanceFromLatLonInKm(
    userCoords.lat,
    userCoords.lng,
    mechCoords.lat,
    mechCoords.lng
  );
  const avgSpeedKmh = 30;
  const timeMinutes = Math.round((distance / avgSpeedKmh) * 60);
  return timeMinutes + 1;
}

// --- Connection Status Badge ---
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
  const buttonActiveShadow = "active:shadow-[inset_4px_4px_8px_#b8bec9,_inset_-4px_-4px_8px_#ffffff]";

  // --- Initial State Loader ---
  const getInitialState = () => {
    if (location.state) {
      if (location.state.mechanic) {
        const data = {
          mechanic: location.state.mechanic,
          jobDetails: null,
          request_id: location.state.requestId || paramRequestId,
        };
        localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
      if (location.state.jobDetails) {
        const data = {
          mechanic: location.state.jobDetails.assigned_mechanic,
          jobDetails: location.state.jobDetails,
          request_id: location.state.requestId || paramRequestId,
        };
        localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }

    try {
      const saved = JSON.parse(localStorage.getItem(ACTIVE_JOB_STORAGE_KEY));
      if (saved && (saved.request_id === paramRequestId || !saved.request_id)) {
        console.log("🧩 Restored mechanic data from localStorage:", saved);
        return saved;
      }
    } catch (err) {
      console.error("❌ Failed to parse localStorage mechanic data:", err);
    }

    return { mechanic: null, jobDetails: null, request_id: paramRequestId };
  };

  // --- State ---
  const [initialState] = useState(getInitialState());
  const [mechanic, setMechanic] = useState(initialState.mechanic);
  const [jobDetails] = useState(initialState.jobDetails);
  const [jobRequestDetails, setJobRequestDetails] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [mechanicLocation, setMechanicLocation] = useState(() =>
    initialState.mechanic?.current_latitude
      ? { lat: initialState.mechanic.current_latitude, lng: initialState.mechanic.current_longitude }
      : null
  );
  const [userLocation, setUserLocation] = useState(null);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const username = "User";

  const { socket, lastMessage } = useWebSocket();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mechanicMarkerRef = useRef(null);

  // --- Helpers ---
  const clearActiveJobData = () => {
    localStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
    localStorage.removeItem(FORM_STORAGE_KEY);
  };

  // Persist mechanic to storage
  useEffect(() => {
    if (mechanic && paramRequestId) {
      const data = { mechanic, jobDetails, request_id: paramRequestId };
      localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(data));
    }
  }, [mechanic, jobDetails, paramRequestId]);

  // Load user form data (from localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setJobRequestDetails(data);
        if (data.latitude && data.longitude) {
          setUserLocation({ lat: data.latitude, lng: data.longitude });
        }
      } else {
        toast.error("Could not load your job details.");
      }
    } catch (err) {
      console.error("Error loading job request data", err);
      toast.error("Error reading job details.");
    }
  }, []);

  // WebSocket Message Handling
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'mechanic_location_update' &&
        lastMessage.request_id?.toString() === paramRequestId) {
      setMechanicLocation({ lat: lastMessage.latitude, lng: lastMessage.longitude });
      return;
    }

    if (lastMessage.request_id?.toString() !== paramRequestId) return;

    switch (lastMessage.type) {
      case 'job_completed':
      case 'job_cancelled':
      case 'job_cancelled_notification':
        toast.success(lastMessage.message || "The request has been resolved.");
        clearActiveJobData();
        navigate('/');
        break;
      case 'no_mechanic_found':
        toast.error(lastMessage.message || "No mechanic could be found.");
        clearActiveJobData();
        navigate('/');
        break;
      default:
        break;
    }
  }, [lastMessage, navigate, paramRequestId]);

  // Recalculate ETA
  useEffect(() => {
    if (userLocation && mechanicLocation) {
      const eta = calculateETA(userLocation, mechanicLocation);
      setEstimatedTime(eta);
    }
  }, [userLocation, mechanicLocation]);

  // --- Map Setup ---
  useEffect(() => {
    if (!mapContainerRef.current || !mechanic || !userLocation || !mechanicLocation) return;

    if (!mapInstanceRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        center: [(userLocation.lng + mechanicLocation.lng) / 2, (userLocation.lat + mechanicLocation.lat) / 2],
        zoom: 13,
        style: `https://api.maptiler.com/maps/streets/style.json?key=wf1HtIzvVsvPfvNrhwPz`,
      });
      mapInstanceRef.current = map;

      map.on('load', () => {
        const userEl = document.createElement('img');
        userEl.src = '/ms.png';
        userEl.style.width = '35px';
        userEl.style.height = '35px';
        userEl.style.borderRadius = '50%';
        userEl.style.border = '3px solid #10b981';
        userMarkerRef.current = new maplibregl.Marker(userEl)
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);

        const mechEl = document.createElement('img');
        mechEl.src = mechanic.Mechanic_profile_pic || '/ms.png';
        mechEl.style.width = '35px';
        mechEl.style.height = '35px';
        mechEl.style.borderRadius = '50%';
        mechEl.style.border = '3px solid #3b82f6';
        mechanicMarkerRef.current = new maplibregl.Marker(mechEl)
          .setLngLat([mechanicLocation.lng, mechanicLocation.lat])
          .addTo(map);

        fitMapToMarkers();
      });
    }

    if (mechanicLocation && mechanicMarkerRef.current) {
      mechanicMarkerRef.current.setLngLat([mechanicLocation.lng, mechanicLocation.lat]);
      fitMapToMarkers();
    }

    if (userLocation && userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
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
    }, 1000);
    return () => clearTimeout(timer);
  }, [mechanic, navigate]);

  const handleCallMechanic = () => {
    if (mechanic?.phone_number) window.open(`tel:${mechanic.phone_number}`);
  };

  const handleCancelConfirm = async () => {
    if (!selectedReason) return toast.error("Please select a reason for cancellation.");
    try {
      await api.post(`jobs/CancelServiceRequest/${paramRequestId}/`, {
        cancellation_reason: `${username} - ${selectedReason}`,
      });
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'cancel_request', request_id: parseInt(paramRequestId) }));
      }
      clearActiveJobData();
      toast.success("Service request cancelled.");
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || "Cancellation failed.");
    } finally {
      setCancelModalOpen(false);
    }
  };

  if (!mechanic) {
    return <div className={`min-h-screen ${baseBg} flex items-center justify-center ${primaryTextColor}`}>Loading job details...</div>;
  }

  return (
    <>
      <ConnectionStatus />
      <div className={`min-h-screen ${baseBg} ${primaryTextColor} pt-28 font-sans`}>
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-10">
          <div className={`${baseBg} rounded-b-3xl p-5 ${neumorphicShadow} flex items-center justify-between`}>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {estimatedTime ? `Arriving in ~${estimatedTime} mins` : 'Calculating ETA...'}
              </h1>
              <p className={`${secondaryTextColor} text-sm`}>Your mechanic is on the way</p>
            </div>
            <div className={`p-3 rounded-full ${neumorphicInsetShadow}`}>
              <Clock size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-3 gap-5">
          {/* Mechanic Info */}
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

          {/* Map */}
          <div className={`rounded-3xl p-2 ${neumorphicInsetShadow}`}>
            <div ref={mapContainerRef} className="w-full h-80 rounded-2xl" />
          </div>

          {/* Job Details */}
          {jobRequestDetails && (
            <div className={`${baseBg} rounded-3xl ${neumorphicShadow} p-3`}>
              <OrderDetailsCard details={jobRequestDetails} />
            </div>
          )}

          {/* Ads */}
          <div className={`${baseBg} rounded-3xl ${neumorphicShadow} p-5 flex flex-col gap-3`}>
            <AdBanner />
          </div>

          {/* Cancel */}
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

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-200 bg-opacity-25 z-50 flex items-center justify-center p-4">
          <div className={`${baseBg} w-full max-w-md p-6 rounded-3xl ${neumorphicShadow}`}>
            <h2 className="text-lg font-bold mb-5 text-slate-800">Why are you cancelling?</h2>
            <div className="space-y-3">
              {['Mechanic delayed', 'Changed my mind', 'Found help elsewhere', 'Other'].map((reason) => (
                <div
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 font-medium ${
                    selectedReason === reason
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
