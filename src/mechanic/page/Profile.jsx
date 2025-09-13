import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import {
  User, Shield, Lock, DollarSign, History, Car, Bell, Home,
  ChevronRight, Wrench, ArrowLeft // Import ArrowLeft for the back button
} from 'lucide-react';


const Profile = () => {
  const [activeSection, setActiveSection] = useState('home'); 
  const navigate = useNavigate();
  // Default to 'home'
 // The function to handle going back to the dashboard
  const handleGoBack = () => {
    navigate('/'); // 3. Navigate to the root path, which is our Dashboard
  };
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <HomeOverview />;
      case 'personalInfo':
        return <PersonalInfo />;
      case 'security':
        return <Security />;
      case 'privacyData':
        return <PrivacyData />;
      case 'earnings':
        return <Earnings />;
      case 'jobHistory':
        return <JobHistory />;
      case 'vehicleInfo':
        return <VehicleInfo />;
      case 'notifications':
        return <Notifications />;
      default:
        return <HomeOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Top Bar */}
        <nav className="bg-gray-800 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* 4. Add the back button here */}
          <button
            onClick={handleGoBack}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Mechanic Profile</h1>
        </div>
      </nav>

      <div className="flex">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-lg h-[calc(100vh-64px)] overflow-y-auto pt-4">
          <ul className="space-y-1">
            <NavItem icon={<Home size={20} />} label="Home" section="home" activeSection={activeSection} setActiveSection={setActiveSection} />
            <NavItem icon={<User size={20} />} label="Personal Info" section="personalInfo" activeSection={activeSection} setActiveSection={setActiveSection} />
            <NavItem icon={<Shield size={20} />} label="Security" section="security" activeSection={activeSection} setActiveSection={setActiveSection} />
            <NavItem icon={<Lock size={20} />} label="Privacy & Data" section="privacyData" activeSection={activeSection} setActiveSection={setActiveSection} />
            <NavItem icon={<DollarSign size={20} />} label="Earnings" section="earnings" activeSection={activeSection} setActiveSection={setActiveSection} />
            <NavItem icon={<History size={20} />} label="Job History" section="jobHistory" activeSection={activeSection} setActiveSection={setActiveSection} />
            <NavItem icon={<Car size={20} />} label="Vehicle Info" section="vehicleInfo" activeSection={activeSection} setActiveSection={setActiveSection} />
            <NavItem icon={<Bell size={20} />} label="Notifications" section="notifications" activeSection={activeSection} setActiveSection={setActiveSection} />
          </ul>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Reusable Nav Item Component
const NavItem = ({ icon, label, section, activeSection, setActiveSection }) => (
  <li>
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center w-full p-3 text-left space-x-3 
        ${activeSection === section ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-500' : 'text-gray-700 hover:bg-gray-100'}
        transition-colors duration-200`}
    >
      {icon}
      <span>{label}</span>
    </button>
  </li>
);

// --- Content Components for each section ---

const HomeOverview = () => (
  <div className="bg-white p-8 rounded-lg shadow-md">
    {/* Profile Header */}
    <div className="flex items-center space-x-6 pb-6 border-b border-gray-200 mb-8">
      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-6xl">
        <User size={64} />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Man</h2>
        <p className="text-gray-600 text-lg">mannavlakha002@gmail.com</p>
      </div>
    </div>

    {/* Quick Action Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <QuickActionCard icon={<User size={24} />} title="Personal Info" description="Update your details" />
      <QuickActionCard icon={<Shield size={24} />} title="Security" description="Manage password & 2FA" />
      <QuickActionCard icon={<DollarSign size={24} />} title="Earnings" description="View payments & statements" />
      <QuickActionCard icon={<History size={24} />} title="Job History" description="Review past work" />
    </div>

    {/* Suggestions */}
    <h3 className="text-2xl font-semibold text-gray-800 mb-6">Suggestions</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-sm flex items-start space-x-4">
        <Wrench size={48} className="text-blue-600 flex-shrink-0" />
        <div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">Complete your mechanic profile</h4>
          <p className="text-gray-700 mb-4">
            Complete your profile to unlock more features and improve your visibility to customers.
          </p>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            Begin checkup <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow-sm flex items-start space-x-4">
        <Car size={48} className="text-yellow-600 flex-shrink-0" />
        <div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">Add your vehicle details</h4>
          <p className="text-gray-700 mb-4">
            Customers need to know what vehicle you use. Add your vehicle's make, model, and license plate.
          </p>
          <button className="bg-yellow-600 text-white px-5 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center">
            Add Vehicle <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ icon, title, description }) => (
  <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow cursor-pointer">
    <div className="text-blue-600">{icon}</div>
    <div>
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </div>
);


// Placeholder Components for other sections
const PersonalInfo = () => (
  <div className="bg-white p-8 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
    <p className="text-gray-700">Here you can view and update your personal details like name, contact information, and address.</p>
    {/* Add forms and input fields here */}
    <div className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
        <input type="text" id="name" defaultValue="Man" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
        <input type="email" id="email" defaultValue="mannavlakha002@gmail.com" readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 cursor-not-allowed" />
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Save Changes</button>
    </div>
  </div>
);

const Security = () => (
  <div className="bg-white p-8 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
    <p className="text-gray-700">Manage your password, two-factor authentication, and connected devices.</p>
    {/* Add security options */}
    <ul className="mt-6 space-y-3">
        <li className="flex justify-between items-center p-3 border rounded-md">
            <span>Change Password</span>
            <ChevronRight size={20} className="text-gray-500" />
        </li>
        <li className="flex justify-between items-center p-3 border rounded-md">
            <span>Two-Factor Authentication</span>
            <span className="text-green-600 text-sm">Enabled</span>
        </li>
        <li className="flex justify-between items-center p-3 border rounded-md">
            <span>Recent Activity Log</span>
            <ChevronRight size={20} className="text-gray-500" />
        </li>
    </ul>
  </div>
);

const PrivacyData = () => (
  <div className="bg-white p-8 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-4">Privacy & Data</h2>
    <p className="text-gray-700">Control your data, privacy settings, and communication preferences.</p>
    {/* Add privacy options */}
    <ul className="mt-6 space-y-3">
        <li className="flex justify-between items-center p-3 border rounded-md">
            <span>Download your data</span>
            <ChevronRight size={20} className="text-gray-500" />
        </li>
        <li className="flex justify-between items-center p-3 border rounded-md">
            <span>Marketing Communications</span>
            <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </li>
    </ul>
  </div>
);

const Earnings = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Earnings Overview</h2>
      <p className="text-gray-700">View your detailed earnings, payout history, and download statements.</p>
      <div className="mt-6 space-y-4">
        <div className="p-4 border rounded-md bg-green-50">
            <h3 className="text-lg font-semibold text-green-800">Total Earnings: <span className="text-2xl font-bold">₹15,250</span></h3>
            <p className="text-green-700 text-sm">As of {new Date().toLocaleDateString()}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">View Detailed Statements</button>
        <button className="ml-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">Payout History</button>
      </div>
    </div>
);

const JobHistory = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Job History</h2>
      <p className="text-gray-700">Review all your past job requests, their status, and customer ratings.</p>
      <ul className="mt-6 space-y-4">
        <li className="p-4 border rounded-md flex justify-between items-center hover:bg-gray-50 cursor-pointer">
            <div>
                <p className="font-semibold">Flat Tire Change - Customer A</p>
                <p className="text-sm text-gray-600">Completed on {new Date().toLocaleDateString()}</p>
            </div>
            <span className="text-green-600 font-semibold">₹500</span>
        </li>
        <li className="p-4 border rounded-md flex justify-between items-center hover:bg-gray-50 cursor-pointer">
            <div>
                <p className="font-semibold">Battery Jumpstart - Customer B</p>
                <p className="text-sm text-gray-600">Completed on {new Date().toLocaleDateString()}</p>
            </div>
            <span className="text-green-600 font-semibold">₹700</span>
        </li>
        <li className="p-4 border rounded-md flex justify-between items-center hover:bg-gray-50 cursor-pointer">
            <div>
                <p className="font-semibold">Brake Inspection - Customer C</p>
                <p className="text-sm text-gray-600">Completed on {new Date().toLocaleDateString()}</p>
            </div>
            <span className="text-green-600 font-semibold">₹1200</span>
        </li>
      </ul>
    </div>
);

const VehicleInfo = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Vehicle Information</h2>
      <p className="text-gray-700">Add or manage the details of the vehicle(s) you use for service.</p>
      <div className="mt-6 space-y-4">
        <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">Make</label>
            <input type="text" id="make" defaultValue="Toyota" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
            <input type="text" id="model" defaultValue="Camry" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
            <label htmlFor="license" className="block text-sm font-medium text-gray-700">License Plate</label>
            <input type="text" id="license" defaultValue="ABC 1234" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Save Vehicle Info</button>
      </div>
    </div>
);

const Notifications = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
      <p className="text-gray-700">Customize how you receive alerts about new jobs, payments, and system updates.</p>
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center p-3 border rounded-md">
            <span>New Job Alerts</span>
            <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
        <div className="flex justify-between items-center p-3 border rounded-md">
            <span>Payment Confirmations</span>
            <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
      </div>
    </div>
);


export default Profile;