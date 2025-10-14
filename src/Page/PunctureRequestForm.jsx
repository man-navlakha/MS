// PunctureRequestFormRedesigned.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import maplibregl from 'maplibre-gl';

// Main Component
export default function PunctureRequestFormRedesigned() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [mapStatus, setMapStatus] = useState("idle");
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

    const problems = {
        bike: [
            { name: 'Puncture Repair', icon: '🔧' },
            { name: 'Air Fill-up', icon: '💨' },
            { name: 'Chain Repair', icon: '🔗' },
            { name: 'Spark Plug Issue', icon: '⚡' },
        ],
        car: [
            { name: 'Puncture Repair', icon: '🔧' },
            { name: 'Air Fill-up', icon: '💨' },
            { name: 'Battery Jumpstart', icon: '🔋' },
            { name: 'Tire Replacement', icon: '⚙️' },
        ],
        truck: [
            { name: 'Puncture Repair', icon: '🔧' },
            { name: 'Air Fill-up', icon: '💨' },
            { name: 'Battery Jumpstart', icon: '🔋' },
            { name: 'Tire Replacement', icon: '⚙️' },
        ],
    };
    useEffect(() => {
        if (step !== 2) return;

        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const defaultCenter = [77.2090, 28.6139]; // Delhi default (lng, lat)

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            center: defaultCenter,
            zoom: 13,
            style: 'https://api.maptiler.com/maps/streets/style.json?key=wf1HtIzvVsvPfvNrhwPz',
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
            setMapStatus("loaded");
        });

        map.on('error', () => {
            setMapStatus("error");
        });

        map.on('click', async (e) => {
            const { lng, lat } = e.lngLat;

            setFormData(prev => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                location: "Fetching address..."
            }));

            // Add or update marker
            if (mapInstanceRef.current?.marker) {
                mapInstanceRef.current.marker.setLngLat([lng, lat]);
            } else {
                const marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
                mapInstanceRef.current.marker = marker;
            }

            // Reverse geocode
            const address = await getAddressFromCoordinates(lat, lng);
            setFormData(prev => ({ ...prev, location: address }));
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [step]);


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
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setLoadingLocation(true);

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

        } catch (error) {
            setFormData(prev => ({ ...prev, location: "" }));
            toast.error("Could not get your location. Please enable location services or enter your address manually.");
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
        if (!formData.latitude || !formData.longitude) {
            toast.error("Please select a valid location.");
            return;
        }

        try {
            const response = await api.post("/jobs/CreateServiceRequest/", {
                latitude: formData.latitude,
                longitude: formData.longitude,
                location: formData.location,
                vehical_type: formData.vehicleType,
                problem: formData.problem,
                additional_details: formData.additionalNotes,
            });

            if (response.status === 201) {
                navigate(`/finding/${response.data.request_id}`);
            } else {
                toast.error("Failed to submit request. Please try again.");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
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
                        onClick={() => setFormData({ ...formData, vehicleType: vehicle.id, problem: '' })}
                    />
                ))}
            </div>
        </StepWrapper>
    );

    const Step2_Location = () => (
        <StepWrapper title="Confirm Your Location">
            <div className="space-y-4">
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Enter address manually"
                        value={formData.location}
                        onChange={handleManualLocationChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-200 text-gray-700 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                    />
                </div>
                <button
                    onClick={getUserLocation}
                    disabled={loadingLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] font-semibold hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition disabled:opacity-50"
                >
                    {loadingLocation ? <Loader className="animate-spin" size={20} /> : <Navigation size={20} />}
                    {loadingLocation ? "Fetching Location..." : "Use My Current Location"}
                </button>
                <div className="relative h-64 md:h-80 w-full bg-gray-200 rounded-lg shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] overflow-hidden">
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
                {problems[formData.vehicleType]?.map(problem => (
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
                placeholder="Add any additional notes..."
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                rows="3"
                className="w-full mt-6 p-3 bg-gray-200 text-gray-700 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition resize-none"
            />
        </StepWrapper>
    );

    return (
        <div className="min-h-screen bg-gray-300 text-gray-800 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight">Roadside Assistance</h1>
                    <p className="text-gray-600 mt-2">Get back on the road in minutes.</p>
                </header>

                <ProgressStepper currentStep={step} />

                <main className="mt-8 bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 md:p-8 min-h-[450px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && <Step1_Vehicle />}
                        {step === 2 && <Step2_Location />}
                        {step === 3 && <Step3_Service />}
                    </AnimatePresence>
                </main>

                <footer className="flex justify-between items-center mt-8">
                    <button
                        onClick={handlePrev}
                        disabled={step === 1}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-300 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>
                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-blue-500 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition-all disabled:opacity-50"
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-green-500 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition-all disabled:opacity-50"
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

// Helper components with neumorphic design
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
        className={`relative group p-4 w-full h-32 flex flex-col items-center justify-center text-center rounded-xl transition-all duration-200
            ${isSelected
                ? 'bg-blue-100 shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF]'
                : 'bg-gray-200 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF]'
            }`}
    >
        {Icon && <Icon className={`w-10 h-10 mb-2 transition-colors ${isSelected ? 'text-blue-500' : 'text-gray-500 group-hover:text-blue-500'}`} />}
        {emoji && <span className="text-4xl mb-2">{emoji}</span>}
        <span className="font-semibold text-sm text-gray-700">{label}</span>
        {isSelected && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
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
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                                    ${isCompleted ? 'bg-blue-500 text-white shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF]' : ''}
                                    ${isActive ? 'bg-blue-100 text-blue-500 shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF]' : ''}
                                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF]' : ''}
                                `}
                            >
                                {isCompleted ? <Check size={24} /> : <step.icon size={24} />}
                            </div>
                            <p className={`mt-2 text-xs font-semibold transition-colors ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>
                                {step.title}
                            </p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-blue-400' : 'bg-gray-400'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const MapOverlay = ({ text, icon: Icon, spin = false }) => (
    <div className="absolute inset-0 bg-gray-200/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-gray-600">
        <Icon className={`mb-2 ${spin ? 'animate-spin' : ''}`} size={32} />
        <p>{text}</p>
    </div>
);