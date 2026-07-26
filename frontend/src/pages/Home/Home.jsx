import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, ShieldCheck, Zap, Headphones, Play, Star, Users } from "lucide-react";
import pmiLogo from "@/assets/pmi-logo.png";
import { Button } from "@/components/ui/button";
import { useAccessibility, speak } from "@/hooks/useAccessibility";

const FEATURES = [
  {
    icon: Headphones,
    title: "Premium Audio",
    desc: "Studio-quality narration with seamless chapter navigation and playback controls.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    icon: ShieldCheck,
    title: "Inclusive Design",
    desc: "Built for everyone — voice guidance, high contrast mode, and full keyboard navigation.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600"
  },
  {
    icon: BookOpen,
    title: "Curated Library",
    desc: "Carefully selected titles across all genres, from timeless classics to modern favourites.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    iconColor: "text-violet-600"
  },
];

const STATS = [
  { icon: BookOpen, value: "500+", label: "Audiobooks" },
  { icon: Users,    value: "10K+", label: "Listeners"  },
  { icon: Star,     value: "4.9",  label: "Avg Rating" },
];

const Home = () => {
  const navigate = useNavigate();
  const { announce } = useAccessibility();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    } else {
      setMounted(true);
      announce(
        "Welcome to PMI AudioBook. The ultimate accessible reading platform. Sign in or sign up to get started.",
        "polite",
        true
      );
    }
  }, [navigate, announce]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-inter overflow-hidden">

      {/* ── Decorative gradient blobs ─────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-60 animate-float-blob" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[100px] opacity-50 animate-float-blob animate-delay-400" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-50 rounded-full blur-[80px] opacity-40" />
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <img src={pmiLogo} alt="PMI Logo" className="h-10 w-auto drop-shadow-sm" />
          <span className="text-xl font-black text-slate-800 tracking-tight">AudioBook</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-slate-600 font-semibold hover:text-blue-600 hover:bg-blue-50 rounded-xl">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-8 border border-blue-100 animate-fade-up shadow-sm">
          <Zap size={13} className="fill-current" />
          ACCESSIBILITY-FIRST AUDIOBOOK PLATFORM
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.08] animate-fade-up animate-delay-100">
          Knowledge is{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              better heard
            </span>
            <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-100 -z-0 rounded" />
          </span>{" "}
          than read.
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up animate-delay-200">
          The ultimate accessible audiobook experience — high-quality narrations, inclusive design,
          and a carefully curated library at your fingertips.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center animate-fade-up animate-delay-300">
          <Link to="/signup">
            <button className="pmi-btn-primary text-base h-14 px-8 rounded-2xl group">
              Start Listening Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              className="h-14 px-8 text-base font-semibold rounded-2xl border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
            >
              <Play size={16} className="mr-2 fill-current" />
              I have an account
            </Button>
          </Link>
        </div>

        {/* Stats strip */}
        <div className="flex items-center justify-center gap-8 mt-14 animate-fade-up animate-delay-400">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{value}</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Feature cards ────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg, iconColor }, i) => (
            <div
              key={title}
              className={`pmi-card p-8 animate-fade-up`}
              style={{ animationDelay: `${0.1 * i + 0.5}s` }}
            >
              <div className={`w-12 h-12 ${bg} ${iconColor} rounded-2xl flex items-center justify-center mb-6`}>
                <Icon size={22} />
              </div>
              <h3 className="text-lg font-bold mb-3 text-slate-800">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/60 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={pmiLogo} alt="PMI" className="h-7 w-auto opacity-70" />
            <span className="text-sm text-slate-400 font-semibold">AudioBook</span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} PMI AudioBook. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
