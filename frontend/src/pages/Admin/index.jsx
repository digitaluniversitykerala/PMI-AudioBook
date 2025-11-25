import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Volume2, VolumeX, Contrast, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/hooks/useAccessibility";
import AdminUpload from "@/components/AdminUpload";
import API from "@/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize with safe defaults
  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    largeText: false,
    speak: null,
    announce: () => {}
  });

  // Load accessibility features in a separate effect
  useEffect(() => {
    try {
      const acc = useAccessibility?.() || {};
      setAccessibility({
        highContrast: acc.highContrast || false,
        largeText: acc.largeText || false,
        speak: acc.speak || null,
        announce: acc.announce || (() => {})
      });
    } catch (error) {
      console.error("Error loading accessibility features:", error);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (!token || !userData) {
        navigate("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          navigate("/dashboard");
          return;
        }
        setUser(parsedUser);
        
        // Safe speak with error handling
        if (voiceEnabled && typeof accessibility.speak === 'function') {
          try {
            accessibility.speak(`Welcome to the admin dashboard, ${parsedUser.name}.`);
          } catch (e) {
            console.error("Error with speech synthesis:", e);
          }
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, voiceEnabled, accessibility.speak]);

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await API.post("/auth/logout", { userId: user.id });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    
    // Safe speak on logout
    if (voiceEnabled && typeof accessibility.speak === 'function') {
      try {
        accessibility.speak("You have been logged out successfully. Goodbye!");
      } catch (e) {
        console.error("Error with speech synthesis:", e);
      }
    }
    
    // Safe announce
    if (typeof accessibility.announce === 'function') {
      accessibility.announce("Logged out successfully", "assertive");
    }
    
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Rest of your component remains the same...
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      {/* Your existing JSX */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold" aria-label="PMI Logo">PMI</span>
              </div>
              <h1 className="text-xl font-bold">PMI AudioBook Admin Dashboard</h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (accessibility.announce) {
                    accessibility.announce(
                      voiceEnabled ? "Voice disabled" : "Voice enabled",
                      "polite"
                    );
                  }
                }}
                aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? <Volume2 /> : <VolumeX />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (accessibility.toggleHighContrast) {
                    accessibility.toggleHighContrast();
                  }
                }}
                aria-label="Toggle high contrast"
              >
                <Contrast />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (accessibility.toggleLargeText) {
                    accessibility.toggleLargeText();
                  }
                }}
                aria-label="Toggle large text"
              >
                <Type />
              </Button>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="ml-4"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
            <AdminUpload />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;