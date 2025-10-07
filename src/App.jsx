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



import Protected from './ProtectedRoute'
import FindingMechanic from './Page/FindingMechanic';
export default function App() {
  return (
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
          <Route path="/finding/:request_id" element={
            <Protected>
              <FindingMechanic />
            </Protected>
          } />

          {/* You can add a "Not Found" route as a fallback */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
  );
}
