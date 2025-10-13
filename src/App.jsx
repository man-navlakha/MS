// src/App.jsx

import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import './App.css'
import { Toaster, toast } from 'react-hot-toast'; // Import Toaster and toast

// Import your page and component files
import MainPage from "./Page/MainPage";
import Login from "./Page/auth/Login";
import OTP from "./Page/auth/OTP";
import Logout from "./Page/auth/Logout";
import ProcessForm from "./Page/auth/ProcessForm";
import PunctureRequestForm from "./Page/PunctureRequestForm";
import ProfilePage from "./Page/ProfilePage";
import MechanicFound from './Page/MechanicFound';
import RequestLayout from './Page/RequestLayout';

import Protected from './ProtectedRoute'
import FindingMechanic from './Page/FindingMechanic';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';

// This component will handle global messages and clear the job state.
const GlobalSocketHandler = () => {
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'job_completed' || lastMessage.type === 'job_cancelled' || lastMessage.type === 'job_cancelled_notification') {
        
        console.log('GLOBAL HANDLER: Received job completion/cancellation. Clearing active job.');
        toast.success(lastMessage.message || 'The job has been resolved.');
        
        localStorage.removeItem('activeJobData');

        // Navigate to home page if not already there.
        if (location.pathname !== '/') {
          navigate('/');
        } else {
          // If already on the main page, force a re-render by clearing state in MainPage
          // A simple way is to make MainPage listen to a change or just reload.
          window.location.reload(); 
        }
      }
    }
  }, [lastMessage, navigate, location.pathname]);

  return null; // This component does not render anything.
};

export default function App() {
  return (
     <div className="App transition-all duration-500 ease-in-out bg-white">
        {/* Add the Toaster component here to display notifications */}
        <Toaster position="top-center" reverseOrder={false} />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<OTP />} />
          <Route path="/logout" element={<Logout />} />

          {/* Protected Routes are now wrapped in the WebSocketProvider */}
          <Route
            path="/*"
            element={
              <Protected>
                <WebSocketProvider>
                  {/* The Global Handler listens for messages on ALL protected pages */}
                  <GlobalSocketHandler />
                  
                  <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/form" element={<ProcessForm />} />
                    <Route path="/request" element={<PunctureRequestForm />} />
                    
                    {/* The RequestLayout is now just for layout, not for providing context */}
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