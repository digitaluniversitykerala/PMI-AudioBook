import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Bookmark, 
  Share2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  FastForward, 
  Rewind, 
  Volume2, 
  VolumeX, 
  List, 
  BookOpen, 
  User as UserIcon, 
  Clock, 
  ChevronDown 
} from "lucide-react";
import styles from "./SingleAudioBook.module.css";
import API from "@/api";
import PMIHeader from "@/components/PMIHeader";
import { useAccessibility, speak } from "@/hooks/useAccessibility";

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getAudioUrl = (filePath) => {
  if (!filePath) return "";
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.startsWith('http')) return normalizedPath;
  if (normalizedPath.startsWith('/uploads/')) return normalizedPath;
  if (normalizedPath.includes("audio/") || normalizedPath.includes("covers/")) {
    return normalizedPath.startsWith("/") ? normalizedPath : `/uploads/${normalizedPath}`;
  }
  return `/uploads/audio/${normalizedPath}`;
};

const SingleAudioBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  
  const [book, setBook] = useState(null);
  const [user, setUser] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const {
    highContrast,
    voiceEnabled,
    toggleHighContrast,
    toggleVoiceEnabled,
    announce
  } = useAccessibility();

  // Load user from localStorage for header
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    } catch {}
  }, []);

  useEffect(() => {
    fetchBookDetails();
    announce("Player loaded. Use Space to play, Arrows to skip and adjust volume.", "polite", true);
  }, [id]);

  // Initialize audio src whenever book or chapter changes
  useEffect(() => {
    if (!book || !audioRef.current) return;

    const chapter = book.chapters && book.chapters.length > 0
      ? book.chapters[currentChapterIndex]
      : { title: "Full Audio", audioFile: book.audioFile };

    const src = getAudioUrl(chapter?.audioFile);
    if (src && audioRef.current.src !== src) {
      audioRef.current.src = src;
      audioRef.current.load();
      setAudioInitialized(true);
    }
  }, [book, currentChapterIndex]);

  useEffect(() => {
    const handleKeys = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.05);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.05);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'c':
          e.preventDefault();
          setShowChapters(prev => {
            announce(prev ? "Chapters closed" : "Chapters opened", "polite", true);
            return !prev;
          });
          break;
        case 'escape':
          setShowChapters(false);
          break;
        case 't':
          e.preventDefault();
          if (book) {
            const time = formatTime(audioRef.current?.currentTime || 0);
            const total = formatTime(audioRef.current?.duration || 0);
            const chapterName = book.chapters && book.chapters[currentChapterIndex]
              ? book.chapters[currentChapterIndex].title
              : "Main content";
            announce(`Current time ${time} of ${total}. Playing chapter ${currentChapterIndex + 1}: ${chapterName}`, "assertive", true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [isPlaying, volume, isMuted, showChapters, voiceEnabled, book, currentChapterIndex]);

  const adjustVolume = (delta) => {
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    if (isMuted) setIsMuted(false);
    announce(`Volume ${Math.round(newVol * 100)} percent`, "assertive", true);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    announce(isMuted ? "Unmuted" : "Muted", "polite", true);
  };

  const fetchBookDetails = async () => {
    try {
      const { data } = await API.get(`/books/${id}`);
      setBook(data);
      
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const progressRes = await API.get(`/users/progress/${id}`);
          if (progressRes.data) {
            setCurrentChapterIndex(progressRes.data.currentChapter || 0);
          }
        } catch (err) {
          if (err.response?.status !== 401) {
            console.log("No progress found or error fetching progress");
          }
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching book:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Save progress every 30 seconds
      const seconds = Math.floor(time);
      if (seconds > 0 && seconds % 30 === 0 && Math.floor(currentTime) !== seconds) {
        saveProgress();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (book.chapters && currentChapterIndex < book.chapters.length - 1) {
      playChapter(currentChapterIndex + 1);
    } else {
      setIsPlaying(false);
      saveProgress(true);
      announce("Audiobook finished.", "polite", true);
    }
  };

  const saveProgress = async (isCompleted = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await API.put(`/users/progress/${id}`, {
        currentChapter: currentChapterIndex,
        currentPosition: audioRef.current ? audioRef.current.currentTime : 0,
        isCompleted
      });
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  const playChapter = (index) => {
    if (!book) return;
    setCurrentChapterIndex(index);
    setIsPlaying(true);
    setShowChapters(false);
    const chapter = book.chapters && book.chapters.length > 0
      ? book.chapters[index]
      : { title: "Full Audio", audioFile: book.audioFile };
    announce(`Playing ${chapter ? chapter.title : "Book"}`, "assertive", true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = getAudioUrl(chapter.audioFile);
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error("Play failed:", err));
      }
    }, 50);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    // If no src yet, initialize it
    if (!audioRef.current.src || audioRef.current.src === window.location.href) {
      if (book) {
        playChapter(currentChapterIndex);
        return;
      }
    }

    if (isPlaying) {
      audioRef.current.pause();
      announce("Paused", "polite", true);
    } else {
      audioRef.current.play().catch(err => {
        console.error("Play failed:", err);
        // Src may be stale, reinitialize
        if (book) playChapter(currentChapterIndex);
      });
      announce("Playing", "polite", true);
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (amount) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + amount);
      announce(`${amount > 0 ? "Forward" : "Backward"} ${Math.abs(amount)} seconds`, "polite", true);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    announce(`Playback speed ${nextSpeed} times`, "assertive", true);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

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

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] font-inter flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!book) return (
    <div className="min-h-screen bg-[#f8fafc] font-inter flex items-center justify-center">
      <div className="text-center">
        <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Book not found</p>
        <button onClick={() => navigate("/dashboard")} className="mt-4 text-blue-600 text-sm hover:underline">
          ← Back to library
        </button>
      </div>
    </div>
  );

  const currentChapter = book.chapters && book.chapters.length > 0 
    ? book.chapters[currentChapterIndex] 
    : { title: "Full Audio", audioFile: book.audioFile };

  return (
    <div className={`${styles.pageWrapper} font-inter`}>
      <a href="#player-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg">
        Skip to player controls
      </a>

      {/* Shared PMI Header */}
      <PMIHeader
        user={user}
        onLogout={handleLogout}
        showBack
        backLabel="Back to library"
        onBack={() => navigate("/dashboard")}
      />

      <main className={styles.mainContent} id="player-content">
        <div className={styles.coverContainer}>
          {book.coverImage ? (
            <img 
              src={book.coverImage.startsWith('http') 
                ? book.coverImage 
                : `/${book.coverImage.startsWith('uploads/') ? '' : 'uploads/'}${book.coverImage}`} 
              alt={book.title} 
              className={styles.coverImage} 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl">
              <BookOpen size={64} className="text-blue-200" />
            </div>
          )}
        </div>

        <h1 className={styles.title}>{book.title}</h1>
        <div className={styles.author}>
          <UserIcon size={18} />
          <span>{book.authors?.map(a => a.name).join(", ") || "Unknown Author"}</span>
        </div>

        <div className={styles.badges}>
          <div className={`${styles.badge} ${styles.genreBadge}`}>
            <BookOpen size={16} />
            <span>{book.genres?.[0]?.name || "Self-Help"}</span>
          </div>
          <div className={`${styles.badge} ${styles.durationBadge}`}>
            <Clock size={16} />
            <span>
              {book.duration 
                ? `${Math.floor(book.duration / 60)}h ${book.duration % 60}m` 
                : book.chapters?.length ? `${book.chapters.length} chapters` : "—"}
            </span>
          </div>
        </div>

        <div className={styles.playerCard}>
          <div className={styles.progressSection}>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => {
                const time = parseFloat(e.target.value);
                setCurrentTime(time);
                if (audioRef.current) audioRef.current.currentTime = time;
              }}
              className={styles.progressBar}
              aria-label="Playback progress"
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            />
            <div className={styles.timeInfo} aria-hidden="true">
              <span>{formatTime(currentTime)}</span>
              <span className={styles.currentChapter}>
                {book.chapters?.length ? `Chapter ${currentChapterIndex + 1} of ${book.chapters.length}` : "Full Audio"}
              </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className={styles.controls}>
            <button 
              className={styles.secondaryControl} 
              onClick={() => skip(-10)} 
              aria-label="Rewind 10 seconds" 
              title="Rewind"
              onFocus={() => voiceEnabled && speak("Rewind 10 seconds")}
            >
              <Rewind size={24} />
            </button>
            <button 
              className={styles.secondaryControl} 
              disabled={!book.chapters || book.chapters.length <= 1 || currentChapterIndex === 0}
              onClick={() => playChapter(currentChapterIndex - 1)}
              aria-label="Previous chapter"
              title="Previous"
              onFocus={() => voiceEnabled && speak("Previous chapter")}
            >
              <SkipBack size={28} />
            </button>
            <button 
              className={styles.playBtn} 
              onClick={togglePlay} 
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
              onFocus={() => voiceEnabled && speak(isPlaying ? "Pause" : "Play")}
            >
              {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" style={{ marginLeft: '4px' }} />}
            </button>
            <button 
              className={styles.secondaryControl} 
              disabled={!book.chapters || book.chapters.length <= 1 || currentChapterIndex === book.chapters.length - 1}
              onClick={() => playChapter(currentChapterIndex + 1)}
              aria-label="Next chapter"
              title="Next"
              onFocus={() => voiceEnabled && speak("Next chapter")}
            >
              <SkipForward size={28} />
            </button>
            <button 
              className={styles.secondaryControl} 
              onClick={() => skip(10)} 
              aria-label="Fast forward 10 seconds" 
              title="Forward"
              onFocus={() => voiceEnabled && speak("Fast forward 10 seconds")}
            >
              <FastForward size={24} />
            </button>
          </div>

          <div className={styles.playerFooter}>
            <div className={styles.footerActions}>
              <button 
                className={styles.speedBtn} 
                onClick={handleSpeedChange}
                aria-label={`Playback speed: ${playbackSpeed}x. Click to change.`}
                onFocus={() => voiceEnabled && speak(`Playback speed, currently ${playbackSpeed} times`)}
              >
                {playbackSpeed}x
              </button>
              <div className={styles.volumeControl}>
                <button 
                  className={styles.iconBtn} 
                  onClick={toggleMute}
                  aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                  onFocus={() => voiceEnabled && speak(isMuted || volume === 0 ? "Unmute" : "Mute")}
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className={styles.volumeSlider}
                  aria-label="Volume"
                  aria-valuetext={`${Math.round(volume * 100)} percent`}
                  onFocus={() => voiceEnabled && speak(`Volume slider, current ${Math.round(volume * 100)} percent`)}
                />
              </div>
            </div>
            
            {/* Share + Bookmark quick actions */}
            <div className="flex items-center gap-2">
              <button 
                className={styles.iconBtn} 
                aria-label="Bookmark this book" 
                title="Bookmark"
                onFocus={() => voiceEnabled && speak("Bookmark this book")}
              ><Bookmark size={18} /></button>
              <button 
                className={styles.iconBtn} 
                aria-label="Share this book" 
                title="Share"
                onFocus={() => voiceEnabled && speak("Share this book")}
              ><Share2 size={18} /></button>

              {/* Chapter selector */}
              {book.chapters && book.chapters.length > 1 && (
                <div style={{ position: 'relative' }}>
                  <button 
                    className={styles.chaptersDropdown} 
                    onClick={() => setShowChapters(!showChapters)}
                    aria-expanded={showChapters}
                    aria-haspopup="listbox"
                    aria-label="Select chapter"
                    onFocus={() => voiceEnabled && speak("Select chapter dropdown")}
                  >
                    <List size={18} />
                    <span>Chapters</span>
                    <ChevronDown size={14} />
                  </button>
                  
                  {showChapters && (
                    <div className={styles.popover} role="listbox" aria-label="Chapters">
                      {book.chapters.map((ch, idx) => (
                        <button 
                          key={idx} 
                          role="option"
                          aria-selected={idx === currentChapterIndex}
                          className={`${styles.chapterItem} ${idx === currentChapterIndex ? styles.activeChapterItem : ''}`}
                          onClick={() => playChapter(idx)}
                          onFocus={() => voiceEnabled && speak(`Chapter ${idx + 1}: ${ch.title}`)}
                        >
                          <span>{idx + 1}. {ch.title}</span>
                          <span className="text-gray-400">{ch.duration ? `${ch.duration}m` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.aboutCard}>
          <div className={styles.aboutHeader}>
            <BookOpen size={20} />
            <span>About This Book</span>
          </div>
          <p className={styles.description}>
            {book.description || "No description available for this book."}
          </p>
        </div>
      </main>

      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default SingleAudioBook;
