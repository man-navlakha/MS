import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Loader, X } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

export default function FindingMechanic() {
  const { request_id } = useParams();
  const navigate = useNavigate();
  const { socket, lastMessage, connectionStatus } = useWebSocket();
  
  const [searchTime, setSearchTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (socket && connectionStatus === 'connected') {
      const message = {
        type: 'subscribe_to_request',
        request_id: parseInt(request_id)
      };
      socket.send(JSON.stringify(message));
    }
  }, [socket, connectionStatus, request_id]);

  useEffect(() => {
    if (lastMessage?.type === 'mechanic_accepted') {
      navigate('/mechanic-found', {
        state: {
          mechanic: lastMessage.mechanic_details,
          estimatedTime: lastMessage.estimated_arrival_time,
          requestId: request_id
        }
      });
    }
  }, [lastMessage, navigate, request_id]);

  const handleCancel = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const cancelMessage = {
        type: 'cancel_request',
        request_id: parseInt(request_id)
      };
      socket.send(JSON.stringify(cancelMessage));
    }
    navigate('/');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-2xl shadow-black/20 p-6 md:p-8"
        >
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                <Loader className="animate-spin" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Finding a Mechanic</h1>
            <p className="text-slate-400">We're searching for the nearest available mechanic...</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="text-blue-400" size={20} />
                <span>Search Time</span>
              </div>
              <span className="font-mono text-lg font-bold">{formatTime(searchTime)}</span>
            </div>
            <div className="text-center text-slate-400 text-sm">
              <p>Request ID: #{request_id}</p>
              <p className="mt-1">WebSocket: {connectionStatus}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <X size={18} />
              Cancel Request
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}