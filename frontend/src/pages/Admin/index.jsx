import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Volume2, 
  VolumeX, 
  Contrast, 
  Type, 
  ArrowLeft,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility, speak } from "@/hooks/useAccessibility";
import AdminUpload from "@/components/AdminUpload";
import AdminBookList from "@/components/AdminBookList";
import API from "@/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'upload' or 'edit'
  const [editingBook, setEditingBook] = useState(null);
  
  const {
    toggleHighContrast,
    toggleLargeText,
    announce
  } = useAccessibility();

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
        
        if (voiceEnabled) {
          speak(`Admin Portal active. Welcome, ${parsedUser.name}.`);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await API.post("/auth/logout", { userId: user.id });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    
    if (voiceEnabled) {
      speak("Logged out successfully.");
    }
    announce("Logged out successfully", "assertive");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/dashboard")}
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
                <span className="text-white text-sm font-bold">PMI</span>
              </div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">Admin Portal</h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="text-slate-500 hover:text-blue-600"
              >
                {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleHighContrast}
                className="text-slate-500 hover:text-blue-600"
              >
                <Contrast size={18} />
              </Button>

              <div className="h-6 w-px bg-slate-200 mx-2" />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-500 p-2"
                title="Logout"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Library Management</h2>
            <p className="text-slate-500">Manage your audiobooks, chapters, and metadata</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              All Audiobooks
            </button>
            <button 
              onClick={() => { setActiveTab('upload'); setEditingBook(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Add New
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          {activeTab === 'list' && (
            <AdminBookList 
              onEdit={(book) => {
                setEditingBook(book);
                setActiveTab('edit');
              }} 
            />
          )}

          {(activeTab === 'upload' || activeTab === 'edit') && (
            <div className="p-1">
               <AdminUpload 
                 existingBook={editingBook} 
                 onComplete={() => {
                   setActiveTab('list');
                   setEditingBook(null);
                 }} 
               />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
