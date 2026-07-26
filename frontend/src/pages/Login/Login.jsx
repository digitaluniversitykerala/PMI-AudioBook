import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, LogIn, Headphones, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";
import pmiLogo from "@/assets/pmi-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccessibility, speak } from "@/hooks/useAccessibility";
import API from "@/api";
import { getErrorMessage } from "@/lib/utils";

const PERKS = [
  { icon: Headphones, text: "Studio-quality audio narrations" },
  { icon: BookOpen,   text: "Hundreds of curated audiobooks" },
  { icon: ShieldCheck,text: "Full accessibility features built-in" },
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { voiceEnabled, announce } = useAccessibility();

  useEffect(() => {
    if (voiceEnabled) speak("Welcome to PMI AudioBook. Sign in to continue.");
    announce("Login page loaded.", "polite");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (voiceEnabled) speak("Signing you in. Please wait.");

    try {
      const response = await API.post("/auth/login", { email, password });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (response.data.refreshToken) localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        const isAdmin = response.data.user?.role === 'admin';
        const dest = isAdmin ? '/admin' : '/dashboard';
        if (voiceEnabled) {
          speak(`Welcome back ${response.data.user.name}. Redirecting to ${isAdmin ? 'admin portal' : 'dashboard'}.`);
        }
        announce(`Login successful. Redirecting to ${dest}.`, "assertive");
        
        setTimeout(() => navigate(dest, { replace: true }), 500);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, "Login failed. Please try again.");
      setError(errorMsg);
      if (voiceEnabled) {
        speak(errorMsg);
      }
      announce(errorMsg, "assertive");
        if (voiceEnabled) speak(`Welcome back ${response.data.user.name}. Redirecting to dashboard.`);
        announce("Login successful. Redirecting.", "assertive");
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed. Please try again.";
      setError(msg);
      if (voiceEnabled) speak(msg);
      announce(msg, "assertive");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError("");
        if (voiceEnabled) speak("Processing Google sign in.");

        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());

        if (!userInfo || userInfo.error) throw new Error("Failed to fetch user info from Google");

        const response = await API.post("/auth/google", {
          token: tokenResponse.id_token || tokenResponse.access_token,
        });

        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          if (response.data.refreshToken) {
            localStorage.setItem("refreshToken", response.data.refreshToken);
          }
          if (response.data.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }
          
          const isAdmin = response.data.user?.role === 'admin';
          const dest = isAdmin ? '/admin' : '/dashboard';
          
          if (voiceEnabled) {
            const name = response.data.user?.name || 'User';
            speak(`Welcome ${name}. Redirecting to ${isAdmin ? 'admin portal' : 'dashboard'}.`);
          }
          
          announce(`Google login successful. Redirecting to ${dest}.`, "assertive");
          
          setTimeout(() => {
            navigate(dest, { replace: true });
          }, 500);
          if (response.data.refreshToken) localStorage.setItem("refreshToken", response.data.refreshToken);
          if (response.data.user) localStorage.setItem("user", JSON.stringify(response.data.user));
          if (voiceEnabled) speak(`Welcome ${response.data.user?.name || ""}. Redirecting.`);
          announce("Google login successful. Redirecting.", "assertive");
          setTimeout(() => navigate("/dashboard", { replace: true }), 500);
        } else {
          throw new Error("No token received from server");
        }
      } catch (err) {
        const errorMsg = getErrorMessage(err, "Google login failed. Please try again.");
        setError(errorMsg);
        
        if (voiceEnabled) {
          speak(errorMsg);
        }
        announce(errorMsg, "assertive");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      const errorMsg = getErrorMessage(error, "Google login was cancelled or failed. Please try again.");
      setError(errorMsg);
      
      if (voiceEnabled) {
        speak(errorMsg);
      }
    }
  });

  return (
    <div className="min-h-screen flex font-inter">

      {/* ── Left panel (branding) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex-col justify-between p-12">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[60px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={pmiLogo} alt="PMI Logo" className="h-11 w-auto brightness-0 invert" />
          <span className="text-white text-2xl font-black tracking-tight">AudioBook</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Your world of stories<br />
            <span className="text-blue-400">starts here.</span>
          </h2>
          <p className="text-blue-100/70 text-base leading-relaxed mb-10 max-w-sm">
            Sign in to access your personalised library of premium audiobooks, crafted for every listener.
          </p>

          <div className="space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-blue-300" />
                </div>
                <span className="text-blue-100/80 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-blue-200/40 text-xs">
          &copy; {new Date().getFullYear()} PMI AudioBook
        </p>
      </div>

      {/* ── Right panel (form) ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6 py-12">
        <a href="#login-form" className="sr-only-focusable">Skip to login form</a>

        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src={pmiLogo} alt="PMI Logo" className="h-9 w-auto" />
            <span className="text-xl font-black text-slate-800">AudioBook</span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 mb-8">Sign in to continue your listening journey</p>

          {/* Error */}
          {error && (
            <div role="alert" aria-live="assertive"
              className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-required="true"
                className="enhanced-focus h-11 rounded-xl border-slate-200 bg-white"
                onFocus={() => voiceEnabled && speak("Email address field")}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:underline font-medium"
                  onFocus={() => voiceEnabled && speak("Forgot password link")}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="enhanced-focus h-11 rounded-xl border-slate-200 bg-white pr-11"
                  onFocus={() => voiceEnabled && speak("Password field")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full h-12 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all duration-200"
            >
              {loading ? (
                <span className="animate-pulse">Signing in…</span>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 px-3 text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => googleLogin()}
              disabled={loading}
              className="w-full h-12 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-white hover:border-blue-300 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
              Sign up free <ArrowRight size={13} className="inline" />
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Tab</kbd> navigate ·{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Enter</kbd> select
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;