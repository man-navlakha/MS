// FindingMechanic.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Add these imports
import { motion } from 'framer-motion';
import { Wrench, Clock, MapPin, User, Phone, Loader, CheckCircle, X, Home } from 'lucide-react';
import api from '../utils/api';

export default function FindingMechanic() {
  const { request_id } = useParams(); // Get request_id from URL
  const navigate = useNavigate(); // For navigation
  const [status, setStatus] = useState('searching');
  const [mechanic, setMechanic] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [searchTime, setSearchTime] = useState(0);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const timerRef = useRef(null);

  // Timer for tracking search duration
  useEffect(() => {
    if (status === 'searching') {
      timerRef.current = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // WebSocket connection
  useEffect(() => {
    let isMounted = true;
    let ws = null;

    const connectWebSocket = async () => {
      if (!isMounted || !request_id) return;

      setConnectionStatus('connecting');
      
      try {
        // Get WebSocket token
        const res = await api.get("core/ws-token/", { withCredentials: true });
        const wsToken = res.data.ws_token;
        
        if (!wsToken) throw new Error("Failed to get WebSocket token");

        const isProduction = process.env.NODE_ENV === 'production';
        const wsScheme = isProduction ? "wss" : "ws";
        const backendHost = isProduction
          ? (process.env.REACT_APP_BACKEND_HOST || 'mechanic-setu.onrender.com').replace(/^(https?:\/\/)/, '')
          : window.location.host;

        const wsUrl = `${wsScheme}://${backendHost}/ws/job_notifications/?token=${wsToken}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("[FindingMechanic] WebSocket connected");
          if (isMounted) {
            setSocket(ws);
            setConnectionStatus('connected');
            
            // Send request_id to WebSocket after connection is established
            const message = {
              type: 'subscribe_to_request',
              request_id: parseInt(request_id)
            };
            ws.send(JSON.stringify(message));
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;

          try {
            const data = JSON.parse(event.data);
            console.log("[FindingMechanic] Received:", data);

            // Handle different message types
            switch (data.type) {
              case 'mechanic_assigned':
                handleMechanicAssigned(data);
                break;
              case 'searching_mechanic':
                setStatus('searching');
                break;
              case 'estimated_time_update':
                setEstimatedTime(data.estimated_minutes);
                break;
              case 'error':
                console.error("WebSocket error:", data.message);
                setStatus('error');
                break;
              default:
                console.log("Unknown message type:", data);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onclose = (event) => {
          console.log("[FindingMechanic] WebSocket disconnected:", event.code, event.reason);
          if (isMounted) {
            setConnectionStatus('disconnected');
            if (status === 'searching') {
              // Try to reconnect if we're still searching
              setTimeout(() => {
                if (isMounted) connectWebSocket();
              }, 3000);
            }
          }
        };

        ws.onerror = (error) => {
          console.error("[FindingMechanic] WebSocket error:", error);
          if (isMounted) {
            setConnectionStatus('error');
          }
        };

      } catch (error) {
        console.error("[FindingMechanic] WebSocket connection failed:", error);
        if (isMounted) {
          setConnectionStatus('error');
          setStatus('error');
        }
      }
    };

    const handleMechanicAssigned = (data) => {
      setMechanic(data.mechanic);
      setEstimatedTime(data.estimated_arrival_time);
      setStatus('found');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (ws) {
        ws.close(1000, "Component unmounted");
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [request_id, status]);

  const handleCancel = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const cancelMessage = {
        type: 'cancel_request',
        request_id: parseInt(request_id)
      };
      socket.send(JSON.stringify(cancelMessage));
    }
    
    // Navigate back to home or form page
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleCallMechanic = () => {
    if (mechanic?.phone) {
      window.open(`tel:${mechanic.phone}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-2xl shadow-black/20 p-6 md:p-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-full ${status === 'searching' ? 'bg-blue-500/20 text-blue-400' : status === 'found' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {status === 'searching' ? <Loader className="animate-spin" size={32} /> : 
                 status === 'found' ? <CheckCircle size={32} /> : <X size={32} />}
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {status === 'searching' && 'Finding a Mechanic'}
              {status === 'found' && 'Mechanic Assigned!'}
              {status === 'error' && 'Connection Error'}
            </h1>
            <p className="text-slate-400">
              {status === 'searching' && 'We\'re searching for the nearest available mechanic...'}
              {status === 'found' && 'Your mechanic is on the way!'}
              {status === 'error' && 'Please check your connection and try again'}
            </p>
          </div>

          {/* Search Info */}
          {status === 'searching' && (
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-400" size={20} />
                  <span>Search Time</span>
                </div>
                <span className="font-mono text-lg font-bold">{formatTime(searchTime)}</span>
              </div>

              {estimatedTime && (
                <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="text-green-400" size={20} />
                    <span>Estimated Wait</span>
                  </div>
                  <span className="font-semibold">{estimatedTime} min</span>
                </div>
              )}

              <div className="text-center text-slate-400 text-sm">
                <p>Request ID: #{request_id}</p>
                <p className="mt-1">WebSocket: {connectionStatus}</p>
              </div>
            </div>
          )}

          {/* Mechanic Found */}
          {status === 'found' && mechanic && (
            <div className="space-y-6 mb-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <User className="text-green-400" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">{mechanic.name}</h3>
                    <p className="text-green-300 text-sm">Verified Mechanic</p>
                  </div>
                </div>
                
                {mechanic.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(Math.floor(mechanic.rating))}
                      {'☆'.repeat(5 - Math.floor(mechanic.rating))}
                    </div>
                    <span className="text-sm text-slate-300">({mechanic.rating})</span>
                  </div>
                )}

                {mechanic.phone && (
                  <button
                    onClick={handleCallMechanic}
                    className="flex items-center gap-2 w-full justify-center py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors mt-2"
                  >
                    <Phone size={16} />
                    Call Mechanic
                  </button>
                )}
              </div>

              {estimatedTime && (
                <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="text-green-400" size={20} />
                    <span>Estimated Arrival</span>
                  </div>
                  <span className="font-semibold">{estimatedTime} min</span>
                </div>
              )}

              {mechanic.vehicle_number && (
                <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="text-blue-400" size={20} />
                    <span>Mechanic Vehicle</span>
                  </div>
                  <span className="font-mono text-sm">{mechanic.vehicle_number}</span>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
              <p className="text-red-300 mb-4">
                There was a problem connecting to our service. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {status === 'searching' && (
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <X size={18} />
                Cancel Request
              </button>
            )}
            
            {status === 'found' && (
              <>
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-3 px-4 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Home size={18} />
                  Home
                </button>
                <button
                  onClick={handleCallMechanic}
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  Call Now
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}