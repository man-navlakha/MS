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

    const jobFinishedOrNotFound = lastMessage.type === 'job_completed' || lastMessage.type === 'job_cancelled' || lastMessage.type === 'job_cancelled_notification' || lastMessage.type === 'no_mechanic_found';
    if (jobFinishedOrNotFound) {
      console.log(`GLOBAL HANDLER: Job event type "${lastMessage.type}". Clearing active job from localStorage.`);

      // Show appropriate toast message
      if (lastMessage.type === 'no_mechanic_found') {
        toast.error(lastMessage.message || 'Could not find an available mechanic.');
      } else {
        toast.success(lastMessage.message || 'The request has been resolved.');
      }

      // Clear the state from localStorage
      localStorage.removeItem('activeJobData');

      // Check if the user is currently on a page related to the job finding/tracking process
      const isOnJobRelatedPage = location.pathname.startsWith('/finding/') || location.pathname.startsWith('/mechanic-found/');

      // If on a job-related page OR the main page, navigate/reload.
      // Otherwise, stay on the current page (e.g., profile) but the job state is cleared.
     if (location.pathname === '/' || isOnJobRelatedPage) {
        // ✨ ADDED setTimeout ✨
        const timerId = setTimeout(() => {
          // If they are on the main page, reload to clear banners/state derived from localStorage
          if (location.pathname === '/') {
            window.location.reload();
          } else {
            // If they are on /finding/* or /mechanic-found/*, navigate them home
            navigate('/');
          }
      }, 5000); // 5000 milliseconds = 5 seconds

        // Optional: Cleanup the timer if the component unmounts or lastMessage changes before 5 seconds
        return () => clearTimeout(timerId);
        // ✨ END of setTimeout addition ✨
      }
      // If they are on another page (like /profile), the localStorage is cleared. No forced navigation needed.
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