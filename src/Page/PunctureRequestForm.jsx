// src/components/PunctureRequestForm.js
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import and configure marker icons (Vite compatible)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useNavigate } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const PunctureRequestForm = ({ defaultService, onBack, onSubmit }) => {
  const nav =useNavigate()
  const [formData, setFormData] = useState({
    vehicleType: "",
    vehicleModel: "",
    location: null,
    problems: defaultService ? [defaultService] : [],
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // <- add this

  // update problems if defaultService changes
  useEffect(() => {
    if (defaultService) {
      setFormData((prev) => ({ ...prev, problems: [defaultService] }));
    }
  }, [defaultService]);


  // On component load, read location from cookies
  useEffect(() => {
    const savedLocation = Cookies.get('selectedLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setFormData(prev => ({ ...prev, location: parsedLocation }));
      } catch (e) {
        console.error("Error parsing location cookie:", e);
      }
    }
  }, []);


  // --- FORM NAVIGATION ---
  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  // --- HANDLE INPUT CHANGES ---
  const handleChange = input => e => {
    setFormData({ ...formData, [input]: e.target.value });
    if (errors[input]) {
      setErrors(prev => ({ ...prev, [input]: '' }));
    }
  };
  
  const handleCheckboxChange = e => {
      const { value, checked } = e.target;
      let problems = [...formData.problems];
      if (checked) {
          problems.push(value);
      } else {
          problems = problems.filter(prob => prob !== value);
      }
      setFormData({ ...formData, problems });
  }

  // --- VALIDATION LOGIC ---
  const validateCurrentStep = () => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.vehicleType) newErrors.vehicleType = 'Please select a vehicle type.';
      if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle model is required.';
    } else if (step === 2) {
      if (!formData.location) newErrors.location = 'Location is missing. Please go back to the map page and select a location.';
    } else if (step === 3) {
        if (formData.problems.length === 0) newErrors.problems = 'Please select at least one problem.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- HANDLE FINAL SUBMISSION ---
const handleSubmit = (e) => {
  e.preventDefault();
  if (validateCurrentStep()) {
    console.log("Form Submitted Successfully:", formData);
    setStep(step + 1); // success screen
    onSubmit?.(formData); // notify parent
  }
};

  // --- RENDER LOGIC ---
  const renderStep = () => {
    switch (step) {
      case 1: // Vehicle Information
        return (
          <div className="space-y-6">
            <button type="button" onClick={() => nav('/')} className="absolute top-4 text-white/60 left-4">Close</button>

            <h2 className="text-2xl font-semibold text-white text-center">Vehicle Information</h2>
            <div>
              <label className="text-gray-300 block mb-2">Vehicle Type</label>
              <div className="grid grid-cols-2 gap-4 text-white">
                {['Motorcycle', 'Scooter', 'Car', 'Truck'].map(type => (
                  <label key={type} className={`p-4 rounded-lg text-center cursor-pointer transition ${formData.vehicleType === type ? 'bg-blue-600' : 'bg-white/20'}`}>
                    <input type="radio" name="vehicleType" value={type} checked={formData.vehicleType === type} onChange={handleChange('vehicleType')} className="sr-only"/>
                    {type}
                  </label>
                ))}
              </div>
              {errors.vehicleType && <p className="text-red-400 text-sm mt-2">{errors.vehicleType}</p>}
            </div>
            <div>
              <label className="text-gray-300">Vehicle Model (e.g., Honda Activa, Maruti Swift)</label>
              <input type="text" value={formData.vehicleModel} onChange={handleChange('vehicleModel')} placeholder="Enter your vehicle model" className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border-transparent text-white placeholder-gray-300 focus:outline-none focus:border-white/50 focus:ring-0 transition" />
              {errors.vehicleModel && <p className="text-red-400 text-sm mt-1">{errors.vehicleModel}</p>}
            </div>
          </div>
        );
      case 2: // Location Preview
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white text-center">Confirm Your Location</h2>
                {formData.location ? (
                    <div className="bg-white/10 p-4 rounded-lg text-white">
                        <p className="font-semibold">{formData.location.name}</p>
                        <p className="text-sm text-gray-300">Lat: {formData.location.lat.toFixed(4)}, Lng: {formData.location.lng.toFixed(4)}</p>
                        <div className="h-64 mt-4 rounded-lg overflow-hidden border-2 border-white/20">
                            <MapContainer center={[formData.location.lat, formData.location.lng]} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[formData.location.lat, formData.location.lng]} />
                            </MapContainer>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-red-400 bg-red-500/20 p-4 rounded-lg">No location data found. Please select your location from the map page first.</p>
                )}
                {errors.location && <p className="text-red-400 text-sm mt-1 text-center">{errors.location}</p>}
            </div>
        );
      case 3: // Problem Details
          return (
              <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-white text-center">Describe the Problem</h2>
                  <div>
                      <label className="text-gray-300 block mb-2">What is the issue?</label>
                       <div className="grid grid-cols-2 gap-4 text-white">
                          {['Flat Tire', 'Air-fill Needed', 'Tubeless Puncture', 'Tube Puncture'].map(prob => (
                              <label key={prob} className={`p-4 rounded-lg text-center cursor-pointer transition ${formData.problems.includes(prob) ? 'bg-blue-600' : 'bg-white/20'}`}>
                                  <input type="checkbox" value={prob} checked={formData.problems.includes(prob)} onChange={handleCheckboxChange} className="sr-only" />
                                  {prob}
                              </label>
                          ))}
                      </div>
                      {errors.problems && <p className="text-red-400 text-sm mt-2">{errors.problems}</p>}
                  </div>
                  <div>
                      <label className="text-gray-300">Additional Details (Optional)</label>
                      <textarea value={formData.description} onChange={handleChange('description')} rows="3" placeholder="Any other information?" className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border-transparent text-white placeholder-gray-300 focus:outline-none focus:border-white/50 focus:ring-0 transition"></textarea>
                  </div>
              </div>
          );
      case 4: // Review
        return (
            <div className="text-white">
                <h2 className="text-2xl font-semibold text-center mb-6">Review Your Request</h2>
                <div className="bg-white/10 p-6 rounded-lg space-y-4 text-left">
                    <p><strong>Vehicle:</strong> {formData.vehicleType} - {formData.vehicleModel}</p>
                    <hr className="border-white/20"/>
                    <p><strong>Location:</strong> {formData.location.name}</p>
                    <hr className="border-white/20"/>
                    <p><strong>Problem:</strong> {formData.problems.join(', ')}</p>
                    {formData.description && <p><strong>Details:</strong> {formData.description}</p>}
                </div>
            </div>
        );
      case 5: // Success
        return (
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold">Request Submitted!</h2>
            <p className="mt-4 text-lg">Help is on the way. A nearby mechanic will contact you shortly.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        <form onSubmit={handleSubmit}>
          {renderStep()}
          {step < 5 && (
             <div className="flex justify-between mt-8">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="px-6 py-2 font-semibold text-white bg-white/20 rounded-lg hover:bg-white/30 transition">
                  Back
                </button>
              )}
              {step < 4 && (
                <button type="button" onClick={nextStep} className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition ml-auto">
                  Next
                </button>
              )}
              {step === 4 && (
                 <button type="submit" className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition">
                  Submit Request
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PunctureRequestForm;