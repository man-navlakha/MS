import React, { useState } from 'react';
import { 
  ChevronDown, DollarSign, List, Star, Car, Route, Clock, Phone, X, Check 
} from 'lucide-react';

// New Component for the Job Request Panel
const NewJobRequest = ({ onReject }) => {
  return (
    <div className="w-full h-full flex flex-col font-sans bg-white rounded-lg shadow-xl">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-2 rounded-full">
            <Car className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Car Assistance</h3>
            <p className="text-sm text-gray-600">Customer needs help with puncture repair</p>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="bg-gray-100 p-3 rounded-lg text-center">
          <Route className="text-blue-500 mx-auto mb-1" size={20} />
          <p className="font-semibold text-lg">1.5 km</p>
          <p className="text-xs text-gray-500">Distance</p>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg text-center">
          <DollarSign className="text-green-500 mx-auto mb-1" size={20} />
          <p className="font-semibold text-lg">₹165</p>
          <p className="text-xs text-gray-500">Earnings</p>
        </div>
      </div>
      
      {/* Job Details */}
      <div className="px-4 space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Request ID:</span>
          <span className="font-mono">#1575775795880</span>
        </div>
        <div className="flex justify-between">
          <span>Vehicle Type:</span>
          <span>Car</span>
        </div>
         <div className="flex justify-between">
          <span>Requested:</span>
          <span>3:32:38 PM</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Time:</span>
          <span>5 mins</span>
        </div>
      </div>

      {/* Customer Contact Info */}
      <div className="m-4 mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
        <div className="flex items-start space-x-2">
          <Phone className="text-blue-500 mt-1 flex-shrink-0" size={16} />
          <div>
            <h4 className="font-semibold">Customer Contact</h4>
            <p className="text-xs text-gray-600">After accepting, you'll get the customer's contact details so you can call them directly.</p>
          </div>
        </div>
      </div>

      <div className="flex-grow"></div> {/* Pushes buttons to the bottom */}
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 p-4 border-t mt-4">
        <button 
          onClick={onReject}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-black transition-colors"
        >
          <X size={20} />
          <span>Reject</span>
        </button>
        <button className="w-full flex items-center justify-center space-x-2 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
          <Check size={20} />
          <span>Accept Job</span>
        </button>
      </div>
    </div>
  );
};


const RightPanel = ({ isOnline, setIsOnline }) => {
  const toggleOnlineStatus = () => setIsOnline(!isOnline);
  
  // State to control which panel is visible
  const [newRequest, setNewRequest] = useState(false);

  // If there's a new request, show the NewJobRequest component
  if (newRequest) {
    return (
      <div className="absolute top-4 right-4 w-80 h-[calc(100vh-8rem)] z-10">
        <NewJobRequest onReject={() => setNewRequest(false)} />
      </div>
    );
  }

  // Otherwise, show the default panel
  return (
    <div className="absolute top-4 right-4 w-80 h-[calc(100vh-8rem)] bg-white/80 backdrop-blur-sm rounded-lg shadow-xl z-10 p-4 flex flex-col font-sans">
      {/* Online/Offline Toggle */}
      <div className="flex flex-col items-center border-b pb-4">
        <label htmlFor="online-toggle" className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={isOnline}
            onChange={toggleOnlineStatus}
            id="online-toggle" 
            className="sr-only peer" 
          />
          <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
        </label>
        <p className={`mt-2 font-medium ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
          {isOnline ? "You are online" : "Go online to start receiving jobs"}
        </p>
      </div>

      {/* Panel Content */}
      <div className="mt-4 flex-grow overflow-y-auto space-y-3">
        {/* Test Button for New Request */}
        <div className="p-2">
            <button 
                onClick={() => setNewRequest(true)}
                className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
                Simulate New Request
            </button>
        </div>

        {/* Available Requests */}
        <details className="group">
          <summary className="flex justify-between items-center font-semibold cursor-pointer p-2 rounded-md hover:bg-gray-200">
            <div className="flex items-center space-x-2">
              <List className="text-blue-500" />
              <span>Available Requests</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-2 text-sm text-gray-600">
            {isOnline ? 'Searching for nearby requests...' : 'Go online to see requests.'}
          </div>
        </details>
        
        {/* Other sections... */}
        <details className="group">
          <summary className="flex justify-between items-center font-semibold cursor-pointer p-2 rounded-md hover:bg-gray-200">
            <div className="flex items-center space-x-2">
              <DollarSign className="text-green-500" />
              <span>Earnings</span>
            </div>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <p className="p-2 text-sm text-gray-600">
            Your weekly and monthly earnings summaries will be displayed here.
          </p>
        </details>
        {/* ...etc */}
      </div>
    </div>
  );
};

export default RightPanel;