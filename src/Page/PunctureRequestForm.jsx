// PunctureRequestFormRedesigned.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Car,
  Bike,
  Truck,
  MapPin,
  Wrench,
  Check,
  Navigation,
  Loader,
  CircleHelp
} from 'lucide-react';

// Main Component
export default function PunctureRequestFormRedesigned() {
  const [step, setStep] = useState(1);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapStatus, setMapStatus] = useState("idle"); // "idle", "loading", "loaded", "error"
  const [locationStatus, setLocationStatus] = useState("idle"); // "idle", "getting", "success", "error"
  const [formData, setFormData] = useState({
    vehicleType: '',
    location: '',
    latitude: null,
    longitude: null,
    problem: '',
    additionalNotes: ''
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const MAPPLS_KEY = "a645f44a39090467aa143b8da31f6dbd";

  const vehicleTypes = [
    { id: 'bike', name: 'Bike/Scooter', icon: Bike },
    { id: 'car', name: 'Car / Sedan', icon: Car },
    { id: 'truck', name: 'Truck / SUV', icon: Truck }
  ];

  const problems = [
    { name: 'Puncture Repair', icon: '🔧' },
    { name: 'Air Fill-up', icon: '💨' },
    { name: 'Battery Jumpstart', icon: '🔋' },
    { name: 'Tire Replacement', icon: '⚙️' },
  ];

 useEffect(() => {
  if (step !== 2) return; // only load map on Step 2

  let isMounted = true;

  const loadSDK = () => {
    // If SDK already loaded, just init map
    if (window.mappls && window.mappls.Map) {
      initializeMap();
      return;
    }

    // Avoid adding duplicate script
    if (document.getElementById("mappls-sdk")) return;

    setMapStatus("loading");
    const script = document.createElement("script");
    script.id = "mappls-sdk";
    script.src = `https://apis.mappls.com/advancedmaps/api/${MAPPLS_KEY}/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("✅ Mappls SDK loaded successfully");
      if (isMounted) initializeMap();
    };
    script.onerror = () => {
      console.error("❌ Failed to load Mappls SDK");
      if (isMounted) setMapStatus("error");
    };

    document.head.appendChild(script);
  };

  const initializeMap = () => {
    // Guard: container must exist
    if (!mapContainerRef.current) {
      console.warn("Map container not ready yet");
      return;
    }
    // Guard: don’t re‑init
    if (mapInstanceRef.current) return;

    try {
      const defaultCenter = { lat: 23.0225, lng: 72.5714 };

      // This is the CORRECT way
const map = new window.mappls.Map(mapContainerRef.current, {
  center: defaultCenter,
  zoom: 14,
  onLoad: () => {
    console.log("✅ Map loaded and ready");
    mapInstanceRef.current = map;
    setMapStatus("loaded");
  },
  onError: (err) => {
    console.error("❌ Map error:", err);
    setMapStatus("error");
  }
});
    } catch (error) {
      console.error("❌ Error creating map instance:", error);
      setMapStatus("error");
    }
  };

  loadSDK();

  return () => {
    isMounted = false;
    if (mapInstanceRef.current) {
      console.log("🧹 Cleaning up map instance...");
      mapInstanceRef.current = null;
      setMapStatus("idle");
    }
  };
}, [step, MAPPLS_KEY]);


  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const mapplsResponse = await fetch(`https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/rev_geocode?lat=${lat}&lng=${lng}`);
      if (mapplsResponse.ok) {
        const data = await mapplsResponse.json();
        if (data?.results?.[0]?.formatted_address) {
          return data.results[0].formatted_address;
        }
      }
    } catch (error) {
      console.error("Mappls geocoding error:", error);
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);
    setLocationStatus("getting");

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      const pos = { lat: latitude, lng: longitude };

      setFormData(prev => ({ ...prev, latitude, longitude, location: "Fetching address..." }));

      const address = await getAddressFromCoordinates(latitude, longitude);
      setFormData(prev => ({ ...prev, location: address }));

      if (mapStatus === 'loaded' && mapInstanceRef.current && window.mappls) {
        mapInstanceRef.current.setCenter(pos);
        new window.mappls.Marker({ map: mapInstanceRef.current, position: pos });
        new window.mappls.Circle({ map: mapInstanceRef.current, center: pos, radius: accuracy });
      }

      setLocationStatus("success");
    } catch (error) {
      console.error("Geolocation error:", error);
      setLocationStatus("error");
      setFormData(prev => ({ ...prev, location: "" }));
      alert("Could not get your location. Please enable location services or enter your address manually.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleManualLocationChange = (e) => {
    setFormData(prev => ({ ...prev, location: e.target.value, latitude: null, longitude: null }));
  };

  const handleNext = () => step < 3 && setStep(step + 1);
  const handlePrev = () => step > 1 && setStep(step - 1);

  const handleSubmit = async () => {
    const getCookie = (name) => {
      let cookieValue = null;
      if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === name + "=") {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    };
    const csrftoken = getCookie("csrftoken");

    try {
      const response = await fetch("/api/jobs/CreateServiceRequest/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
          latitude: formData.latitude,
          longitude: formData.longitude,
          location: formData.location,
          vehical_type: formData.vehicleType,
          problem: formData.problem,
          additional_details: formData.additionalNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Form Submitted:", data);
        alert("Request submitted! We will be in touch shortly.");
      } else {
        alert("Failed to submit request. Please try again.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const canProceed = () => {
    if (step === 1) return !!formData.vehicleType;
    if (step === 2) return formData.location.trim() !== '' && formData.location !== "Fetching address...";
    if (step === 3) return !!formData.problem;
    return false;
  };

  const Step1_Vehicle = () => (
    <StepWrapper title="Select Your Vehicle">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vehicleTypes.map(vehicle => (
          <SelectableCard
            key={vehicle.id}
            label={vehicle.name}
            icon={vehicle.icon}
            isSelected={formData.vehicleType === vehicle.id}
            onClick={() => setFormData({ ...formData, vehicleType: vehicle.id })}
          />
        ))}
      </div>
    </StepWrapper>
  );

  const Step2_Location = () => (
    <StepWrapper title="Confirm Your Location">
      <div className="space-y-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Enter address manually"
            value={formData.location}
            onChange={handleManualLocationChange}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
          />
        </div>
        <button
          onClick={getUserLocation}
          disabled={loadingLocation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 text-white rounded-lg font-semibold transition-colors hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {loadingLocation ? <Loader className="animate-spin" size={20} /> : <Navigation size={20} />}
          {loadingLocation ? "Fetching Location..." : "Use My Current Location"}
        </button>
        <div className="relative h-64 md:h-80 w-full bg-slate-800 rounded-lg border-2 border-slate-700 overflow-hidden">
          {(mapStatus === 'loading' || mapStatus === 'idle') && <MapOverlay icon={Loader} text="Loading Map..." spin />}
          {mapStatus === 'error' && <MapOverlay icon={CircleHelp} text="Map failed to load." />}
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </div>
    </StepWrapper>
  );

  const Step3_Service = () => (
    <StepWrapper title="What Service Do You Need?">
      <div className="grid grid-cols-2 gap-4">
        {problems.map(problem => (
          <SelectableCard
            key={problem.name}
            label={problem.name}
            emoji={problem.icon}
            isSelected={formData.problem === problem.name}
            onClick={() => setFormData({ ...formData, problem: problem.name })}
          />
        ))}
      </div>
      <textarea
        placeholder="Add any additional notes (e.g., 'Front left tire', 'Near the big oak tree')..."
        value={formData.additionalNotes}
        onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
        rows="3"
        className="w-full mt-6 p-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors resize-none"
      />
    </StepWrapper>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Roadside Assistance</h1>
          <p className="text-slate-400 mt-2">Get back on the road in minutes.</p>
        </header>

        <ProgressStepper currentStep={step} />

        <main className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl shadow-2xl shadow-black/20 p-6 md:p-8 min-h-[450px]">
          <AnimatePresence mode="wait">
            {step === 1 && Step1_Vehicle()}
            {step === 2 && Step2_Location()}
            {step === 3 && Step3_Service()}
          </AnimatePresence>
        </main>

        <footer className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-500 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              Submit Request
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

const StepWrapper = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="text-2xl font-semibold mb-6 text-center">{title}</h2>
    {children}
  </motion.div>
);

const SelectableCard = ({ label, icon: Icon, emoji, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`relative group p-4 w-full h-32 flex flex-col items-center justify-center text-center rounded-lg border-2 transition-all duration-200
      ${isSelected
        ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/10'
        : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700/50'
      }`}
  >
    {Icon && <Icon className={`w-10 h-10 mb-2 transition-colors ${isSelected ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'}`} />}
    {emoji && <span className="text-4xl mb-2">{emoji}</span>}
    <span className="font-semibold text-sm text-slate-200">{label}</span>
    {isSelected && (
      <div className="absolute top-2 right-2 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
        <Check size={14} className="text-white" />
      </div>
    )}
  </button>
);

const ProgressStepper = ({ currentStep }) => {
  const steps = [
    { number: 1, title: 'Vehicle', icon: Car },
    { number: 2, title: 'Location', icon: MapPin },
    { number: 3, title: 'Service', icon: Wrench },
  ];

  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => {
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;
        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted ? 'bg-sky-500 border-sky-500 text-white' : ''}
                  ${isActive ? 'bg-sky-500/20 border-sky-500 text-sky-400' : ''}
                  ${!isActive && !isCompleted ? 'bg-slate-700 border-slate-600 text-slate-400' : ''}
                `}
              >
                {isCompleted ? <Check size={24} /> : <step.icon size={24} />}
              </div>
              <p className={`mt-2 text-xs font-semibold transition-colors ${isActive || isCompleted ? 'text-white' : 'text-slate-400'}`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-sky-500' : 'bg-slate-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const MapOverlay = ({ text, icon: Icon, spin = false }) => (
  <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-slate-300">
    <Icon className={`mb-2 ${spin ? 'animate-spin' : ''}`} size={32} />
    <p>{text}</p>
  </div>
);