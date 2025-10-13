// src/context/WebSocketContext.jsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const ws = useRef(null);

  useEffect(() => {
    const connect = async () => {
      // Prevent multiple connections if one is already open
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('%c[WS-PROVIDER] WebSocket already connected.', 'color: #008000;');
        return;
      }

      setConnectionStatus('connecting');
      console.log('%c[WS-PROVIDER] Attempting to connect...', 'color: #8A2BE2;');

      try {
        const res = await api.get("core/ws-token/", { withCredentials: true });
        const wsToken = res.data.ws_token;
        if (!wsToken) {
          throw new Error("Failed to get WebSocket token");
        }

        const isProduction = import.meta.env.PROD;
        const wsScheme = isProduction ? "wss" : "ws";
        const backendHost = isProduction
          ? (import.meta.env.VITE_BACKEND_HOST || 'mechanic-setu.onrender.com').replace(/^(https?:\/\/)/, '')
          : window.location.host;
        
        const wsUrl = `${wsScheme}://${backendHost}/ws/job_notifications/?token=${wsToken}`;
        console.log(`%c[WS-PROVIDER] Connecting to: ${wsUrl}`, 'color: #0000FF;');
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('%c[WS-PROVIDER] ==> Connection successful!', 'color: #008000; font-weight: bold;');
          toast.success('Real-time connection established.');
          setConnectionStatus('connected');
          setSocket(ws.current);
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('%c[WS-PROVIDER] ==> Message Received:', 'color: #00008B; font-weight: bold;', data);
            setLastMessage(data); // This triggers updates in components
          } catch (e) {
            console.error('[WS-PROVIDER] Error parsing incoming message:', e);
          }
        };

        ws.current.onclose = (event) => {
          console.warn(`[WS-PROVIDER] ==> Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
          if (event.code !== 1000) { // Don't show error for normal closures
            toast.error('Real-time connection lost.');
          }
          setConnectionStatus('disconnected');
          setSocket(null);
        };

        ws.current.onerror = (error) => {
          console.error('[WS-PROVIDER] ==> An error occurred:', error);
          toast.error('A real-time connection error occurred.');
          setConnectionStatus('error');
        };

      } catch (error) {
        console.error('[WS-PROVIDER] ==> Connection setup failed:', error);
        toast.error('Failed to establish real-time connection.');
        setConnectionStatus('error');
      }
    };

    connect();

    return () => {
      if (ws.current) {
        console.log('[WS-PROVIDER] Provider unmounting. Closing WebSocket.');
        ws.current.close(1000, "Provider unmounted");
        ws.current = null;
      }
    };
  }, []); // The empty dependency array is crucial. It ensures this runs only once.

  // This effect will log every time a new message is processed
  useEffect(() => {
    if (lastMessage) {
        console.log('%c[WS-PROVIDER] State updated with new message:', 'color: #FF00FF;', lastMessage);
    }
  }, [lastMessage]);

  const value = { socket, lastMessage, connectionStatus };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};