import React from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, VolumeX, Contrast, LogOut, Upload, ArrowLeft } from "lucide-react";
import pmiLogo from "@/assets/pmi-logo.png";
import { Button } from "@/components/ui/button";
import { useAccessibility, speak } from "@/hooks/useAccessibility";

/**
 * PMIHeader — Shared premium header for all authenticated pages.
 *
 * Props:
 *   user         – { name, role } from localStorage
 *   onLogout     – async logout handler
 *   showBack     – show an arrow-back button (default false)
 *   backLabel    – ARIA label for back button (default "Go back")
 *   onBack       – override back navigation (default: navigate(-1))
 *   extra        – optional JSX rendered between accessibility controls & user area
 */
const PMIHeader = ({ user, onLogout, showBack = false, backLabel = "Go back", onBack, extra }) => {
  const navigate = useNavigate();
  const { voiceEnabled, highContrast, toggleVoiceEnabled, toggleHighContrast } = useAccessibility();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: logo + optional back */}
          <div className="flex items-center gap-3">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                aria-label={backLabel}
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              aria-label="PMI AudioBook – go to dashboard"
            >
              <img
                src={pmiLogo}
                alt="PMI Logo"
                className="h-9 w-auto drop-shadow-sm group-hover:opacity-90 transition-opacity"
              />
              <span className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">
                AudioBook
              </span>
            </button>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1">
            {/* Extra slot (e.g. admin tab switcher) */}
            {extra && <div className="mr-2">{extra}</div>}

            {/* Voice toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoiceEnabled}
              aria-label={voiceEnabled ? "Disable voice feedback" : "Enable voice feedback"}
              title={voiceEnabled ? "Disable voice" : "Enable voice"}
              className={`rounded-xl transition-colors ${
                voiceEnabled ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              }`}
              onFocus={() => voiceEnabled && speak(voiceEnabled ? "Disable voice feedback" : "Enable voice feedback")}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            {/* Contrast toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleHighContrast}
              aria-label="Toggle high contrast mode"
              title="High contrast"
              className={`rounded-xl transition-colors ${
                highContrast ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Contrast className="h-4 w-4" />
            </Button>

            {/* Admin panel shortcut */}
            {user?.role === "admin" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                aria-label="Admin panel"
                title="Admin panel"
                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* User info + logout */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-800 leading-none">{user?.name}</span>
                <span className="text-[10px] text-slate-400 capitalize leading-tight mt-0.5">{user?.role}</span>
              </div>

              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                aria-label="Logout"
                title="Logout"
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                onFocus={() => voiceEnabled && speak("Logout button")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PMIHeader;
