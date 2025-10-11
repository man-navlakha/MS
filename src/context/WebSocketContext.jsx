import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const ws = useRef(null);

  useEffect(() => {
    const connect = async () => {
      setConnectionStatus('connecting');
      console.log('%c[WS-PROVIDER] Attempting to connect...', 'color: #8A2BE2;');

      try {
        const res = await api.get("core/ws-token/", { withCredentials: true });
        const wsToken = res.data.ws_token;
        if (!wsToken) throw new Error("Failed to get WebSocket token");

        const isProduction = import.meta.env.PROD;
        const wsScheme = isProduction ? "wss" : "ws";
        const backendHost = isProduction
          ? (import.meta.env.VITE_BACKEND_HOST || 'mechanic-setu.onrender.com').replace(/^(https?:\/\/)/, '')
          : window.location.host;
        
        const wsUrl = `${wsScheme}://${backendHost}/ws/job_notifications/?token=${wsToken}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('%c[WS-PROVIDER] Connection successful!', 'color: #00008B; font-weight: bold;');
          setConnectionStatus('connected');
          setSocket(ws.current);
        };

        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('%c[WS-PROVIDER] Message Received:', 'color: #00008B; font-weight: bold;', data);
          setLastMessage(data);
        };

        ws.current.onclose = () => {
          console.warn('[WS-PROVIDER] Disconnected.');
          setConnectionStatus('disconnected');
          setSocket(null);
        };

        ws.current.onerror = (error) => {
          console.error('[WS-PROVIDER] An error occurred:', error);
          setConnectionStatus('error');
        };

      } catch (error) {
        console.error('[WS-PROVIDER] Connection setup failed:', error);
        setConnectionStatus('error');
      }
    };

    connect();

    return () => {
      if (ws.current) {
        console.log('[WS-PROVIDER] Provider unmounting. Closing WebSocket.');
        ws.current.close(1000, "Provider unmounted");
      }
    };
  }, []);

  const value = { socket, lastMessage, connectionStatus };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};