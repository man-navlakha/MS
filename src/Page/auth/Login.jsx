import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google'; // ✅ Import GoogleLogin
import api from '../../utils/api'; 

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  // Optional: Add loading and success states for better user feedback
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!email) {
      setError('Please enter your email.');
      setLoading(false);
      return;
    }
    try {
      await api.post('/users/Login_SignUp/', { email: email });
      navigate("/verify", { state: { email: email } });
    } catch (err) {
      console.error("Login failed:", err);
      setError('Login failed. Please check your email or try again.');
    } finally {
      setLoading(false);
    }
  };
  // ✅ NEW: Google login handler based on your example
  const handleGoogleLogin = async (credentialResponse) => {
    setError('');
    if (!credentialResponse?.credential) {
      setError("Google credential was not received. Please try again.");
      return;
    }
    setLoading(true);
    try {
      // Send the token received from Google to your backend
      // Note: The endpoint should match your backend setup. Using '/users/google/' as per your API list.
      const res = await api.post("/users/google/", { token: credentialResponse.credential });

      // Assuming a successful login from the backend, navigate the user
      // You might want to store tokens from the response (res.data) before navigating
      console.log("Backend response:", res.data);
      navigate("/dashboard"); // Redirect to a dashboard or home page after login

    } catch (err) {
      console.error("Google login error:", err);
      setError(err?.response?.data?.detail || "Google login failed on our server.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        
        <div className="text-center text-white">
          <img src="/ms.png" alt="Mechanic Setu Logo" className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-white/30" />
          <h1 className="text-3xl font-bold tracking-wider">MECHANIC SETU</h1>
          <p className="text-sm text-gray-300 italic">Always at emergency</p>
        </div>

        <form className="space-y-4" onSubmit={handleEmailLogin}>
          {/* Email login form remains the same */}
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div className="flex items-center justify-center space-x-2">
          <hr className="w-full border-white/20" />
          <span className="text-gray-300 text-sm">OR</span>
          <hr className="w-full border-white/20" />
        </div>
        
        {/* ✅ REPLACED: Use the GoogleLogin component instead of a button */}
        <div className="flex justify-center">
            <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                    setError('Google Login Failed. Please try again.');
                }}
                useOneTap // Optional: for a smoother login experience
            />
        </div>

      </div>
    </div>
  );
};

export default LoginPage;