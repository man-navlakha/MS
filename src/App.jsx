// src/App.jsx

import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import './App.css';
import { Toaster, toast } from 'react-hot-toast';

// Page Imports
import MainPage from "./Page/MainPage";
import Login from "./Page/auth/Login";
import OTP from "./Page/auth/OTP";
import Logout from "./Page/auth/Logout";
import ProcessForm from "./Page/auth/ProcessForm";
import PunctureRequestForm from "./Page/PunctureRequestForm";
import ProfilePage from "./Page/ProfilePage";
import MechanicFound from './Page/MechanicFound';
import RequestLayout from './Page/RequestLayout';
import FindingMechanic from './Page/FindingMechanic';

// Component Imports
import Protected from './ProtectedRoute';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';

/**
 * A new component that listens for global WebSocket messages
 * and handles critical state changes, like clearing a completed job.
 */
const GlobalSocketHandler = () => {
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only act if there's a new message
    if (!lastMessage) return;

    const jobFinished = lastMessage.type === 'job_completed' || lastMessage.type === 'job_cancelled' || lastMessage.type === 'job_cancelled_notification';

    if (jobFinished) {
      console.log('GLOBAL HANDLER: Job finished. Clearing active job from localStorage.');
      toast.success(lastMessage.message || 'The request has been resolved.');
      
      // The most important step: clear the state from localStorage
      localStorage.removeItem('activeJobData');

      // If the user is not on the main page, navigate them there.
      if (location.pathname !== '/') {
        navigate('/');
      } else {
        // If they are already on the main page, a reload will force the component
        // to re-read localStorage and remove the banner.
        window.location.reload();
      }
    }
  }, [lastMessage, navigate, location.pathname]);

  return null; // This component renders nothing.
};

export default function App() {
  return (
     <div className="App transition-all duration-500 ease-in-out bg-white">
        <Toaster position="top-center" reverseOrder={false} />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<OTP />} />
          <Route path="/logout" element={<Logout />} />

          {/* All protected routes are nested here */}
          <Route
            path="/*"
            element={
              <Protected>
                <WebSocketProvider>
                  <GlobalSocketHandler />
                  <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/form" element={<ProcessForm />} />
                    <Route path="/request" element={<PunctureRequestForm />} />
                    
                    <Route element={<RequestLayout />}>
                      <Route path="/finding/:request_id" element={<FindingMechanic />} />
                      <Route path="/mechanic-found/:request_id" element={<MechanicFound />} />
                    </Route>
                  </Routes>
                </WebSocketProvider>
              </Protected>
            }
          />
        </Routes>
      </div>
  );
}