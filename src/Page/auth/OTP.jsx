import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';

const OtpPage = () => {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { state } = useLocation();

  // Initialize context from route state; optionally fall back to sessionStorage
  const initialCtx = state || JSON.parse(sessionStorage.getItem('otp_ctx') || '{}');
  const [ctx, setCtx] = useState({
    key: initialCtx?.key || null,
    id: initialCtx?.id || null,
    status: initialCtx?.status || null,
  });

  // Persist ctx so it survives reloads (optional)
  useEffect(() => {
    sessionStorage.setItem('otp_ctx', JSON.stringify(ctx));
  }, [ctx]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    setOtp((prev) => prev.map((d, idx) => (idx === index ? element.value : d)));
    if (element.nextSibling) element.nextSibling.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyOtp = async () => {
    setError('');
    const code = otp.join('').trim();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    try {
      const payload = { key: ctx.key, id: ctx.id, otp: code };
      await api.post('/users/otp-verify/', payload, { withCredentials: true }); // if cookie auth
      console.log("Backend response:", ctx.status);
      if (ctx.status === 'New User') {
        navigate('/form', { state: { status: "Manual" } }); // Redirect to a form page after login
      } else {
        navigate('/'); 
      }
    } catch (err) {
      console.error('OTP verify failed:', err);
      setError(err?.response?.data?.error || 'Verification failed. Try again.');
    }
  };

  const resendOtp = async () => {
    setError('');
    try {
      const res = await api.post(
        '/users/resend-otp/',
        { key: ctx.key, id: ctx.id },
        { withCredentials: true }
      );
      const newKey = res?.data?.key;
      const newid = res?.data?.id;
      if (newid) setCtx((prev) => ({ ...prev, id: newid }));
      if (newKey) setCtx((prev) => ({ ...prev, key: newKey }));
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend failed:', err);
      setError(err?.response?.data?.error || 'Could not resend code. Try later.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        <div className="text-white">
          <img src="/ms.png" alt="Mechanic Setu Logo" className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-white/30" />
          <h1 className="text-3xl font-bold tracking-wider">MECHANIC SETU</h1>
          <p className="text-sm text-gray-300 italic">Always at emergency</p>
        </div>

        <div className="space-y-4 text-white">
          <h2 className="text-2xl font-semibold">Enter Verification Code</h2>
          <p className="text-gray-300">
            A 6-digit OTP has been sent to {ctx.email || 'your email'}.
          </p>

          <div className="flex justify-center space-x-2 md:space-x-4">
            {otp.map((val, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={val}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-semibold bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="button"
            onClick={verifyOtp}
            className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
          >
            Verify
          </button>

          <p className="text-sm text-gray-300">
            Didn't receive the code?{' '}
            <button type="button" onClick={resendOtp} className="font-semibold text-blue-400 hover:underline">
              Resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
