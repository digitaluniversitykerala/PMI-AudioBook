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
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "script-src * 'unsafe-inline' 'unsafe-eval'; " +
        "connect-src * 'unsafe-inline'; " +
        "img-src * data: blob:; " +
        "frame-src *; " +
        "style-src * 'unsafe-inline';"
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
      },
      '/uploads': {
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
