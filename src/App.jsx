import { Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import api from './utils/api'; // Your axios instance
import './App.css'
import MainPage from "./Page/MainPage";
import Login from "./Page/auth/Login";
import OTP from "./Page/auth/OTP";
import Logout from "./Page/auth/Logout";
import ProcessForm from "./Page/auth/ProcessForm";
import ProfilePage from "./Page/ProfilePage";
import PunctureRequestForm from "./Page/PunctureRequestForm";

function App() {

// const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // This function will run when the app first loads
//     const checkUserStatus = async () => {
//       try {
//         // Make a GET request to the /me endpoint
//         const response = await api.get('/core/me/');
        
//         // If successful, save the user data in state
//         setUser(response.data);
//         console.log("User is logged in:", response.data);

//       } catch (error) {
//         // If it fails (e.g., 401 error), the user is not logged in
//         setUser(null);
//         console.log("User is not logged in.");
//       } finally {
//         // Stop the loading state
//         setLoading(false);
//       }
//     };

//     checkUserStatus();
//   }, []); // The empty array [] means this effect runs only once

//   if (loading) {
//     return <div>Loading...</div>; // Show a loading indicator
//   }
  return (
    <>
      <div className="App transition-all duration-500 ease-in-out bg-black">
        <Routes>
          {/* Main Page */}
          <Route path="/" element={<MainPage />} />
          {/* Auth */}
          <Route path="/Login" element={<Login />} />
          <Route path="/verify" element={<OTP />} />

          <Route path="/logout" element={<Logout />} />
          {/* Pages  */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/form" element={<ProcessForm />} />
          <Route path="/request" element={<PunctureRequestForm />} />

          {/* Fallback Route for unmatched paths */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </>
  )
}

export default App
