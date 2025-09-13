import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // ✅ CORRECTED: Point to your actual backend server
        target: 'https://mechanic-setu.onrender.com', 
        changeOrigin: true,
        secure: true,
      },
      // This WebSocket proxy is likely for another feature, but if it should also
      // point to the same server, update it as well.
      '/ws': {
        target: 'wss://mechanic-setu.onrender.com', 
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});