// PunctureRequestFormRedesigned.jsx
import React, { useState, useEffect } from 'react'; // ✨ ADDED useEffect
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
import PlacePickerGujarat from '../components/PlacePickerGujarat'; // Import the updated component
import Navbar from '../components/Navbar';

// --- CONSTANTS ---
// Moved outside the component so they are not re-declared on render
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

// ✨ ADDED: Key for localStorage
const FORM_STORAGE_KEY = 'punctureRequestFormData';


// --- MAIN COMPONENT ---
export default function PunctureRequestFormRedesigned() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // ✨ MODIFIED: Initialize state from localStorage
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem(FORM_STORAGE_KEY);
        if (savedData) {
            try {
                // Parse the saved JSON data
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Failed to parse saved form data", e);
                // If parsing fails, remove the bad data
                localStorage.removeItem(FORM_STORAGE_KEY);
            }
        }
        // Return default state if nothing is saved or parsing failed
        return {
            vehicleType: '',
            location: '',
            latitude: null,
            longitude: null,
            problem: '',
            additionalNotes: ''
        };
    });

    // ✨ ADDED: useEffect to save data to localStorage on change
    useEffect(() => {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    }, [formData]); // This runs every time the formData state changes

    // Handler for location updates from PlacePickerGujarat
    const handleLocationChange = ({ address, latitude, longitude }) => {
        setFormData(prev => ({
            ...prev,
            location: address,
            latitude: latitude,
            longitude: longitude
        }));
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
                toast('Sended Request!', {
  icon: '👍',
});
                // ✨ ADDED: Clear localStorage on successful submission
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

    // The Step components are NO LONGER defined inside here

    return (
        <div className="min-h-screen bg-gray-300 text-gray-800 flex flex-col items-center justify-center p-4 font-sans">
        <Navbar />
            <div className="w-full max-w-2xl my-18">
                <header className="text-center mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">Roadside Assistance</h1>
                    <p className="text-gray-600 mt-2">Get back on the road in minutes.</p>
                </header>

                <ProgressStepper currentStep={step} />

                <main className="mt-4 bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 md:p-8 min-h-[450px]">
                    <AnimatePresence mode="wait">
                        {/* **FIX:** Pass state and handlers as props to the step components */}
                        {step === 1 && (
                            <Step1_Vehicle
                                formData={formData}
                                setFormData={setFormData}
                            />
                        )}
                        {step === 2 && (
                            <Step2_Location
                                formData={formData}
                                handleLocationChange={handleLocationChange}
                            />
                        )}
                        {step === 3 && (
                            <Step3_Service
                                formData={formData}
                                setFormData={setFormData}
                            />
                        )}
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


// --- STEP COMPONENTS ---
// **FIX:** Moved outside the main component and now accept props

const Step1_Vehicle = ({ formData, setFormData }) => (
    <StepWrapper title="Select Your Vehicle">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {vehicleTypes.map(vehicle => (
                <SelectableCard
                    key={vehicle.id}
                    label={vehicle.name}
                    icon={vehicle.icon}
                    isSelected={formData.vehicleType === vehicle.id}
                    onClick={() => setFormData(prev => ({ ...prev, vehicleType: vehicle.id, problem: '' }))}
                />
            ))}
        </div>
    </StepWrapper>
);

const Step2_Location = ({ formData, handleLocationChange }) => (
    <StepWrapper title="Confirm Your Location in Gujarat">
        <div className="space-y-4">
        

            <PlacePickerGujarat
                value={{
                    address: formData.location,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }}
                onChange={handleLocationChange}
            />

            {formData.latitude && formData.longitude && (
                <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                    <p><strong>Selected Location:</strong> {formData.location}</p>
                    <p><strong>Coordinates:</strong> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</p>
                </div>
            )}
        </div>
    </StepWrapper>
);

const Step3_Service = ({ formData, setFormData }) => (
    <StepWrapper title="What Service Do You Need?">
        <div className="grid grid-cols-2 gap-4">
            {problems[formData.vehicleType]?.map(problem => (
                <SelectableCard
                    key={problem.name}
                    label={problem.name}
                    emoji={problem.icon}
                    isSelected={formData.problem === problem.name}
                    onClick={() => setFormData(prev => ({ ...prev, problem: problem.name }))}
                />
            ))}
        </div>
        <textarea
            placeholder="Add any additional notes..."
            value={formData.additionalNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
            rows="3"
            className="w-full mt-6 p-3 bg-gray-200 text-gray-700 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition resize-none"
        />
    </StepWrapper>
);


// --- HELPER COMPONENTS ---
// (These were already correct)

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