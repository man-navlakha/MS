import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import Navbar from './componets/Navbar';
import RightPanel from './componets/RightPanel';

// --- FIX STARTS HERE ---
// Import image assets using ES Modules 'import' for Vite compatibility
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet icon path issue
// This part is crucial for making icons display correctly
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
// --- FIX ENDS HERE ---

// Custom Emoji Icons
const createEmojiIcon = (emoji) => {
  return L.divIcon({
    html: `<span style="font-size: 2rem;">${emoji}</span>`,
    className: 'bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const mechanicIcon = createEmojiIcon('🧑‍🔧');
const jobIcon = createEmojiIcon('⚒️');

// Sample Data
const mechanicPosition = [23.0225, 72.5714]; // Ahmedabad coordinates
const jobRequests = [
  { id: 1, position: [23.03, 72.58], details: 'Flat Tire Change', payout: '₹500' },
  { id: 2, position: [23.01, 72.56], details: 'Battery Jumpstart', payout: '₹700' },
  { id: 3, position: [23.04, 72.57], details: 'Engine Diagnostic', payout: '₹1200' },
];

const Dashboard = () => {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      <Navbar mechanicName="John Doe" />

      <div className="relative flex-grow">
        {/* Map Background */}
        <MapContainer center={mechanicPosition} zoom={13} className="h-full w-full z-0">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://man-navlakha.netlify.app/">Man Navlakha</a> Developer of this Website'
          />

          {/* Mechanic's Location Marker */}
          <Marker position={mechanicPosition} icon={mechanicIcon}>
            <Popup>Your current location.</Popup>
          </Marker>

          {/* Available Job Requests Markers */}
          {isOnline && jobRequests.map(job => (
            <Marker key={job.id} position={job.position} icon={jobIcon}>
              <Popup>
                <div className="font-sans">
                  <h3 className="font-bold text-md">{job.details}</h3>
                  <p>Estimated Payout: <span className="font-semibold text-green-600">{job.payout}</span></p>
                  <button className="mt-2 w-full bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600">
                    Accept Job
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Right Panel Overlay */}
        <RightPanel isOnline={isOnline} setIsOnline={setIsOnline} />
      </div>
    </div>
  );
};

export default Dashboard;