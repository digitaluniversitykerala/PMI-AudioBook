import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Upload, BookOpen } from "lucide-react";
import { useAccessibility, speak } from "@/hooks/useAccessibility";
import PMIHeader from "@/components/PMIHeader";
import AdminUpload from "@/components/AdminUpload";
import AdminBookList from "@/components/AdminBookList";
import API from "@/api";

const TABS = [
  { id: 'list',   label: 'All Audiobooks', icon: BookOpen },
  { id: 'upload', label: 'Add New',        icon: Upload   },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [editingBook, setEditingBook] = useState(null);

  const { voiceEnabled, announce } = useAccessibility();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { navigate("/login"); return; }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') { navigate("/dashboard"); return; }
      setUser(parsedUser);
      if (voiceEnabled) speak(`Admin Portal active. Welcome, ${parsedUser.name}.`);
      announce("Admin portal loaded.", "polite");
    } catch {
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      await API.post("/auth/logout", { userId: u.id });
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    if (voiceEnabled) speak("Logged out successfully.");
    navigate("/login");
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setActiveTab('edit');
  };

  const handleComplete = () => {
    setActiveTab('list');
    setEditingBook(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const currentTab = activeTab === 'edit' ? 'edit' : activeTab;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-inter">

      {/* Shared PMI header */}
      <PMIHeader
        user={user}
        onLogout={handleLogout}
        showBack
        backLabel="Back to library"
        onBack={() => navigate("/dashboard")}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Library Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage audiobooks, chapters, and metadata for the PMI library.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); if (id !== 'edit') setEditingBook(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  currentTab === id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
                aria-pressed={currentTab === id}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
            {currentTab === 'edit' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white shadow-md">
                <LayoutDashboard size={15} />
                Editing
              </div>
            )}
          </div>
        </div>

        {/* Panel */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] animate-fade-up animate-delay-100">
          {activeTab === 'list' && (
            <AdminBookList onEdit={handleEditBook} />
          )}
          {(activeTab === 'upload' || activeTab === 'edit') && (
            <div className="p-2">
              <AdminUpload
                existingBook={editingBook}
                onComplete={handleComplete}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
