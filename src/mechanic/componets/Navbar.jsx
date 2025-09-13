import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, User, Settings, Lock, LogOut, ChevronDown } from 'lucide-react';
import { useLock } from '../../context/LockContext';

const Navbar = ({ mechanicName = "John Doe" }) => {
  const { lockScreen } = useLock();
  const navigate = useNavigate();

  // State to manage the dropdown's visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Function to handle logout
  const handleLogout = () => {
    // In a real app, you would clear auth tokens here
    console.log("User logged out");
    setIsDropdownOpen(false);
    navigate('/login'); // Redirect to login page
  };

  // Close the dropdown if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <nav className="bg-gray-800 text-white p-3 flex justify-between items-center shadow-lg z-30 relative">
      {/* Left Side: Logo and Title */}
      <Link to="/" className="flex items-center space-x-2">
        <Wrench className="h-8 w-8 text-yellow-400" />
        <span className="text-xl font-bold tracking-wider">MechConnect</span>
      </Link>

      {/* Right Side: User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center font-bold">
            {mechanicName.charAt(0)}
          </div>
          <span className="font-semibold hidden md:block">{mechanicName}</span>
          <ChevronDown 
            size={20} 
            className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl overflow-hidden animate-fade-in-down">
            <div className="p-4 border-b border-gray-200">
              <p className="font-bold text-gray-800">{mechanicName}</p>
              <p className="text-sm text-gray-500">Mechanic</p>
            </div>
            <ul className="text-gray-700">
              <DropdownItem icon={<User size={18} />} to="/profilepage" onClick={() => setIsDropdownOpen(false)}>
                Profile
              </DropdownItem>
              <DropdownItem icon={<Settings size={18} />} to="/settings" onClick={() => setIsDropdownOpen(false)}>
                Settings
              </DropdownItem>
              <DropdownItem icon={<Lock size={18} />} onClick={() => { lockScreen(); setIsDropdownOpen(false); }}>
                Lock Screen
              </DropdownItem>
              <hr className="border-gray-200" />
              <DropdownItem icon={<LogOut size={18} />} onClick={handleLogout} isRed>
                Logout
              </DropdownItem>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

// A reusable component for dropdown items to keep the code clean
const DropdownItem = ({ icon, children, to, onClick, isRed = false }) => {
  const content = (
    <div
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
        isRed 
        ? 'text-red-500 hover:bg-red-50' 
        : 'hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{children}</span>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : <button className="w-full text-left">{content}</button>;
};

export default Navbar;