import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { BookOpen, ArrowRight, ShieldCheck, Zap, Headphones } from "lucide-react";
import pmiLogo from "@/assets/pmi-logo.png";
import { Button } from "@/components/ui/button";
import { useAccessibility, speak } from "@/hooks/useAccessibility";

const Home = () => {
  const navigate = useNavigate();
  const { announce } = useAccessibility();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    } else {
      announce("Welcome to PMI AudioBook. The ultimate accessible reading platform. Sign in or sign up to get started.", "polite", true);
    }
  }, [navigate, announce]);

  return (
    <div className="min-h-screen bg-slate-50 font-inter overflow-hidden relative">
      {/* Background blobs for flair */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50" />

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src={pmiLogo} alt="PMI Logo" className="h-10 w-auto" />
          <span className="text-xl font-black text-slate-800 tracking-tight">AudioBook</span>
        </div>
        <Link to="/login">
          <Button variant="ghost" className="text-slate-600 font-semibold hover:text-blue-600">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full mb-8 border border-blue-100">
          <Zap size={14} />
          <span>ACCESSIBILITY FIRST PLATFORM</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
          Knowledge is <span className="text-blue-600">better heard</span> than read.
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed">
          The ultimate accessible audiobook experience. High-quality narrations, inclusive design, and a vast library at your fingertips.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link to="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg font-bold shadow-xl shadow-blue-200 rounded-2xl group">
              Start Listening Now
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Features row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full max-w-5xl">
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Headphones size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Premium Audio</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Studio-quality narration and seamless playback for the best listening experience.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Inclusive Design</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Built from the ground up for accessibility with voice guidance and high contrast.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Vast Library</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Access thousands of titles across all genres, from bestsellers to independent works.</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/50 py-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} PMI AudioBook. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
