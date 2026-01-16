import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, LogOut, Volume2, VolumeX, Contrast, Type, Search, Play, Pause, User, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAccessibility, speak } from "@/hooks/useAccessibility";
import API, { BASE_URL } from "@/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [audiobooks, setAudiobooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const searchInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  const {
    highContrast,
    voiceEnabled,
    toggleHighContrast,
    toggleVoiceEnabled,
    announce
  } = useAccessibility();

  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (voiceEnabled) speak("Search audiobooks");
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (currentlyPlaying) {
          togglePlay();
          announce(isPlaying ? "Paused" : "Playing", "assertive", true);
        } else {
          announce("No audiobook selected. Tab to a book and press Enter to start.", "polite", true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [currentlyPlaying, voiceEnabled, isPlaying]);

  useEffect(() => {
    announce("Dashboard. Explore our collection of audiobooks.", "polite", true);
  }, [announce]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

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
      
      // Removed automatic admin redirect - everyone goes to main dashboard first
      
      // Fetch audiobooks from backend
      const fetchAudiobooks = async () => {
        try {
          const response = await API.get('/books');
          const books = response.data.books || response.data || [];
          
          // Transform data if needed to match frontend structure
          const transformedBooks = books.map(book => {
            // Normalize audio/cover paths from DB (handle old Windows-style backslashes)
            const rawAudio = book.audioFile || null;
            const rawCover = book.coverImage || null;
            const normalizedAudio = rawAudio ? String(rawAudio).replace(/\\/g, '/') : null;
            const normalizedCover = rawCover ? String(rawCover).replace(/\\/g, '/') : null;

            const audioPath = normalizedAudio
              ? (normalizedAudio.startsWith('/uploads/')
                  ? normalizedAudio
                  : `/uploads/${normalizedAudio.replace(/^uploads[\/]/, '')}`)
              : null;

            const coverPath = normalizedCover
              ? (normalizedCover.startsWith('/uploads/')
                  ? normalizedCover
                  : `/uploads/${normalizedCover.replace(/^uploads[\/]/, '')}`)
              : '/placeholder-book.jpg';

            return {
              id: book._id,
              title: book.title,
              titleEn: book.titleEn || book.title,
              author: book.authors?.[0]?.name || book.author || 'Unknown',
              authorEn: book.authors?.[0]?.name || book.author || 'Unknown',
              duration: book.duration ? `${Math.floor(book.duration / 60)} hours ${book.duration % 60} minutes` : 'Unknown',
              category: book.genres?.[0]?.name || book.category || 'Uncategorized',
              description: book.description || 'No description available',
              audioUrl: audioPath,
              coverImage: coverPath,
              narrator: book.narrator,
              rating: book.rating || 0,
              totalPlays: book.totalPlays || 0,
            };
          });
          
          setAudiobooks(transformedBooks);
          
          // Announce dashboard loaded
          if (voiceEnabled) {
            speak(`Welcome to your dashboard ${parsedUser.name}. You have access to ${transformedBooks.length} audiobooks.`);
          }
        } catch (error) {
          console.error('Error fetching audiobooks:', error);
          // Fallback to empty array if API fails
          setAudiobooks([]);
          if (voiceEnabled) {
            speak(`Welcome to your dashboard ${parsedUser.name}. No audiobooks available at the moment.`);
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchAudiobooks();
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

  // Attach audio events for progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setPlayback({ currentTime: audio.currentTime || 0, duration: audio.duration || 0 });
    };

    const onLoadedMetadata = () => {
      setPlayback({ currentTime: 0, duration: audio.duration || 0 });
    };

    const onEnded = () => {
      setPlayback({ currentTime: 0, duration: audio.duration || 0 });
      setCurrentlyPlaying(null);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

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
    if (!audiobook.audioUrl) {
      console.warn("No audio URL for audiobook", audiobook);
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      // If another book is playing, stop it and reset progress
      if (currentlyPlaying && currentlyPlaying !== audiobook.id) {
        audio.pause();
        audio.currentTime = 0;
        setPlayback(prev => ({ ...prev, currentTime: 0 }));
      }

      // Use the backend URL that serves /uploads statically
      audio.src = `http://localhost:5000${audiobook.audioUrl}`;

      // Some browsers may reject the play() promise even when audio plays fine.
      // We intentionally ignore those non-fatal errors to avoid noisy console output.
      try {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } catch {
        // Swallow play errors; user can retry.
      }
    }

    setCurrentlyPlaying(audiobook.id);
    if (voiceEnabled) {
      speak(`Now playing ${audiobook.title} by ${audiobook.author}`);
    }
    announce(`Playing ${audiobook.title}`, "assertive");
  };

  const handlePauseAudiobook = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50" aria-busy="true">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-slate-600 font-medium">Preparing your library...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Skip to main content */}
      <a href="#main-content" className="sr-only-focusable">
        Skip to audiobooks
      </a>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                <span className="text-white font-bold text-lg">PMI</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight hidden sm:block">AudioBook</h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoiceEnabled}
                className={`transition-colors ${voiceEnabled ? "text-blue-600 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                aria-label={voiceEnabled ? "Disable voice feedback" : "Enable voice feedback"}
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
                onFocus={() => voiceEnabled && speak(voiceEnabled ? "Disable voice feedback" : "Enable voice feedback")}
              >
                {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleHighContrast}
                className={`transition-colors ${highContrast ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-blue-600"}`}
                aria-label="Toggle high contrast"
                onFocus={() => voiceEnabled && speak("Toggle high contrast")}
              >
                <Contrast className="h-5 w-5" />
              </Button>

              {user?.role === 'admin' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/admindashboard')}
                  className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  title="Admin Upload"
                  onFocus={() => voiceEnabled && speak("Admin upload dashboard")}
                >
                  <Upload className="h-5 w-5" />
                </Button>
              )}
              
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
              
              <div className="flex items-center gap-2 ml-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-900 leading-none">{user?.name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{user?.role}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-slate-600 hover:text-red-500 hover:bg-red-50 p-2"
                  onClick={handleLogout}
                  title="Logout"
                  onFocus={() => voiceEnabled && speak("Logout")}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome section */}
        <div className="mb-10">
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
            Hi, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl">
            Pick up where you left off or explore something new in our collection.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search by title or author... (Press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-blue-600 transition-all text-lg"
              aria-label="Search audiobooks"
            />
          </div>
        </div>

        {/* Audiobooks grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          role="list" 
          aria-label="Audiobook collection"
        >
          {filteredAudiobooks.map((audiobook) => (
            <Card 
              key={audiobook.id} 
              tabIndex={0}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer border-slate-200 group overflow-hidden focus:ring-2 focus:ring-blue-600 focus:outline-none"
              role="listitem"
              aria-label={`Audiobook: ${audiobook.title} by ${audiobook.author}. Category: ${audiobook.category}. Duration: ${audiobook.duration}. Click or press Enter to listen.`}
              onClick={() => navigate(`/book/${audiobook.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/book/${audiobook.id}`)}
              onFocus={() => voiceEnabled && speak(`${audiobook.title} by ${audiobook.author}`)}
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                {audiobook.coverImage ? (
                  <img 
                    src={audiobook.coverImage} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <BookOpen size={48} className="text-blue-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{audiobook.title}</CardTitle>
                <CardDescription>
                  <span className="block">By {audiobook.author}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {audiobook.description}
                </p>
                <div className="flex items-center text-xs font-semibold text-slate-400 gap-3">
                  <span className="bg-slate-50 px-2 py-1 rounded text-blue-600">{audiobook.category}</span>
                  <span>{audiobook.duration}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAudiobooks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">No books found</h3>
            <p className="text-slate-500">Try adjusting your search terms.</p>
          </div>
        )}

        {/* Keyboard shortcuts help */}
        <div className="mt-16 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Type className="h-5 w-5 text-blue-600" />
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded-xl shadow-sm"><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">Tab</kbd> Navigate items</div>
            <div className="bg-white p-3 rounded-xl shadow-sm"><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">Enter</kbd> Open selected book</div>
            <div className="bg-white p-3 rounded-xl shadow-sm"><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">Space</kbd> Play/Pause last book</div>
            <div className="bg-white p-3 rounded-xl shadow-sm"><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">/</kbd> Focus search</div>
          </div>
        </div>
      </main>

      {/* Hidden global audio player */}
      <audio ref={audioRef} className="hidden" />

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        <span role="status"></span>
      </div>
    </div>
  );
};

export default Dashboard;
