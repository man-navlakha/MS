import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import api from "../../utils/api";

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
const ProcessForm = () => {
  // Read status from route state safely inside the component
  const location = useLocation(); // useLocation must be called within the component [web:146]
  const status = location.state?.status || "Manual"; // Default to "Manual" when no state provided [web:146]

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

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
  const handleChange = (input) => (e) => {
    setFormData({ ...formData, [input]: e.target.value });
    if (errors[input]) {
      setErrors({ ...errors, [input]: "" });
    }
  };

  // --- VALIDATION LOGIC ---
  const validateCurrentStep = () => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
    } else if (step === 2) {
      if (!formData.phone) newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Build payload conditionally
      const payload = {
        first_name: status === "Google" ? null : formData.firstName,
        last_name: status === "Google" ? null : formData.lastName,
        mobile_number: formData.phone,
        profile_pic: status === "Google" ? null : "https://mphkxojdifbgafp1.public.blob.vercel-storage.com/Profile/profile-pic%20%287%29.png"
      };

      // POST to backend
      const res = await api.post("/users/SetUsersDetail/", payload); // adjust path if trailing slash required
      console.log("Saved user details:", res.data);

      // Move to the success/thank you step
      setStep((s) => s + 1);

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Save failed:", err);
      // Surface a basic error in UI; optionally map server errors to fields
      setErrors((prev) => ({ ...prev, submit: "Failed to save details. Try again." }));
    }
  };

  // --- PROGRESS BAR COMPONENT ---
  const ProgressBar = ({ currentStep }) => {
    const steps = ["Personal", "Contact", "Review"];
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((stepLabel, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition-all duration-300 ${currentStep > index ? "bg-blue-600" : "bg-white/30"
                    }`}
                >
                  {index + 1}
                </div>
                <p
                  className={`mt-2 text-xs text-center ${currentStep > index ? "text-white" : "text-gray-400"
                    }`}
                >
                  {stepLabel}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all duration-300 ${currentStep > index + 1 ? "bg-blue-600" : "bg-white/30"
                    }`}
                ></div>
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
            <h2 className="text-2xl font-semibold text-white text-center">
              Personal Information
            </h2>
            <div>
              <label className="text-gray-300">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              />
              {errors.firstName && (
                <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="text-gray-300">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              />
              {errors.lastName && (
                <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white text-center">
              Contact Details
            </h2>
            <div>
              <label className="text-gray-300">Phone Number</label>
              <PhoneInput
                international
                defaultCountry="US" // or your desired default country
                value={formData.phone}
                onChange={(value) => {
                  setFormData({ ...formData, phone: value });
                  if (errors.phone) {
                    setErrors({ ...errors, phone: "" });
                  }
                }}
                className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              />

              {errors.phone && (
                <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-white">
            <h2 className="text-2xl font-semibold text-center mb-6">
              Review Your Information
            </h2>
            <div className="bg-white/10 p-6 rounded-lg space-y-4">
              <p className="flex items-center">
                <FaUser className="mr-3 text-blue-300" /> <strong>Name:</strong>
                <span className="ml-2">
                  {formData.firstName} {formData.lastName}
                </span>
              </p>
              <hr className="border-white/20" />
              <p className="flex items-center">
                <FaPhone className="mr-3 text-blue-300" />{" "}
                <strong>Phone:</strong>
                <span className="ml-2">{formData.phone}</span>
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold">Thank You!</h2>
            <p className="mt-4 text-lg">You have signed up successfully.</p>
            <p className="mt-2 text-gray-300">
              Redirecting you to the home page...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // If status is "Google", render only the phone input and keep the same visual theme
  if (status === "Google") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
        <div className="w-full max-w-2xl p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
          {/* No ProgressBar for Google flow */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white text-center">
                Add Mobile Number
              </h2>
              <div>
                <label className="text-gray-300">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Single submit button preserves the existing button styling */}
            <div className="flex justify-between mt-8">
              <button
                type="submit"
                className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Otherwise, render the original multi-step design unchanged
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        {/* Progress bar remains visible for steps 1–3 */}
        {step <= 3 && <ProgressBar currentStep={step} />}

        <form onSubmit={handleSubmit}>
          {renderStep()}

          {/* Main container for buttons hides on the final step */}
          {step < 4 && (
            <div className="flex justify-between mt-8">
              {step > 1 && step <= 3 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 font-semibold text-white bg-white/20 rounded-lg hover:bg-white/30 transition"
                >
                  Back
                </button>
              )}
              {step < 3 && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition ml-auto"
                >
                  Next
                </button>
              )}
              {step === 3 && (
                <button
                  type="submit"
                  className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                >
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
