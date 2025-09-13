// src/components/ProfilePage.js
import React, { useState } from 'react';
import { FaUserCircle, FaEnvelope, FaCar, FaMotorcycle, FaCog, FaBell, FaSignOutAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

// --- Reusable Toggle Switch Component ---
const ToggleSwitch = ({ label, enabled, setEnabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-slate-300">{label}</span>
    <button
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// --- Mock Data ---
const mockUser = {
  name: 'Nav Lathiya',
  email: 'nav.lathiya@example.com',
  memberSince: 'September 2025',
  avatar: null, // You can put an image URL here
};
const mockVehicles = [
    { id: 1, type: 'Car', name: 'Maruti Swift', number: 'GJ01AB1234', icon: <FaCar/> },
    { id: 2, type: 'Motorcycle', name: 'Honda Activa', number: 'GJ01CD5678', icon: <FaMotorcycle/> }
];


const ProfilePage = () => {
  const [user, setUser] = useState(mockUser);
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  
  // Settings State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleEdit = () => {
    setEditedUser(user); // Reset edits to current user state
    setIsEditing(true);
  };

  const handleSave = () => {
    setUser(editedUser); // Save changes
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        {/* --- User Information Card --- */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <FaUserCircle className="text-7xl text-slate-300" />
            <div className="flex-grow text-center sm:text-left">
              {isEditing ? (
                <div className="space-y-2">
                    <input type="text" name="name" value={editedUser.name} onChange={handleChange} className="w-full bg-slate-700/50 text-xl font-bold p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="email" name="email" value={editedUser.email} onChange={handleChange} className="w-full bg-slate-700/50 text-slate-300 p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-slate-300 flex items-center justify-center sm:justify-start"><FaEnvelope className="mr-2" />{user.email}</p>
                </>
              )}
            </div>
            {isEditing ? (
                <div className="flex space-x-2">
                    <button onClick={handleSave} className="p-2 bg-green-600 rounded-full hover:bg-green-500 transition"><FaSave /></button>
                    <button onClick={handleCancel} className="p-2 bg-red-600 rounded-full hover:bg-red-500 transition"><FaTimes /></button>
                </div>
            ) : (
                <button onClick={handleEdit} className="p-2 bg-slate-600 rounded-full hover:bg-slate-500 transition"><FaEdit /></button>
            )}
          </div>
        </div>

        {/* --- Saved Vehicles Card --- */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">My Vehicles</h3>
            <div className="space-y-4">
                {vehicles.map(v => (
                    <div key={v.id} className="bg-slate-800/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="text-2xl text-blue-400">{v.icon}</div>
                            <div>
                                <p className="font-semibold">{v.name}</p>
                                <p className="text-sm text-slate-400">{v.number}</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-white">Edit</button>
                    </div>
                ))}
            </div>
            <button className="w-full mt-6 p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition font-semibold">Add New Vehicle</button>
        </div>

        {/* --- Settings & Actions --- */}
        <div className="grid md:grid-cols-2 gap-8">
            {/* Settings Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center"><FaCog className="mr-3" />Settings</h3>
                <div className="space-y-4">
                    <ToggleSwitch label="Push Notifications" enabled={pushNotifications} setEnabled={setPushNotifications} />
                    <ToggleSwitch label="Email Updates" enabled={emailNotifications} setEnabled={setEmailNotifications} />
                    <button className="text-left text-slate-300 w-full pt-2 hover:text-blue-400">Change Password</button>
                </div>
            </div>

            {/* Account Actions Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6 flex flex-col justify-center">
                 <button className="w-full flex items-center justify-center p-3 bg-red-600/80 rounded-lg hover:bg-red-600 transition font-bold">
                    <FaSignOutAlt className="mr-3" /> Logout
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;