import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import {
  MapPin,
  Wrench,
  History,
  User,
  Search,
  Star,
  Car,
  Bike,
  Battery,
  Settings,
  Phone,
  Clock,
  Navigation,
  Zap,
  Shield,
  ChevronRight,
  Filter,
  Heart,
  MessageCircle,
  X
} from 'lucide-react';

// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useNavigate } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icon
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="animated-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Enhanced Mock Data
const mockNearbyMechanics = [
  {
    id: 1,
    name: 'Ashok Auto Service',
    address: 'SG Highway, Ahmedabad',
    rating: 4.8,
    distance: '0.8 km',
    price: '₹299',
    services: ['Engine', 'Brakes', 'AC'],
    available: true,
    responseTime: '15 min',
    position: [23.0425, 72.5714]
  },
  {
    id: 3,
    name: 'Quick Fix Motors',
    address: 'Satellite Road, Ahmedabad',
    rating: 4.5,
    distance: '2.1 km',
    price: '₹249',
    services: ['Emergency', 'Towing'],
    available: false,
    responseTime: '30 min',
    position: [23.0225, 72.5614]
  }
];

const mockRecentServices = [
  { id: 1, name: 'Battery Replacement', mechanic: 'Ashok Auto Service', date: '2 days ago', status: 'Completed' },
  { id: 2, name: 'Flat Tire Repair', mechanic: 'Royal Garage', date: '1 week ago', status: 'Completed' },
];

const serviceCategories = [
  { id: 1, label: 'Car Service', icon: Car, color: 'bg-blue-500', count: '120+ mechanics' },
  { id: 2, label: 'Bike Service', icon: Bike, color: 'bg-green-500', count: '89+ mechanics' },
];

// Enhanced Service Card Component
const ServiceCard = React.memo(({ service, onSelect }) => (
  <div
    onClick={() => onSelect(service)}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02]"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl ${service.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <Wrench size={20} />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">{service.name}</h3>
          <p className="text-gray-400 text-sm">{service.address}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center space-x-1 mb-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-white font-semibold">{service.rating}</span>
        </div>
        <p className="text-gray-400 text-xs">{service.distance}</p>
      </div>
    </div>

    <div className="flex items-center justify-between mb-3">
      <div className="flex flex-wrap gap-1">
        {service.services.map((s, idx) => (
          <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg">
            {s}
          </span>
        ))}
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-lg">{service.price}</p>
        <p className="text-gray-400 text-xs">starting from</p>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 text-sm">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-gray-300">{service.responseTime}</span>
        {service.available ? (
          <span className="text-green-400 font-semibold">Available</span>
        ) : (
          <span className="text-red-400 font-semibold">Busy</span>
        )}
      </div>
      <div className="flex space-x-2">
        <button className="p-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors">
          <Phone className="w-4 h-4 text-blue-400" />
        </button>
        <button className="p-2 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-colors">
          <MessageCircle className="w-4 h-4 text-green-400" />
        </button>
      </div>
    </div>
  </div>
));

// Map controller component to handle view changes
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Enhanced Panel Content
const PanelContent = React.memo(({ selectedService, onServiceSelect, onBackToHome }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  if (selectedService) {
    return (
      <div className="flex-grow overflow-y-auto px-4 pt-2 pb-8">
        <button
          onClick={onBackToHome}
          className="flex items-center text-blue-400 mb-4 hover:text-blue-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
          Back to search
        </button>

        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedService.name}</h2>
              <p className="text-gray-300 mb-1">{selectedService.address}</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white">{selectedService.rating}</span>
                </div>
                <span className="text-gray-300">{selectedService.distance} away</span>
                <span className="text-gray-300">{selectedService.responseTime}</span>
              </div>
            </div>
            <button className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors">
              <Heart className="w-5 h-5 text-red-400" />
            </button>
          </div>

          <div className="flex space-x-3 mb-4">
            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Call Now</span>
            </button>
            <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2">
              <Navigation className="w-4 h-4" />
              <span>Book Service</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Services Offered</h3>
          <div className="grid grid-cols-2 gap-3">
            {selectedService.services.map((service, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white font-medium">{service}</p>
                <p className="text-gray-400 text-sm">Professional service</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto px-4 pt-2 pb-8 space-y-6">
      {/* Enhanced Search Bar */}

      {/* Service Categories Grid */}
      <div>
        <h1 className='text-white font-bold mt-10'>Book Mechanic</h1>
        <div onClick={() => { navigate('/request') }} className="mt-3 bg-green-300/30 border border-green-200/30 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 group">
          <h4 className="font-semibold text-green-500 text-center">Request Now</h4>
        </div>
      </div>

      {/* Nearby Mechanics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Nearby Mechanics</h3>
          <span className="text-sm text-blue-400">{mockNearbyMechanics.length} found</span>
        </div>
        <div className="space-y-3">
          {mockNearbyMechanics.map((mechanic) => (
            <ServiceCard
              key={mechanic.id}
              service={mechanic}
              onSelect={onServiceSelect}
            />
          ))}
        </div>
      </div>

      {/* Recent Services */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Services</h3>
        <div className="space-y-3">
          {mockRecentServices.map((service) => (
            <div key={service.id} className="flex items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="p-2 bg-green-500/20 rounded-xl text-green-400 mr-3">
                <History className="w-5 h-5" />
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-white">{service.name}</p>
                <p className="text-sm text-gray-400">{service.mechanic} • {service.date}</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-lg">
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className='mb-10'>
        <a href="/login">Login</a>
        <a href="/logout">Logout</a>
        <h5 className='text-white/10 '>This Created for development purpose</h5>
      </div>

      
    </div>
  );
});

const MechanicAppUI = () => {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('Home');
  const [selectedService, setSelectedService] = useState(null);
  const mapRef = useRef();
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  // 'home' | 'serviceForm' | 'profile'
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const navigate = useNavigate()

  useEffect(() => {
    window.handleMechanicClick = (id) => {
      const mechanic = mockNearbyMechanics.find(m => m.id === id);
      setSelectedMechanic(mechanic);
    };
  }, []);


  // Enhanced bottom sheet logic
  const sheetHeight = useMemo(() => window.innerHeight * 0.9, []);
  const snapPoints = useMemo(() => [0, -sheetHeight * 0.4, -sheetHeight * 0.85], [sheetHeight]);

  const [{ y }, api] = useSpring(() => ({ y: snapPoints[1] }));

  const open = useCallback((snapIndex = 2) => {
    api.start({ y: snapPoints[snapIndex] });
    if (mapRef.current && snapIndex > 0) {
      const panByY = (window.innerHeight - Math.abs(snapPoints[snapIndex])) / 2;
      mapRef.current.panBy([0, -panByY], { animate: true, duration: 0.4 });
    } else if (mapRef.current) {
      mapRef.current.panTo(position, { animate: true, duration: 0.4 });
    }
  }, [api, snapPoints, position]);

  const bind = useDrag(
    ({ last, movement: [, my], velocity: [, vy], direction: [, dy], memo = y.get() }) => {
      if (last) {
        const projectedY = memo + my + dy * vy * 250;
        const closestSnap = snapPoints.reduce((prev, curr) =>
          Math.abs(curr - projectedY) < Math.abs(prev - projectedY) ? curr : prev
        );
        const snapIndex = snapPoints.indexOf(closestSnap);
        open(snapIndex);
      } else {
        api.start({ y: memo + my, immediate: true });
      }
      return memo;
    },
    { axis: 'y', from: () => [0, y.get()], bounds: { top: snapPoints[2] } }
  );

  const handleServiceSelect = useCallback((service) => {
    setSelectedService(service);
    open(2); // Open to full height when selecting a service
  }, [open]);

  const handleBackToHome = useCallback(() => {
    setSelectedService(null);
    open(1); // Return to half height when going back
  }, [open]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        setLoading(false);
      },
      (err) => {
        console.error("Error getting location:", err);
        setPosition([23.0225, 72.5714]);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <h2 className="text-white text-2xl font-bold mb-2">Mechanic Setu</h2>
        <p className="text-gray-400">Finding mechanics near you...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {/* Enhanced Map Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full md:ml-96">
          <MapContainer
            center={position}
            zoom={15}
            className="w-full h-full"
            zoomControl={false}
            attributionControl={false}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://man-navlakha.netlify.app/">Man Navlakha</a> Developer of this Website'
            />
            <MapController center={position} />
            {position && (
              <>
                <Marker position={position} icon={createCustomIcon()} />
                <Circle
                  center={position}
                  radius={1000}
                  pathOptions={{ fillColor: 'blue', fillOpacity: 0.1, color: 'blue', weight: 2 }}
                />
                {mockNearbyMechanics.map(mechanic => (
                  <Marker
                    key={mechanic.id}
                    position={mechanic.position}
                    icon={L.divIcon({
                      className: 'mechanic-marker',
                      html: `
      <div onclick="handleMechanicClick(${mechanic.id})"
           class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h4l3 10h8l3-10h4" />
        </svg>
      </div>
    `,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                    })}
                  >
                    {selectedMechanic?.id === mechanic.id && (
                      <Popup>
                        <div className="text-sm">
                          <strong>{mechanic.name}</strong><br />
                          {mechanic.address}<br />
                          Rating: {mechanic.rating} ⭐<br />
                          Services: {mechanic.services.join(', ')}<br />
                          Price: {mechanic.price}<br />
                          Response: {mechanic.responseTime}<br />
                          Status: {mechanic.available ? 'Available' : 'Busy'}
                        </div>
                      </Popup>
                    )}
                  </Marker>

                ))}
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Enhanced Desktop Top Navbar */}
      <nav className=" md:flex absolute top-0 left-0 right-0  z-30 bg-slate-900/90 backdrop-blur-lg border-b border-white/10 h-20 items-center justify-between px-6">
        <div className="flex items-center ">
          <div className=" rounded-xl">
            <img src="/ms.png" className='w-17 h-17' alt="" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-white tracking-wider">
            MECHANIC SETU
          </h1>
        </div>
        <div className="flex items-center space-x-6 text-white hidden lg:flex">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-300">Online</span>
          </div>
          <span className="text-lg">Welcome, Man!</span>
          <div onClick={() => { navigate('/profile') }} className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {/* <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">3</span>
            </div> */}
          </div>
        </div>
      </nav>

      {/* Enhanced Desktop Left Panel */}
      <aside className="hidden md:flex   h-full min-h-64 fixed top-20 left-0 bottom-0 z-20 w-96 bg-slate-900/95 backdrop-blur-lg border-r border-white/10 flex-col">
        <PanelContent
          selectedService={selectedService}
          onServiceSelect={handleServiceSelect}
          onBackToHome={handleBackToHome}
          navigate={navigate}
        />
      </aside>

      {/* Enhanced Mobile Bottom Sheet */}
      <animated.div
        {...bind()}
        style={{
  y,
  height: sheetHeight,
  bottom: Math.max(-sheetHeight, -700),
  touchAction: 'none'
}}

        className="md:hidden fixed left-0 right-0 z-20 rounded-t-3xl shadow-2xl bg-slate-900/95 backdrop-blur-lg border-t border-white/20 text-white flex flex-col"
      >
        <div className="p-4 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-500 rounded-full mx-auto"></div>
        </div>
        <PanelContent
          selectedService={selectedService}
          onServiceSelect={handleServiceSelect}
          onBackToHome={handleBackToHome}
          navigate={navigate}
        />
      </animated.div>

      {/* Enhanced Mobile Bottom Navigation */}
      <footer className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-white/10 px-6 py-4 pb-safe">
        <div className="flex justify-around">
          {[
            { name: 'Home', icon: MapPin, badge: null },
            { name: 'Request', icon: Wrench, badge: 2 },
            { name: 'Activity', icon: History, badge: null },
            { name: 'Account', icon: User, badge: null },
          ].map(item => {
            const IconComponent = item.icon;
            const isActive = activeNav === item.name;
            return (
              <div
                key={item.name}
                onClick={() => setActiveNav(item.name)}
                className={`relative flex flex-col items-center transition-all duration-200 cursor-pointer ${isActive
                  ? 'text-blue-400 transform scale-110'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <div className="relative">
                  <IconComponent className="w-6 h-6 mb-1" />
                  {item.badge && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{item.badge}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};

export default MechanicAppUI;