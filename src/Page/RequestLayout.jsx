// src/Page/RequestLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';

export default function RequestLayout() {
  // The WebSocketProvider is now handled globally in App.jsx
  return <Outlet />;
}