import React from 'react';
import { Outlet } from 'react-router-dom';
import { WebSocketProvider } from '../context/WebSocketContext';

export default function RequestLayout() {
  return (
    <WebSocketProvider>
      <Outlet />
    </WebSocketProvider>
  );
}