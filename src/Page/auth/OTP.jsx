import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const OtpPage = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  const navigate = useNavigate()

  const verifyou = () =>{
    navigate('/form')
  }

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false; // Ensure only numbers are entered

    // Update OTP state
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    // Main container with the same background gradient
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      
      {/* Glassmorphism container */}
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        
        {/* Header section with logo - kept for consistency */}
        <div className="text-white">
          <img 
            src="/ms.png" // The logo path
            alt="Mechanic Setu Logo" 
            className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-white/30"
          />
          <h1 className="text-3xl font-bold tracking-wider">MECHANIC SETU</h1>
          <p className="text-sm text-gray-300 italic">Always at emergency</p>
        </div>
        
        {/* OTP Form Content */}
        <div className="space-y-4 text-white">
          <h2 className="text-2xl font-semibold">Enter Verification Code</h2>
          <p className="text-gray-300">
            A 6-digit OTP has been sent to your email.
          </p>

          {/* OTP Input Fields */}
          <div className="flex justify-center space-x-2 md:space-x-4">
            {otp.map((data, index) => {
              return (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  ref={el => (inputRefs.current[index] = el)}
                  onChange={e => handleChange(e.target, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-semibold bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
                />
              );
            })}
          </div>

          {/* Verify Button */}
          <button
            type="submit" onClick={() => verifyou()}
            className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
          >
            Verify
          </button>
          
          {/* Resend Code Link */}
          <p className="text-sm text-gray-300">
            Didn't receive the code?{' '}
            <button className="font-semibold text-blue-400 hover:underline">
              Resend
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default OtpPage;