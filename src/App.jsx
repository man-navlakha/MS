import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom"; // 1. Import BrowserRouter here
import './App.css'

// Import your page and component files
import MainPage from "./Page/MainPage";
import Login from "./Page/auth/Login";
import OTP from "./Page/auth/OTP";
import Logout from "./Page/auth/Logout";
import ProcessForm from "./Page/auth/ProcessForm";
import PunctureRequestForm from "./Page/PunctureRequestForm";
import ProfilePage from "./Page/ProfilePage";
import Profile from "./mechanic/page/Profile";
import Dashboard from "./mechanic/Dashboard";



import Protected from './ProtectedRoute'

// Import the lock screen functionality
import { LockProvider, useLock } from './context/LockContext';
import LockScreen from './mechanic/componets/LockScreen';



// This component now handles rendering the lock screen and all the routes
const AppContent = () => {
  const { isLocked, lockScreen } = useLock(); // 2. Get the lockScreen function

  // 3. Add the useEffect hook for the keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Shortcut: Ctrl + Shift + L
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault(); // Prevent any default browser action
        lockScreen();
      }
    };

    // Add the event listener when the component mounts
    window.addEventListener('keydown', handleKeyDown);

    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lockScreen]); // Dependency array ensures the effect uses the latest lockScreen function


  return (
    <>
      {/* <div className='bg-red-500 text-white font-bold p-2 text-center'>
        Please Fill the details first → <a href="/form">Click Here &rarr; </a>
      </div> */}
      {/* The LockScreen will appear on top of any page when isLocked is true */}
      {isLocked && <LockScreen />}

      <div className="App transition-all duration-500 ease-in-out bg-white">
        {/* 2. A SINGLE <Routes> component holds all your app's routes */}
        <Routes>
          {/* Main Page */}
          <Route path="/" element={
            <Protected>
              <MainPage />
            </Protected>
          } />
          {/* Auth */}
          <Route path="/Login" element={
            <Login />
          } />
          <Route path="/verify" element={
            <OTP />
          } />
          <Route path="/logout" element={
            <Logout />
          } />

          <Route path="/profile" element={
            <Protected>
              <ProfilePage />
            </Protected>
          } />

          {/* Pages */}
          <Route path="/form" element={
            <Protected>
              <ProcessForm />
            </Protected>
          } />
          <Route path="/request" element={
            <Protected>
              <PunctureRequestForm />
            </Protected>
          } />

          {/* Mechanic */}
          <Route path="/Dashboard" element={
            <Protected>
              <Dashboard />
            </Protected>
          } />
          <Route path="/profilepage" element={
            <Protected>
              <Profile />
            </Protected>
          } />

          {/* You can add a "Not Found" route as a fallback */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </>
  );
};

// The main App component is now responsible for setting up the providers and router
function App() {

  return (
    // 3. The Providers and Router wrap the AppContent
    <LockProvider>
      <AppContent />
    </LockProvider>
  );
}

export default App;