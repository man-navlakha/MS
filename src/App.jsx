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
import Protected from './ProtectedRoute';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';

const GlobalSocketHandler = () => {
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
      const isOnJobRelatedPage = location.pathname.startsWith('/finding/') || location.pathname.startsWith('/mechanic-found/');
     if (location.pathname === '/' || isOnJobRelatedPage) {
        // ✨ ADDED setTimeout ✨
        const timerId = setTimeout(() => {
          if (location.pathname === '/') {
            window.location.reload();
          } else {
            navigate('/');
          }
      }, 5000);
        return () => clearTimeout(timerId);
      }
    }
  }, [lastMessage, navigate, location.pathname]);

  return null; // This component renders nothing.
};

export default function App() {

  const activeJob = localStorage.getItem("activeJobData")
  return (
    <div className="App transition-all duration-500 ease-in-out bg-white">
      <Toaster position="top-center" reverseOrder={false} />
{localStorage.getItem("activeJobData") && <a href={`/mechanic-found/${activeJob.request_id}`}> <div className='bg-blue-600 text-white font-bold min-w-screen w-full p-3' >Your active Order {activeJob.request_id}</div></a>}
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