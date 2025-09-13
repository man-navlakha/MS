import React, { useState } from 'react';
// FIXED: Import useNavigate for redirection
import { useNavigate } from 'react-router-dom'; 
import { FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';

const ProcessForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate(); // ADDED: Initialize the navigate function

  // --- FORM NAVIGATION ---
  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // --- HANDLE INPUT CHANGE ---
  const handleChange = input => e => {
    setFormData({ ...formData, [input]: e.target.value });
    if (errors[input]) {
      setErrors({ ...errors, [input]: '' });
    }
  };

  // --- VALIDATION LOGIC (No changes needed here) ---
  const validateCurrentStep = () => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
    } else if (step === 2) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email address is invalid';
      }
      if (!formData.phone) newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- HANDLE FINAL SUBMISSION ---
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted Successfully:", formData);
    
    // Move to the success/thank you step
    setStep(step + 1); 

    // ADDED: Redirect to home page after 2 seconds
    setTimeout(() => {
      navigate('/');
    }, 2000); 
  };
  
  // --- PROGRESS BAR COMPONENT (No changes needed here) ---
  const ProgressBar = ({ currentStep }) => {
    const steps = ["Personal", "Contact", "Review"];
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((stepLabel, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition-all duration-300 ${
                    currentStep > index ? 'bg-blue-600' : 'bg-white/30'
                  }`}
                >
                  {index + 1}
                </div>
                <p className={`mt-2 text-xs text-center ${currentStep > index ? 'text-white' : 'text-gray-400'}`}>{stepLabel}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${currentStep > index + 1 ? 'bg-blue-600' : 'bg-white/30'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDER LOGIC ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white text-center">Personal Information</h2>
            <div>
              <label className="text-gray-300">First Name</label>
              <input type="text" value={formData.firstName} onChange={handleChange('firstName')} className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition" />
              {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="text-gray-300">Last Name</label>
              <input type="text" value={formData.lastName} onChange={handleChange('lastName')} className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition" />
              {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>
        );
      case 2:
         return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white text-center">Contact Details</h2>
            <div>
              <label className="text-gray-300">Email Address</label>
              <input type="email" value={formData.email} onChange={handleChange('email')} className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition" />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-gray-300">Phone Number</label>
              <input type="tel" value={formData.phone} onChange={handleChange('phone')} className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition" />
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-white">
            <h2 className="text-2xl font-semibold text-center mb-6">Review Your Information</h2>
            <div className="bg-white/10 p-6 rounded-lg space-y-4">
                <p className="flex items-center"><FaUser className="mr-3 text-blue-300" /> <strong>Name:</strong><span className="ml-2">{formData.firstName} {formData.lastName}</span></p>
                <hr className="border-white/20"/>
                <p className="flex items-center"><FaEnvelope className="mr-3 text-blue-300" /> <strong>Email:</strong><span className="ml-2">{formData.email}</span></p>
                 <hr className="border-white/20"/>
                <p className="flex items-center"><FaPhone className="mr-3 text-blue-300" /> <strong>Phone:</strong><span className="ml-2">{formData.phone}</span></p>
            </div>
          </div>
        );
      // FIXED: Changed case 5 to 4 for sequential flow
      case 4: 
        return (
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold">Thank You!</h2>
            <p className="mt-4 text-lg">You have signed up successfully.</p>
            <p className="mt-2 text-gray-300">Redirecting you to the home page...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        {/* FIXED: Progress bar now hides on the "Thank You" screen */}
        {step <= 3 && <ProgressBar currentStep={step} />}
        
        <form onSubmit={handleSubmit}>
          {renderStep()}

          {/* FIXED: Main container for buttons now hides on the final step */}
          {step < 4 && (
             <div className="flex justify-between mt-8">
              {/* FIXED: Back button condition is clearer */}
              {step > 1 && step <= 3 && (
                <button type="button" onClick={prevStep} className="px-6 py-2 font-semibold text-white bg-white/20 rounded-lg hover:bg-white/30 transition">
                  Back
                </button>
              )}
              {/* FIXED: Next button only shows on steps 1 & 2 */}
              {step < 3 && (
                <button type="button" onClick={nextStep} className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition ml-auto">
                  Next
                </button>
              )}
              {/* FIXED: Submit button now correctly shows on step 3 */}
              {step === 3 && (
                 <button type="submit" className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition">
                  Confirm & Submit
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProcessForm;