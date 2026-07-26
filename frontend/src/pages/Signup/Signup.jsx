import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, UserPlus, Headphones, BookOpen, ShieldCheck, CheckCircle, ArrowLeft } from "lucide-react";
import pmiLogo from "@/assets/pmi-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccessibility, speak } from "@/hooks/useAccessibility";
import API from "@/api";
import { getErrorMessage } from "@/lib/utils";

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "bg-red-400", "bg-amber-400", "bg-blue-500", "bg-emerald-500"];

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [success, setSuccess] = useState(false);

  const { voiceEnabled, announce } = useAccessibility();

  useEffect(() => {
    if (voiceEnabled) speak("Welcome to PMI AudioBook. Create your account to access audiobooks.");
    announce("Signup page loaded.", "polite");
  }, []);

  const calcStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") setPasswordStrength(calcStrength(value));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim())                              newErrors.name = "Name is required";
    if (!formData.email.trim())                             newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))         newErrors.email = "Invalid email address";
    if (!formData.password)                                 newErrors.password = "Password is required";
    else if (formData.password.length < 8)                  newErrors.password = "Minimum 8 characters";
    if (!formData.confirmPassword)                          newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = Object.values(errs)[0];
      if (voiceEnabled) speak(first);
      announce(first, "assertive");
      return;
    }
    setLoading(true);
    if (voiceEnabled) speak("Creating your account. Please wait.");

    try {
      const response = await API.post("/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (response.data.refreshToken) localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setSuccess(true);
        if (voiceEnabled) speak(`Welcome, ${response.data.user.name}! Your account has been created.`);
        announce("Account created successfully. Redirecting to dashboard.", "assertive");
        setTimeout(() => navigate("/dashboard"), 1200);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, "Signup failed. Please try again.");
      setErrors({ general: errorMsg });
      if (voiceEnabled) {
        speak(errorMsg);
      }
      announce(errorMsg, "assertive");
      const msg = err.response?.data?.error || "Signup failed. Please try again.";
      setErrors({ form: msg });
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
        setErrors({});
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());
        if (!userInfo || userInfo.error) throw new Error("Failed to fetch Google user info");

        const response = await API.post("/auth/google", {
          token: tokenResponse.id_token || tokenResponse.access_token,
        });
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          if (response.data.refreshToken) localStorage.setItem("refreshToken", response.data.refreshToken);
          if (response.data.user) localStorage.setItem("user", JSON.stringify(response.data.user));
          setSuccess(true);
          setTimeout(() => navigate("/dashboard", { replace: true }), 800);
        } else {
          throw new Error("No token received");
        }
      } catch (err) {
        const errorMsg = getErrorMessage(err, "Google signup failed. Please try again.");
        setErrors({ general: errorMsg });
        if (voiceEnabled) {
          speak(errorMsg);
        }
        announce(errorMsg, "assertive");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error, "Google signup failed");
      setErrors({ general: errorMsg });
      if (voiceEnabled) {
        speak(errorMsg);
      }
    }
  });

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-inter">
        <div className="text-center animate-fade-up">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Account created!</h2>
          <p className="text-slate-500">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-inter">

      {/* ── Left panel ───────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[60px]" />

        <div className="relative z-10 flex items-center gap-3">
          <img src={pmiLogo} alt="PMI Logo" className="h-11 w-auto brightness-0 invert" />
          <span className="text-white text-2xl font-black tracking-tight">AudioBook</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Join thousands of<br />
            <span className="text-indigo-400">curious listeners.</span>
          </h2>
          <p className="text-blue-100/70 text-base leading-relaxed mb-10 max-w-sm">
            Create your free account in under a minute and dive into our entire library of premium audiobooks.
          </p>
          <div className="space-y-4">
            {[
              { icon: Headphones, text: "Crystal-clear audio narrations" },
              { icon: BookOpen,    text: "Access hundreds of titles instantly" },
              { icon: ShieldCheck, text: "Accessible to everyone, always" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-indigo-300" />
                </div>
                <span className="text-blue-100/80 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-200/30 text-xs">
          &copy; {new Date().getFullYear()} PMI AudioBook
        </p>
      </div>

      {/* ── Right panel ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6 py-12 overflow-y-auto">
        <a href="#signup-form" className="sr-only-focusable">Skip to signup form</a>

        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <img src={pmiLogo} alt="PMI Logo" className="h-8 w-auto" />
            <span className="text-lg font-black text-slate-800">AudioBook</span>
          </div>

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to sign in
          </Link>

          <h1 className="text-3xl font-black text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 mb-7">It's free and only takes a minute.</p>

          {/* Google button first */}
          <Button
            type="button"
            variant="outline"
            onClick={() => googleLogin()}
            disabled={loading}
            className="w-full h-12 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-white hover:border-blue-300 mb-5 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 px-3 text-slate-400 font-medium">Or sign up with email</span>
            </div>
          </div>

          {/* Form error */}
          {errors.form && (
            <div role="alert" className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {errors.form}
            </div>
          )}

          <form id="signup-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full name</Label>
              <Input
                id="name" name="name" type="text"
                placeholder="Your full name"
                value={formData.name} onChange={handleChange}
                required autoComplete="name"
                className={`enhanced-focus h-11 rounded-xl border-slate-200 bg-white ${errors.name ? "border-red-400" : ""}`}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</Label>
              <Input
                id="email" name="email" type="email"
                placeholder="you@example.com"
                value={formData.email} onChange={handleChange}
                required autoComplete="email"
                className={`enhanced-focus h-11 rounded-xl border-slate-200 bg-white ${errors.email ? "border-red-400" : ""}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={formData.password} onChange={handleChange}
                  required autoComplete="new-password"
                  className={`enhanced-focus h-11 rounded-xl border-slate-200 bg-white pr-11 ${errors.password ? "border-red-400" : ""}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {formData.password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-slate-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{strengthLabels[passwordStrength]} password</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword" name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword} onChange={handleChange}
                  required autoComplete="new-password"
                  className={`enhanced-focus h-11 rounded-xl border-slate-200 bg-white pr-11 ${errors.confirmPassword ? "border-red-400" : ""}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <Button
              type="submit" disabled={loading} aria-busy={loading}
              className="w-full h-12 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 mt-2 transition-all duration-200"
            >
              {loading ? <span className="animate-pulse">Creating account…</span> : (
                <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;