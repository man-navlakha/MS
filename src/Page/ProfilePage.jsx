// src/components/ProfilePage.js
import React, { useState, useCallback } from 'react';
import { 
  FaUserCircle, FaEnvelope, FaCar, FaMotorcycle, 
  FaCog, FaBell, FaSignOutAlt, FaEdit, FaSave, 
  FaTimes, FaPlus, FaTrash 
} from 'react-icons/fa';

// --- Mock Data ---
const MOCK_USER = {
  name: 'Nav Lathiya',
  email: 'nav.lathiya@example.com',
  memberSince: 'September 2025',
  avatar: null,
};

const MOCK_VEHICLES = [
  { id: 1, type: 'Car', name: 'Maruti Swift', number: 'GJ01AB1234', icon: <FaCar /> },
  { id: 2, type: 'Motorcycle', name: 'Honda Activa', number: 'GJ01CD5678', icon: <FaMotorcycle /> }
];

// --- Reusable Toggle Switch Component ---
const ToggleSwitch = React.memo(({ label, enabled, onToggle }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600">{label}</span>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled 
          ? 'bg-blue-400 shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF]' 
          : 'bg-gray-300 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF]'
      }`}
      aria-label={`${label} ${enabled ? 'enabled' : 'disabled'}`}
      aria-pressed={enabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
));

// --- Reusable Vehicle Card Component ---
const VehicleCard = React.memo(({ vehicle, onEdit, onDelete }) => (
  <div className="bg-gray-200 p-4 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <div className="text-2xl text-blue-500">{vehicle.icon}</div>
      <div>
        <p className="font-semibold text-gray-700">{vehicle.name}</p>
        <p className="text-sm text-gray-500">{vehicle.number}</p>
      </div>
    </div>
    <div className="flex space-x-2">
      <button 
        onClick={() => onEdit(vehicle.id)}
        className="text-gray-500 hover:text-blue-500 p-1 rounded-lg shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
        aria-label={`Edit ${vehicle.name}`}
      >
        <FaEdit size={14} />
      </button>
      <button 
        onClick={() => onDelete(vehicle.id)}
        className="text-gray-500 hover:text-red-500 p-1 rounded-lg shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
        aria-label={`Delete ${vehicle.name}`}
      >
        <FaTrash size={14} />
      </button>
    </div>
  </div>
));

// --- Reusable Editable Field Component ---
const EditableField = React.memo(({ label, name, value, onChange, type = "text" }) => (
  <div className="mb-4">
    <label className="block text-gray-600 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-gray-200 text-gray-700 p-3 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
    />
  </div>
));

const ProfilePage = () => {
  const [user, setUser] = useState(MOCK_USER);
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ type: 'Car', name: '', number: '' });
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  
  // Settings State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  // Toggle handlers with useCallback for performance
  const togglePushNotifications = useCallback(() => {
    setPushNotifications(prev => !prev);
  }, []);

  const toggleEmailNotifications = useCallback(() => {
    setEmailNotifications(prev => !prev);
  }, []);

  // User editing handlers
  const handleEdit = useCallback(() => {
    setEditedUser(user);
    setIsEditing(true);
  }, [user]);

  const handleSave = useCallback(() => {
    // Basic validation
    if (!editedUser.name.trim() || !editedUser.email.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedUser.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    setUser(editedUser);
    setIsEditing(false);
  }, [editedUser]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedUser(user);
  }, [user]);

  const handleUserChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  }, []);

  // Vehicle handlers
  const handleAddVehicle = useCallback(() => {
    if (!newVehicle.name.trim() || !newVehicle.number.trim()) {
      alert('Please fill in all vehicle fields');
      return;
    }
    
    const newVehicleWithId = {
      ...newVehicle,
      id: vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1,
      icon: newVehicle.type === 'Car' ? <FaCar /> : <FaMotorcycle />
    };
    
    setVehicles(prev => [...prev, newVehicleWithId]);
    setNewVehicle({ type: 'Car', name: '', number: '' });
    setIsAddingVehicle(false);
  }, [newVehicle, vehicles]);

  const handleEditVehicle = useCallback((id) => {
    setEditingVehicleId(id);
    const vehicleToEdit = vehicles.find(v => v.id === id);
    if (vehicleToEdit) {
      setNewVehicle({
        type: vehicleToEdit.type,
        name: vehicleToEdit.name,
        number: vehicleToEdit.number
      });
    }
  }, [vehicles]);

  const handleUpdateVehicle = useCallback(() => {
    if (!newVehicle.name.trim() || !newVehicle.number.trim()) {
      alert('Please fill in all vehicle fields');
      return;
    }
    
    setVehicles(prev => 
      prev.map(vehicle => 
        vehicle.id === editingVehicleId 
          ? { 
              ...vehicle, 
              ...newVehicle, 
              icon: newVehicle.type === 'Car' ? <FaCar /> : <FaMotorcycle /> 
            } 
          : vehicle
      )
    );
    
    setNewVehicle({ type: 'Car', name: '', number: '' });
    setEditingVehicleId(null);
  }, [newVehicle, editingVehicleId]);

  const handleDeleteVehicle = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
    }
  }, []);

  const handleNewVehicleChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  }, []);

  const cancelVehicleEdit = useCallback(() => {
    setNewVehicle({ type: 'Car', name: '', number: '' });
    setIsAddingVehicle(false);
    setEditingVehicleId(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-300 text-gray-700 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-8 text-gray-800">My Profile</h1>

        {/* --- User Information Card --- */}
        <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <FaUserCircle className="text-7xl text-gray-500" />
            <div className="flex-grow text-center sm:text-left">
              {isEditing ? (
                <div className="space-y-4">
                  <EditableField 
                    label="Name" 
                    name="name" 
                    value={editedUser.name} 
                    onChange={handleUserChange} 
                  />
                  <EditableField 
                    label="Email" 
                    name="email" 
                    value={editedUser.email} 
                    onChange={handleUserChange} 
                    type="email"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                  <p className="text-gray-600 flex items-center justify-center sm:justify-start">
                    <FaEnvelope className="mr-2" />{user.email}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">Member since {user.memberSince}</p>
                </>
              )}
            </div>
            {isEditing ? (
              <div className="flex space-x-2 self-start sm:self-auto">
                <button 
                  onClick={handleSave} 
                  className="p-3 bg-green-400 rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                  aria-label="Save changes"
                >
                  <FaSave className="text-white" />
                </button>
                <button 
                  onClick={handleCancel} 
                  className="p-3 bg-red-400 rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                  aria-label="Cancel changes"
                >
                  <FaTimes className="text-white" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleEdit} 
                className="p-3 bg-gray-300 rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition self-start sm:self-auto"
                aria-label="Edit profile"
              >
                <FaEdit className="text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* --- Saved Vehicles Card --- */}
        <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">My Vehicles</h3>
          
          {isAddingVehicle || editingVehicleId ? (
            <div className="bg-gray-300 p-4 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-600 mb-1">Type</label>
                  <select
                    name="type"
                    value={newVehicle.type}
                    onChange={handleNewVehicleChange}
                    className="w-full bg-gray-200 text-gray-700 p-3 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                  >
                    <option value="Car">Car</option>
                    <option value="Motorcycle">Motorcycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newVehicle.name}
                    onChange={handleNewVehicleChange}
                    className="w-full bg-gray-200 text-gray-700 p-3 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                    placeholder="e.g., Maruti Swift"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-600 mb-1">Number</label>
                  <input
                    type="text"
                    name="number"
                    value={newVehicle.number}
                    onChange={handleNewVehicleChange}
                    className="w-full bg-gray-200 text-gray-700 p-3 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                    placeholder="e.g., GJ01AB1234"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={editingVehicleId ? handleUpdateVehicle : handleAddVehicle}
                  className="px-4 py-2 bg-blue-400 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition font-semibold"
                >
                  {editingVehicleId ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
                <button 
                  onClick={cancelVehicleEdit}
                  className="px-4 py-2 bg-gray-400 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          
          <div className="space-y-4 mb-6">
            {vehicles.length > 0 ? (
              vehicles.map(vehicle => (
                <VehicleCard 
                  key={vehicle.id} 
                  vehicle={vehicle} 
                  onEdit={handleEditVehicle}
                  onDelete={handleDeleteVehicle}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No vehicles added yet</p>
            )}
          </div>
          
          {!isAddingVehicle && !editingVehicleId && (
            <button 
              onClick={() => setIsAddingVehicle(true)}
              className="w-full flex items-center justify-center p-3 bg-blue-400 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition font-semibold"
            >
              <FaPlus className="mr-2" /> Add New Vehicle
            </button>
          )}
        </div>

        {/* --- Settings & Actions --- */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Settings Card */}
          <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
              <FaCog className="mr-3" /> Settings
            </h3>
            <div className="space-y-4">
              <ToggleSwitch 
                label="Push Notifications" 
                enabled={pushNotifications} 
                onToggle={togglePushNotifications} 
              />
              <ToggleSwitch 
                label="Email Updates" 
                enabled={emailNotifications} 
                onToggle={toggleEmailNotifications} 
              />
              <button className="text-left text-gray-600 w-full pt-2 hover:text-blue-500 transition">
                Change Password
              </button>
            </div>
          </div>

          {/* Account Actions Card */}
          <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 flex flex-col justify-center">
            <button className="w-full flex items-center justify-center p-3 bg-red-400 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition font-bold">
              <FaSignOutAlt className="mr-3" /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;