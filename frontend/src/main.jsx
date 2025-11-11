import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

// Get Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error('Google Client ID is not set. Please check your .env file');
} else {
  console.log('Google Client ID loaded successfully');
}

// Simple configuration for Google OAuth
const googleOAuthConfig = {
  clientId: GOOGLE_CLIENT_ID,
  onScriptLoadError: () => console.error('Failed to load Google OAuth script'),
  onScriptLoadSuccess: () => console.log('Google OAuth script loaded successfully'),
  ux_mode: 'popup',
  scope: 'profile email',
  redirect_uri: 'http://localhost:5173',
  prompt: 'select_account',
  cookiePolicy: 'single_host_origin'
};

// Add Google API script to the document head
const script = document.createElement('script');
script.src = 'https://accounts.google.com/gsi/client';
script.async = true;
script.defer = true;
document.head.appendChild(script);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider {...googleOAuthConfig}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
