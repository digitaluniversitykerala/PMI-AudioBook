import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    origin: 'http://localhost:5173',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Content-Security-Policy': "default-src 'self'; " +
        // Allow audio/video to be loaded from the backend API host
        "media-src 'self' http://localhost:5000; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googleapis.com; " +
        "style-src 'self' 'unsafe-inline' https://*.google.com; " +
        "img-src 'self' data: https://*.google.com https://*.googleusercontent.com; " +
        "connect-src 'self' ws://localhost:5173 http://localhost:5000 https://*.google.com https://*.googleapis.com https://accounts.google.com http://localhost:*; " +
        "frame-src 'self' https://accounts.google.com;" +
        "worker-src 'self' blob:;"
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    'process.env': {
      VITE_GOOGLE_CLIENT_ID: JSON.stringify(process.env.VITE_GOOGLE_CLIENT_ID),
      VITE_API_BASE_URL: JSON.stringify(process.env.VITE_API_BASE_URL)
    }
  }
});
