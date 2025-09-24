import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, LogOut, Volume2, VolumeX, Contrast, Type, Search, Play, Pause, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAccessibility, speak } from "@/hooks/useAccessibility";
import API from "@/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [audiobooks, setAudiobooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const {
    highContrast,
    largeText,
    toggleHighContrast,
    toggleLargeText,
    announce
  } = useAccessibility();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Simulate loading audiobooks
      setTimeout(() => {
        setLoading(false);
        
        // Mock audiobooks data
        const books = [
          {
            id: 1,
            title: "Project Management Body of Knowledge (PMBOK)",
            author: "PMI",
            duration: "12 hours",
            category: "Project Management",
            description: "The standard for project management and a guide to the project management body of knowledge."
          },
          {
            id: 2,
            title: "Agile Practice Guide",
            author: "PMI",
            duration: "8 hours",
            category: "Agile",
            description: "A comprehensive guide to understanding and implementing agile practices."
          },
          {
            id: 3,
            title: "Risk Management Professional",
            author: "PMI",
            duration: "10 hours",
            category: "Risk Management",
            description: "Essential guide for risk management in projects."
          }
        ];
        setAudiobooks(books);
        
        // Announce dashboard loaded
        if (voiceEnabled) {
          speak(`Welcome to your dashboard ${parsedUser.name}. You have access to ${books.length} audiobooks.`);
        }
      }, 500);
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (!loading && user && voiceEnabled) {
      announce("Dashboard loaded successfully", "polite");
    }
  }, [loading, user, voiceEnabled, announce]);

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
      speak("You have been logged out successfully. Goodbye!");
    }
    announce("Logged out successfully", "assertive");
    
    setTimeout(() => navigate("/login"), 1000);
  };

  const handlePlayAudiobook = (audiobook) => {
    setCurrentlyPlaying(audiobook.id);
    if (voiceEnabled) {
      speak(`Now playing ${audiobook.title} by ${audiobook.author}`);
    }
    announce(`Playing ${audiobook.title}`, "assertive");
  };

  const handlePauseAudiobook = () => {
    const audiobook = audiobooks.find(book => book.id === currentlyPlaying);
    if (voiceEnabled && audiobook) {
      speak(`Paused ${audiobook.title}`);
    }
    setCurrentlyPlaying(null);
    announce("Audiobook paused", "assertive");
  };

  const filteredAudiobooks = audiobooks.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold">Loading your audiobooks...</div>
          <span className="sr-only">Loading dashboard content</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      {/* Skip to main content */}
      <a href="#main-content" className="sr-only-focusable">
        Skip to audiobooks
      </a>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold" aria-label="PMI Logo">PMI</span>
              </div>
              <h1 className="text-xl font-bold">PMI AudioBook Dashboard</h1>
            </div>

            {/* User actions */}
            <div className="flex items-center space-x-2">
              {/* Accessibility controls */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleHighContrast}
                aria-label="Toggle high contrast"
              >
                <Contrast className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLargeText}
                aria-label="Toggle large text"
              >
                <Type className="h-4 w-4" />
              </Button>

              {/* User menu */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l">
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">{user?.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  aria-label="Logout"
                  onFocus={() => voiceEnabled && speak("Logout button")}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Explore our collection of accessible audiobooks designed for everyone.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search audiobooks by title, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 enhanced-focus"
              aria-label="Search audiobooks"
              onFocus={() => voiceEnabled && speak("Search audiobooks. Type to filter the collection.")}
            />
          </div>
        </div>

        {/* Audiobooks grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAudiobooks.map((audiobook) => (
            <Card 
              key={audiobook.id} 
              className="hover:shadow-lg transition-shadow duration-200"
              role="article"
              aria-label={`Audiobook: ${audiobook.title}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <BookOpen className="h-8 w-8 text-indigo-600" aria-hidden="true" />
                  {currentlyPlaying === audiobook.id ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handlePauseAudiobook}
                      aria-label={`Pause ${audiobook.title}`}
                      onFocus={() => voiceEnabled && speak(`Pause ${audiobook.title}`)}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handlePlayAudiobook(audiobook)}
                      aria-label={`Play ${audiobook.title}`}
                      onFocus={() => voiceEnabled && speak(`Play ${audiobook.title} by ${audiobook.author}`)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                  )}
                </div>
                <CardTitle className="mt-4">{audiobook.title}</CardTitle>
                <CardDescription>
                  <span className="block">By {audiobook.author}</span>
                  <span className="block text-sm mt-1">
                    {audiobook.category} • {audiobook.duration}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {audiobook.description}
                </p>
                {currentlyPlaying === audiobook.id && (
                  <div className="mt-4 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      Now Playing...
                    </span>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 animate-pulse" style={{ width: "30%" }}></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAudiobooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No audiobooks found matching your search.
            </p>
          </div>
        )}

        {/* Keyboard shortcuts help */}
        <div className="mt-12 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Tab</kbd> Navigate between elements</div>
            <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Enter</kbd> Activate buttons</div>
            <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Space</kbd> Play/Pause audiobook</div>
            <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded">/</kbd> Focus search bar</div>
          </div>
        </div>
      </main>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        <span role="status"></span>
      </div>
    </div>
  );
};

export default Dashboard;
