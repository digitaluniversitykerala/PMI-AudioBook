import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Search, Play, Pause, Type,
  Music, Clock, Star, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAccessibility, speak } from "@/hooks/useAccessibility";
import PMIHeader from "@/components/PMIHeader";
import API from "@/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [audiobooks, setAudiobooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [playback, setPlayback] = useState({ currentTime: 0, duration: 0 });
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  const searchInputRef = useRef(null);

  const { voiceEnabled, announce } = useAccessibility();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        if (e.key === "Escape") e.target.blur();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (voiceEnabled) speak("Search audiobooks");
      }
      if (e.key === " ") {
        e.preventDefault();
        if (currentlyPlaying) {
          togglePlay();
          announce(isPlaying ? "Paused" : "Playing", "assertive", true);
        } else {
          announce("No audiobook selected. Tab to a book and press Enter to start.", "polite", true);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [currentlyPlaying, voiceEnabled, isPlaying]);

  useEffect(() => {
    announce("Dashboard. Explore our collection of audiobooks.", "polite", true);
  }, [announce]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  // Load user + books
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { navigate("/login"); return; }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      const fetchAudiobooks = async () => {
        try {
          const response = await API.get("/books");
          const books = response.data.books || response.data || [];
          const transformed = books.map((book) => {
            const rawCover = book.coverImage || null;
            const normalizedCover = rawCover ? String(rawCover).replace(/\\/g, "/") : null;
            const coverPath = normalizedCover
              ? normalizedCover.startsWith("http")
                ? normalizedCover
                : normalizedCover.startsWith("/uploads/")
                  ? normalizedCover
                  : `/uploads/${normalizedCover.replace(/^uploads[\\/]/, "")}`
              : null;

            const rawAudio = book.audioFile || (book.chapters?.[0]?.audioFile) || null;
            const normalizedAudio = rawAudio ? String(rawAudio).replace(/\\/g, "/") : null;
            const audioPath = normalizedAudio
              ? normalizedAudio.startsWith("http")
                ? normalizedAudio
                : normalizedAudio.startsWith("/uploads/")
                  ? normalizedAudio
                  : `/uploads/${normalizedAudio.replace(/^uploads[\\/]/, "")}`
              : null;

            return {
              id: book._id,
              title: book.title,
              author: book.authors?.[0]?.name || book.author || "Unknown",
              duration: book.duration
                ? `${Math.floor(book.duration / 60)}h ${book.duration % 60}m`
                : "—",
              category: book.genres?.[0]?.name || "Uncategorized",
              description: book.description || "No description available.",
              audioUrl: audioPath,
              coverImage: coverPath,
              narrator: book.narrator,
              rating: book.rating || 0,
              totalPlays: book.totalPlays || 0,
              chaptersCount: book.chapters?.length || 0,
            };
          });
          setAudiobooks(transformed);
          if (voiceEnabled) speak(`Welcome ${parsedUser.name}. ${transformed.length} audiobooks available.`);
        } catch {
          setAudiobooks([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAudiobooks();
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setPlayback({ currentTime: audio.currentTime || 0, duration: audio.duration || 0 });
    const onMeta = () => setPlayback({ currentTime: 0, duration: audio.duration || 0 });
    const onEnd  = () => { setIsPlaying(false); setPlayback(p => ({ ...p, currentTime: 0 })); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      await API.post("/auth/logout", { userId: u.id });
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    if (voiceEnabled) speak("You have been logged out. Goodbye!");
    setTimeout(() => navigate("/login"), 800);
  };

  const handlePlayAudiobook = (audiobook) => {
    if (!audiobook.audioUrl) return;
    const audio = audioRef.current;
    if (audio) {
      if (currentlyPlaying && currentlyPlaying !== audiobook.id) {
        audio.pause();
        audio.currentTime = 0;
      }
      audio.src = audiobook.audioUrl;
      try {
        const p = audio.play();
        if (p?.catch) p.catch(() => {});
      } catch {}
    }
    setCurrentlyPlaying(audiobook.id);
    setIsPlaying(true);
    if (voiceEnabled) speak(`Now playing ${audiobook.title} by ${audiobook.author}`);
    announce(`Playing ${audiobook.title}`, "assertive");
  };

  const handlePauseAudiobook = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    const audiobook = audiobooks.find((b) => b.id === currentlyPlaying);
    if (voiceEnabled && audiobook) speak(`Paused ${audiobook.title}`);
    announce("Audiobook paused", "assertive");
  };

  const filteredAudiobooks = audiobooks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const playingBook = audiobooks.find((b) => b.id === currentlyPlaying);
  const progress = playback.duration > 0 ? (playback.currentTime / playback.duration) * 100 : 0;

  const formatTime = (s) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50" aria-busy="true">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">Preparing your library…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-inter">
      <a href="#main-content" className="sr-only-focusable">Skip to audiobooks</a>

      {/* Shared header */}
      <PMIHeader user={user} onLogout={handleLogout} />

      {/* Main content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Welcome strip */}
        <div className="mb-10 animate-fade-up">
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Hi, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-slate-500 text-lg">
            Pick up where you left off, or explore something new.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 animate-fade-up animate-delay-100">
          {[
            { icon: BookOpen, label: "Total Books", value: audiobooks.length, color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Music, label: "Now Playing", value: playingBook ? 1 : 0, color: "text-violet-600", bg: "bg-violet-50" },
            { icon: Star, label: "Top Rated", value: audiobooks.filter(b => b.rating >= 4).length, color: "text-amber-600", bg: "bg-amber-50" },
            { icon: TrendingUp, label: "New Titles", value: audiobooks.slice(0, 5).length, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="pmi-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8 animate-fade-up animate-delay-200">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search by title, author, category… (press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              aria-label="Search audiobooks"
            />
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-700">
            {searchQuery ? `Results for "${searchQuery}"` : "All Audiobooks"}
            <span className="ml-2 text-sm font-normal text-slate-400">({filteredAudiobooks.length})</span>
          </h3>
        </div>

        {/* Audiobook grid */}
        {filteredAudiobooks.length > 0 ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-up animate-delay-300"
            role="list"
            aria-label="Audiobook collection"
          >
            {filteredAudiobooks.map((audiobook) => {
              const isThisPlaying = currentlyPlaying === audiobook.id && isPlaying;
              return (
                <div
                  key={audiobook.id}
                  role="listitem"
                  tabIndex={0}
                  className="pmi-card group overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={`${audiobook.title} by ${audiobook.author}. ${audiobook.category}. ${audiobook.duration}`}
                  onClick={() => navigate(`/book/${audiobook.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/book/${audiobook.id}`)}
                  onFocus={() => voiceEnabled && speak(`${audiobook.title} by ${audiobook.author}`)}
                >
                  {/* Cover image */}
                  <div className="aspect-[3/2] relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {audiobook.coverImage ? (
                      <img
                        src={audiobook.coverImage}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                        <BookOpen size={36} className="text-blue-200" />
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Play/Pause button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isThisPlaying ? handlePauseAudiobook() : handlePlayAudiobook(audiobook);
                      }}
                      aria-label={isThisPlaying ? `Pause ${audiobook.title}` : `Play ${audiobook.title}`}
                      className="absolute bottom-3 right-3 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                    >
                      {isThisPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>

                    {/* Playing indicator */}
                    {isThisPlaying && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Playing
                      </div>
                    )}

                    {/* Category badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {audiobook.category}
                    </div>
                  </div>

                  {/* Book info */}
                  <div className="p-4">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors mb-0.5">
                      {audiobook.title}
                    </h4>
                    <p className="text-xs text-slate-500 mb-2">By {audiobook.author}</p>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{audiobook.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Clock size={11} /> {audiobook.duration}</span>
                      {audiobook.rating > 0 && (
                        <span className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" /> {audiobook.rating.toFixed(1)}</span>
                      )}
                      {audiobook.chaptersCount > 0 && (
                        <span className="flex items-center gap-1"><Music size={11} /> {audiobook.chaptersCount} ch</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 animate-fade-in">
            <BookOpen className="h-14 w-14 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-1">No audiobooks found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search terms.</p>
          </div>
        )}

        {/* Keyboard shortcuts help */}
        <div className="mt-12 p-5 bg-white/60 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Type size={13} /> Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
            {[
              ["Tab", "Navigate items"],
              ["Enter", "Open book"],
              ["Space", "Play / Pause"],
              ["/", "Focus search"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-600 min-w-[1.75rem] text-center">{key}</kbd>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Now Playing mini bar ────────────────────────────── */}
      {playingBook && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-4 py-3 animate-fade-up">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Cover */}
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-blue-50">
              {playingBook.coverImage ? (
                <img src={playingBook.coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen size={16} className="text-blue-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{playingBook.title}</p>
              <p className="text-xs text-slate-400 truncate">By {playingBook.author}</p>
              {/* Progress bar */}
              <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-xs text-slate-400 font-mono flex-shrink-0 hidden sm:block">
              {formatTime(playback.currentTime)} / {formatTime(playback.duration)}
            </span>

            {/* Play/Pause */}
            <button
              onClick={isPlaying ? handlePauseAudiobook : () => handlePlayAudiobook(playingBook)}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors shadow-md"
            >
              {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>

            {/* Open full player */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/book/${playingBook.id}`)}
              className="text-xs text-blue-600 font-semibold hidden sm:flex"
            >
              Open →
            </Button>
          </div>
        </div>
      )}

      {/* Global audio element */}
      <audio ref={audioRef} className="hidden" />

      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        <span role="status" />
      </div>
    </div>
  );
};

export default Dashboard;
