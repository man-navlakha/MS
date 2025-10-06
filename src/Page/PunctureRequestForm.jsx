import React, { useState, useEffect, useRef } from 'react';
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
  Loader
} from 'lucide-react';

export default function PunctureRequestForm() {
  const [step, setStep] = useState(1);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapStatus, setMapStatus] = useState("loading");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [formData, setFormData] = useState({
    vehicleType: '',
    location: '',
    latitude: null,
    longitude: null,
    problem: '',
    additionalNotes: ''
  });

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const MAPPLS_KEY = "a645f44a39090467aa143b8da31f6dbd";

  const vehicleTypes = [
    { id: 'bike', name: 'Bike/Scooter', icon: Bike, description: 'Two-wheeler' },
    { id: 'car', name: 'Car', icon: Car, description: 'Four-wheeler' },
    { id: 'truck', name: 'Truck/SUV', icon: Truck, description: 'Heavy vehicle' }
  ];

  const problems = [
    { name: 'Puncture Repair', icon: '🔧', desc: 'Fix flat tire' },
    { name: 'Fill Air', icon: '💨', desc: 'Inflate tires' },
    { name: 'Battery Jump Start', icon: '🔋', desc: 'Start dead battery' },
    { name: 'Tire Replacement', icon: '⚙️', desc: 'Replace tire' },
    { name: 'Battery Replacement', icon: '🔌', desc: 'New battery' },
    { name: 'Minor Repair', icon: '🛠️', desc: 'Quick fixes' }
  ];

  // Load Mappls SDK
  useEffect(() => {
    const loadSDK = () => {
      if (document.getElementById("mappls-sdk") || window.mappls) {
        console.log("Mappls SDK already loaded");
        setMapStatus("loaded");
        return;
      }

      const script = document.createElement("script");
      script.id = "mappls-sdk";
      script.src = `https://apis.mappls.com/advancedmaps/api/${MAPPLS_KEY}/map_sdk?layer=vector&v=3.0`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Mappls SDK loaded successfully");
        setMapStatus("loaded");
      };
      script.onerror = () => {
        console.error("Failed to load Mappls SDK");
        setMapStatus("error");
      };

      document.head.appendChild(script);
    };

    loadSDK();
  }, [MAPPLS_KEY]);

  // Initialize map when step changes to 2 and SDK is loaded
  useEffect(() => {
    if (step === 2 && mapStatus === "loaded" && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [step, mapStatus]);

  // Initialize Mappls map

// JS
const initializeMap = () => {
  try {
    if (!window.mappls || !window.mappls.Map) {
      console.error("Mappls SDK not ready yet");
      return;
    }
    if (!mapRef.current) {
      console.error("Map container not ready");
      return;
    }

    const map = new window.mappls.Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.2090 },
      zoom: 14,
      zoomControl: true,
    });

    if (!map || typeof map.getCenter !== "function") {
      console.error("Invalid map instance");
      return;
    }

    mapInstanceRef.current = map;

    new window.mappls.Marker({
      map,
      position: { lat: 28.6139, lng: 77.2090 },
      html: "📍",
    });

    console.log("✅ Map initialized successfully");
  } catch (err) {
    console.error("Error initializing map:", err);
  }
};


  // Get address from coordinates using a more reliable geocoding service
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      // Try Mappls reverse geocoding first
      const mapplsResponse = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/rev_geocode?lat=${lat}&lng=${lng}&region=IND&format=json`
      );
      
      if (mapplsResponse.ok) {
        const mapplsData = await mapplsResponse.json();
        if (mapplsData?.results?.[0]?.formatted_address) {
          return mapplsData.results[0].formatted_address;
        }
      }

      // Fallback to OpenStreetMap Nominatim
      const osmResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (osmResponse.ok) {
        const osmData = await osmResponse.json();
        if (osmData.display_name) {
          return osmData.display_name;
        }
      }

      // Final fallback - just return coordinates
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
    } catch (error) {
      console.error("Geocoding error:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Get user's current location
  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    setLocationStatus("getting");

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        });
      });

      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      console.log("Got coordinates:", pos);

      // Update form data with coordinates first
      setFormData(prev => ({
        ...prev,
        latitude: pos.lat,
        longitude: pos.lng,
        location: "Getting address..." // Temporary message
      }));

      // Get address from coordinates
      const address = await getAddressFromCoordinates(pos.lat, pos.lng);
      
      setFormData(prev => ({
        ...prev,
        location: address
      }));

      // Update map position if map is available
      if (mapInstanceRef.current && window.mappls) {
        try {
          mapInstanceRef.current.setCenter(pos);
          
          // Clear existing markers by creating a new marker at current position
          new window.mappls.Marker({
            map: mapInstanceRef.current,
            position: pos,
            html: "📍",
            draggable: false
          });

          // Also add a circle to show accuracy
          new window.mappls.Circle({
            map: mapInstanceRef.current,
            center: pos,
            radius: position.coords.accuracy,
            fillColor: 'rgba(147, 51, 234, 0.2)',
            strokeColor: 'rgba(147, 51, 234, 0.8)',
            strokeWeight: 2
          });

        } catch (mapError) {
          console.error("Error updating map:", mapError);
        }
      }

      setLocationStatus("success");
      console.log("Location success:", address);

    } catch (error) {
      console.error("Geolocation error:", error);
      let errorMessage = 'Unable to get your location. ';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += 'Please allow location access in your browser settings or enter manually.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += 'Location information is unavailable. Please check your device settings.';
          break;
        case error.TIMEOUT:
          errorMessage += 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage += 'An unknown error occurred.';
      }
      
      alert(errorMessage);
      setLocationStatus("error");
      
      // Set fallback location
      setFormData(prev => ({
        ...prev,
        location: "Please enter your location manually"
      }));
    } finally {
      setLoadingLocation(false);
    }
  };

  // Manual location input handler
  const handleManualLocationChange = (e) => {
    const location = e.target.value;
    setFormData(prev => ({ ...prev, location }));
    
    // If user clears the input, also clear coordinates
    if (!location.trim()) {
      setFormData(prev => ({
        ...prev,
        latitude: null,
        longitude: null
      }));
    }
  };

  // Handle map click to set location
  const handleMapClick = (e) => {
    if (!mapInstanceRef.current || !window.mappls) return;
    
    // Note: This would require adding a click event listener to the map
    // For now, we'll rely on the current location button and manual input
  };

  const handleNext = () => step < 3 && setStep(step + 1);
  const handlePrev = () => step > 1 && setStep(step - 1);
  
  const handleSubmit = () => {
    console.log('Form Submitted:', formData);
    alert(`Service request submitted successfully!\n\nVehicle: ${formData.vehicleType}\nLocation: ${formData.location}\nService: ${formData.problem}\n\nWe will contact you shortly.`);
  };

  const canProceed = () => {
    if (step === 1) return formData.vehicleType !== '';
    if (step === 2) return formData.location.trim() !== '' && formData.location !== "Getting address...";
    if (step === 3) return formData.problem !== '';
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">Roadside Assistance</h1>
          <p className="text-white/70 text-lg">Quick help, whenever you need it</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 px-4">
          <div className="flex justify-between items-center mb-4">
            {[1,2,3].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${s <= step ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white shadow-xl scale-110' : 'bg-white/10 text-white/40 backdrop-blur-md border border-white/20'}`}>
                  {s < step ? <Check className="w-6 h-6" /> : s}
                </div>
                {s < 3 && (
                  <div className="flex-1 h-1.5 mx-3 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500 ${s < step ? 'w-full' : 'w-0'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-white/60 text-sm font-medium px-2">
            <span className={step===1 ? 'text-white' : ''}>Vehicle Type</span>
            <span className={step===2 ? 'text-white' : ''}>Location</span>
            <span className={step===3 ? 'text-white' : ''}>Service Details</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10">
          {/* Step 1: Vehicle Type */}
          {step===1 && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Select Your Vehicle</h2>
                <p className="text-white/60">Choose the type of vehicle that needs assistance</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {vehicleTypes.map(vehicle => {
                  const Icon = vehicle.icon;
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setFormData({ ...formData, vehicleType: vehicle.id })}
                      className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${formData.vehicleType === vehicle.id ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 shadow-2xl shadow-purple-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                    >
                      <Icon className={`w-16 h-16 mx-auto mb-4 transition-all duration-300 ${formData.vehicleType===vehicle.id?'text-purple-300':'text-white/70 group-hover:text-white'}`} />
                      <p className="text-white font-bold text-lg mb-1">{vehicle.name}</p>
                      <p className="text-white/50 text-sm">{vehicle.description}</p>
                      {formData.vehicleType === vehicle.id && (
                        <div className="absolute top-3 right-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step===2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Your Location</h2>
                <p className="text-white/60">Where should we send our service team?</p>
                
                {/* Location Status Indicator */}
                {locationStatus === "success" && (
                  <div className="bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-2 rounded-lg text-sm">
                    ✓ Location found successfully
                  </div>
                )}
                {locationStatus === "error" && (
                  <div className="bg-red-500/20 border border-red-400/30 text-red-300 px-4 py-2 rounded-lg text-sm">
                    ⚠ Please enter your location manually
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-purple-300 w-6 h-6 z-10" />
                  <input
                    type="text"
                    placeholder="Enter your address or landmark"
                    value={formData.location}
                    onChange={handleManualLocationChange}
                    className="w-full pl-14 pr-4 py-5 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 backdrop-blur-md transition-all duration-300 text-lg"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={getUserLocation}
                    disabled={loadingLocation}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/30 text-white rounded-2xl font-semibold transition-all duration-300 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
                  >
                    {loadingLocation ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-5 h-5" />
                        Use Current Location
                      </>
                    )}
                  </button>
                  
                  {/* Coordinates Display */}
                  {(formData.latitude && formData.longitude) && (
                    <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-white/70 text-sm flex items-center">
                      <span>
                        {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Map Container */}
                <div className="relative">
                  {mapStatus === "loading" && (
                    <div className="absolute inset-0 bg-white/10 rounded-2xl flex items-center justify-center z-10">
                      <div className="text-white text-center">
                        <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Loading map...</p>
                      </div>
                    </div>
                  )}
                  {mapStatus === "error" && (
                    <div className="absolute inset-0 bg-red-500/10 rounded-2xl flex items-center justify-center z-10">
                      <div className="text-white text-center">
                        <p className="text-red-300">Failed to load map</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="mt-2 px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
<div ref={mapRef} className="w-full h-80 rounded-2xl border-2 border-white/20 shadow-xl" />

                </div>

                {/* Location Help Text */}
                <div className="text-white/50 text-sm">
                  <p>• Click "Use Current Location" to automatically detect your position</p>
                  <p>• Or type your address manually in the field above</p>
                  <p>• Make sure location services are enabled in your browser</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Problem Details */}
          {step===3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">What Do You Need?</h2>
                <p className="text-white/60">Select the service you require</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {problems.map(problem => (
                  <button
                    key={problem.name}
                    onClick={()=>setFormData({...formData, problem: problem.name})}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105 ${formData.problem===problem.name?'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 shadow-xl shadow-purple-500/20':'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{problem.icon}</div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg mb-1">{problem.name}</p>
                        <p className="text-white/50 text-sm">{problem.desc}</p>
                      </div>
                    </div>
                    {formData.problem===problem.name && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <label className="text-white font-semibold mb-3 block">Additional Information</label>
                <textarea
                  placeholder="Tell us more about your situation (optional)"
                  value={formData.additionalNotes}
                  onChange={(e)=>setFormData({...formData, additionalNotes:e.target.value})}
                  rows="4"
                  className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 backdrop-blur-md resize-none transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 gap-4">
            <button
              onClick={handlePrev}
              disabled={step===1}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 ${step===1?'bg-white/5 text-white/20 cursor-not-allowed border border-white/5':'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/30'}`}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {step<3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 ${canProceed()?'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transform hover:scale-105':'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'}`}
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className={`flex items-center gap-3 px-10 py-4 rounded-xl font-bold transition-all duration-300 ${canProceed()?'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 transform hover:scale-105':'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'}`}
              >
                <Check className="w-5 h-5" />
                Submit Request
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/40 text-sm">
          Available 24/7 • Average response time: 15 minutes
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}