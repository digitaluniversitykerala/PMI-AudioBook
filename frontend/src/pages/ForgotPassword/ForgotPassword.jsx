import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Headphones, ArrowLeft, Mail, BookOpen } from "lucide-react";
import pmiLogo from "@/assets/pmi-logo.png";
import { Button } from "@/components/ui/button";
import { useAccessibility, speak } from "@/hooks/useAccessibility";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { voiceEnabled, announce } = useAccessibility();

  React.useEffect(() => {
    if (voiceEnabled) speak("Forgot password page. Instructions are provided below.");
    announce("Forgot password page loaded.", "polite");
  }, []);

  return (
    <div className="min-h-screen flex font-inter">

      {/* ── Left branding panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex-col justify-between p-12">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[60px]" />

        <div className="relative z-10 flex items-center gap-3">
          <img src={pmiLogo} alt="PMI Logo" className="h-11 w-auto brightness-0 invert" />
          <span className="text-white text-2xl font-black tracking-tight">AudioBook</span>
        </div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Mail size={28} className="text-blue-300" />
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Let's get you<br />
            <span className="text-blue-400">back in.</span>
          </h2>
          <p className="text-blue-100/70 text-base leading-relaxed max-w-sm">
            Password resets are managed by your PMI administrator. Reach out to them directly to regain access to your account.
          </p>
        </div>

        <p className="relative z-10 text-blue-200/40 text-xs">
          &copy; {new Date().getFullYear()} PMI AudioBook
        </p>
      </div>

      {/* ── Right panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6 py-12">

        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src={pmiLogo} alt="PMI Logo" className="h-9 w-auto" />
            <span className="text-xl font-black text-slate-800">AudioBook</span>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors"
          >
            <ArrowLeft size={14} /> Back to sign in
          </button>

          {/* Icon */}
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <Mail size={24} className="text-blue-600" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-2">Forgot password?</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Password resets for PMI AudioBook accounts are handled by your administrator.
            Please contact your PMI administrator with your registered email address to reset your password.
          </p>

          {/* Contact info card */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Headphones size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-1">Contact PMI Support</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Reach out to your library administrator or PMI Kerala chapter office to request a password reset.
                  They will verify your identity and reset your credentials.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-12 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all duration-200"
            >
              Return to Sign In
            </Button>

            <Link to="/signup">
              <Button
                variant="outline"
                className="w-full h-12 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-white hover:border-blue-300 transition-colors"
              >
                <BookOpen size={16} className="mr-2" />
                Create New Account
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Tab</kbd> navigate ·{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Enter</kbd> select
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
