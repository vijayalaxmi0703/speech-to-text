import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../utils/context/AuthContext.jsx";
import Toast from "../components/Toast.jsx";
import { X } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth({ mode = "signin" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, authLoading } = useAuth();
  
  const [tab, setTab] = useState(mode === "register" ? "signup" : "signin");
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // FIX 3: Remember Me - load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email");
    const rememberedFlag = localStorage.getItem("remember_me") === "true";

    if (rememberedFlag && rememberedEmail) {
      setSignInEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Sign Up state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Forgot Password State - not used

  const clearErrors = () => setErrors({});

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    return Math.min(score, 4);
  };

  const passwordStrength = calculatePasswordStrength(signUpPassword);

  const validateSignIn = () => {
    const next = {};
    if (!signInEmail.trim()) {
      next.email = "Email is required.";
    } else if (!emailRegex.test(signInEmail)) {
      next.email = "Please enter a valid email address.";
    }
    if (!signInPassword.trim()) {
      next.password = "Password is required.";
    } else if (signInPassword.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateSignUp = () => {
    const next = {};
    if (!firstName.trim()) {
      next.firstName = "First name is required.";
    }
    if (!lastName.trim()) {
      next.lastName = "Last name is required.";
    }
    if (!signUpEmail.trim()) {
      next.email = "Email is required.";
    } else if (!emailRegex.test(signUpEmail)) {
      next.email = "Please enter a valid email address.";
    }
    if (!signUpPassword) {
      next.password = "Password is required.";
    }
    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (signUpPassword !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    if (!agreeTerms) {
      next.terms = "Please accept the Terms of Service and Privacy Policy to continue.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!validateSignIn()) return;

    try {
      await login(signInEmail.trim(), signInPassword, rememberMe);

      // FIX 3: Remember Me logic
      if (rememberMe) {
        localStorage.setItem("remembered_email", signInEmail.toLowerCase().trim());
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remembered_email");
        localStorage.removeItem("remember_me");
      }

      navigate("/dashboard");
    } catch (error) {
      setToast({
        message: error.message || "Unable to sign in. Check your email and password.",
        type: "error",
      });
    }
  };
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!validateSignUp()) return;

    setAuthLoading(true);
    try {
      const res = await register(
        `${firstName.trim()} ${lastName.trim()}`,
        signUpEmail.trim(),
        signUpPassword
      );

      // FIX 1: Store token and user — same as login flow
      localStorage.setItem("authToken", res.token);
      localStorage.setItem("authUser", JSON.stringify(res.user));

      // FIX 1: Update global auth context
      setUser(res.user);

      // FIX 1: Redirect immediately to dashboard — no toast, no delay
      navigate("/dashboard");
    } catch (error) {
      setToast({
        message: error.message || "Unable to create account. Try again.",
        type: "error",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // Forgot password not implemented - show message
    setToast({
      message: "Password reset feature coming soon. Please contact support.",
      type: "info",
    });
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-dm-sans relative overflow-hidden">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full h-[50px] pl-4 pr-12 rounded-[12px] bg-bg-input border border-border-dim text-text-primary placeholder-text-hint font-dm-sans text-[15px] focus:outline-none focus:border-border-focus focus:shadow-glow transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showNewPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs mt-1 text-error-border">{errors.newPassword}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full h-[50px] pl-4 pr-12 rounded-[12px] bg-bg-input border border-border-dim text-text-primary placeholder-text-hint font-dm-sans text-[15px] focus:outline-none focus:border-border-focus focus:shadow-glow transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showConfirmNewPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs mt-1 text-error-border">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={otpLoading}
                  className="w-full h-[44px] bg-grad-primary text-white font-semibold rounded-lg hover:shadow-elevation transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Ambient Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full bg-accent-purple/12 blur-[90px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-accent-cyan/08 blur-[90px] pointer-events-none z-0" />
      <div className="fixed top-1/2 right-0 w-[300px] h-[300px] rounded-full bg-accent-sky/06 blur-[90px] pointer-events-none z-0" />

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[45%_55%]">
        {/* Left Panel */}
        <div className="relative bg-gradient-to-br from-[#0d1f3c] to-bg-page border-r border-accent-purple/10 p-[64px_56px] hidden lg:flex flex-col justify-between">
          {/* Grid Texture Overlay */}
          <div className="absolute inset-0 opacity-100 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div className="relative z-10 space-y-8">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-grad-cta flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                </svg>
              </div>
              <span className="font-syne font-bold text-[18px]">
                VoiceScribe <span className="text-accent-purple">AI</span>
              </span>
            </div>

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-[14px] py-[5px] rounded-[999px] bg-accent-purple/10 border border-accent-purple/25">
              <span className="w-[6px] h-[6px] rounded-full bg-accent-purple animate-pulse" />
              <span className="text-[12px] uppercase tracking-[0.04em] text-accent-purple font-medium">
                SECURE VOICE WORKSPACE
              </span>
            </div>

            {/* Hero Heading */}
            <h1 className="font-syne font-extrabold text-[clamp(30px,4vw,44px)] leading-[1.15]">
              Transform voice into{" "}
              <span className="bg-grad-cta bg-clip-text text-transparent">
                searchable text
              </span>{" "}
              with AI
            </h1>

            {/* Hero Subtext */}
            <p className="font-dm-sans font-normal text-[15px] text-text-muted max-w-[360px]">
              Access your AI transcription dashboard securely with enterprise-grade encryption and real-time processing.
            </p>

            {/* Feature Cards */}
            <div className="space-y-[14px]">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ),
                  bg: "bg-accent-purple/12",
                  title: "AI-Powered Transcription",
                  desc: "99.4% accuracy with advanced speech recognition",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  ),
                  bg: "bg-accent-cyan/10",
                  title: "Realtime File Upload + Voice Recording",
                  desc: "Upload audio files or record directly in browser",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  bg: "bg-accent-sky/10",
                  title: "Encrypted Session Storage",
                  desc: "Your data is protected with end-to-end encryption",
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-[18px_20px] rounded-[14px] bg-bg-card/70 backdrop-blur-[8px] border border-accent-purple/12 hover:border-accent-purple/30 hover:translate-x-1 transition-all duration-250"
                >
                  <div className={`w-[40px] h-[40px] rounded-[10px] ${card.bg} flex items-center justify-center text-accent-purple`}>
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[14px] text-white">{card.title}</h3>
                    <p className="text-[12.5px] text-text-muted">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="relative z-10 flex gap-8 mt-10">
            {[
              { value: "99.4%", label: "Accuracy" },
              { value: "40+", label: "Languages" },
              { value: "120k+", label: "Users" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-syne font-extrabold text-[22px] bg-grad-cta bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-[11px] uppercase tracking-[0.04em] text-text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex items-center justify-center p-[24px_20px] lg:p-[48px_56px]">
          <div className="w-full max-w-[440px]">
            {/* Mobile Header - Only visible on small screens */}
            <div className="lg:hidden mb-6 flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-grad-cta flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                </svg>
              </div>
              <span className="font-syne font-bold text-[18px] text-text-primary">
                VoiceScribe <span className="text-accent-purple">AI</span>
              </span>
            </div>
            {/* Auth Card */}
            <div className="relative bg-bg-card border border-border-dim rounded-[18px] p-[24px_20px] lg:p-[40px_36px]">
              {/* Top Edge Decoration */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-purple/50 to-accent-cyan/40" />

              {/* Toast Container */}
              {toast && (
                <div className="mb-4 p-3 rounded-[10px] border border-error-border bg-error-bg text-[#fca5a5] text-sm flex items-center gap-2 animate-slideIn">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1">{toast.message}</span>
                  <button onClick={() => setToast(null)} className="text-text-muted hover:text-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Sign In Form */}
              {tab === "signin" && (
                <div className="animate-fadeIn">
                  <div className="mb-5 lg:mb-6">
                    <h2 className="font-syne font-bold text-[20px] lg:text-[22px] text-text-primary mb-2">
                      Welcome back
                    </h2>
                    <p className="font-dm-sans text-[13px] lg:text-[13.5px] text-text-muted">
                      Access your AI transcription dashboard securely.
                    </p>
                  </div>

                  <form onSubmit={handleSignInSubmit} className="space-y-4 lg:space-y-5">
                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute left-[12px] lg:left-[14px] top-1/2 -translate-y-1/2 text-text-muted">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder="yourname@company.com"
                          className={`w-full h-[46px] lg:h-[50px] pl-[38px] lg:pl-[42px] pr-3 lg:pr-4 rounded-[12px] bg-bg-input border text-text-primary placeholder-text-hint font-dm-sans text-[14px] lg:text-[15px] transition-all duration-[0.22s] ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none ${
                            errors.email ? "border-error-border" : "border-border-dim focus:border-border-focus focus:shadow-glow"
                          }`}
                        />
                      </div>
                      <p className={`text-[11px] lg:text-xs mt-1 ${errors.email ? "text-error-border" : "text-text-hint"}`}>
                        {errors.email || "Secure email login for your private workspace."}
                      </p>
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-text-primary">Password</label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[13px] lg:text-sm text-accent-sky hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute left-[12px] lg:left-[14px] top-1/2 -translate-y-1/2 text-text-muted">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showSignInPassword ? "text" : "password"}
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="••••••••••"
                          className={`w-full h-[46px] lg:h-[50px] pl-[38px] lg:pl-[42px] pr-[38px] lg:pr-[44px] rounded-[12px] bg-bg-input border text-text-primary placeholder-text-hint font-dm-sans text-[14px] lg:text-[15px] transition-all duration-[0.22s] ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none ${
                            errors.password ? "border-error-border" : "border-border-dim focus:border-border-focus focus:shadow-glow"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          className="absolute right-[12px] lg:right-[14px] top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                        >
                          {showSignInPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className={`text-[11px] lg:text-xs mt-1 ${errors.password ? "text-error-border" : "text-text-hint"}`}>
                        {errors.password || "Minimum 8 characters recommended."}
                      </p>

                      {/* Remember Me */}
                      <div className="flex items-center gap-2 lg:gap-3 mt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-[16px] lg:w-[18px] h-[16px] lg:h-[18px] rounded-[5px] border transition-all ${
                              rememberMe ? "bg-accent-purple border-accent-purple" : "bg-bg-input border-border-dim"
                            }`}>
                              {rememberMe && (
                                <svg className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-[13px] lg:text-sm text-text-primary">Remember me</span>
                        </label>
                      </div>
                    </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full h-[48px] lg:h-[52px] bg-grad-cta text-white font-syne font-semibold rounded-[12px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(139,92,246,0.45)] hover:brightness-[1.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:brightness-85"
                  >
                    {authLoading ? "Signing in…" : "Sign In to Dashboard"}
                  </button>
                  </form>

                  {/* Footer */}
                  <div className="mt-5 lg:mt-6 pt-5 lg:pt-6 border-t border-border-dim">
                    <div className="flex bg-bg-input border border-border-dim rounded-[10px] p-1 gap-1">
                      <button
                        onClick={() => setTab("signin")}
                        className={`flex-1 py-2 px-3 lg:px-4 rounded-[8px] text-[13px] lg:text-sm font-medium transition-all duration-300 ${
                          tab === "signin"
                            ? "bg-grad-cta text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => setTab("signup")}
                        className={`flex-1 py-2 px-3 lg:px-4 rounded-[8px] text-[13px] lg:text-sm font-medium transition-all duration-300 ${
                          tab === "signup"
                            ? "bg-grad-cta text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        Create Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign Up Form */}
              {tab === "signup" && (
                <div className="animate-fadeIn">
                  <div className="mb-5 lg:mb-6">
                    <h2 className="font-syne font-bold text-[20px] lg:text-[22px] text-text-primary mb-2">
                      Create your account
                    </h2>
                    <p className="font-dm-sans text-[13px] lg:text-[13.5px] text-text-muted">
                      Start transcribing for free — no credit card required.
                    </p>
                  </div>

                  <form onSubmit={handleSignUpSubmit} className="space-y-4 lg:space-y-5">
                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-[10px] lg:gap-[14px]">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          First name
                        </label>
                        <div className="relative">
                          <div className="absolute left-[12px] lg:left-[14px] top-1/2 -translate-y-1/2 text-text-muted">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Jane"
                            className={`w-full h-[46px] lg:h-[50px] pl-[38px] lg:pl-[42px] pr-3 lg:pr-4 rounded-[12px] bg-bg-input border text-text-primary placeholder-text-hint font-dm-sans text-[14px] lg:text-[15px] transition-all duration-[0.22s] ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none ${
                              errors.firstName ? "border-error-border" : "border-border-dim focus:border-border-focus focus:shadow-glow"
                            }`}
                          />
                        </div>
                        {errors.firstName && <p className="text-[11px] lg:text-xs mt-1 text-error-border">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Last name
                        </label>
                        <div className="relative">
                          <div className="absolute left-[12px] lg:left-[14px] top-1/2 -translate-y-1/2 text-text-muted">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className={`w-full h-[46px] lg:h-[50px] pl-[38px] lg:pl-[42px] pr-3 lg:pr-4 rounded-[12px] bg-bg-input border text-text-primary placeholder-text-hint font-dm-sans text-[14px] lg:text-[15px] transition-all duration-[0.22s] ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none ${
                              errors.lastName ? "border-error-border" : "border-border-dim focus:border-border-focus focus:shadow-glow"
                            }`}
                          />
                        </div>
                        {errors.lastName && <p className="text-[11px] lg:text-xs mt-1 text-error-border">{errors.lastName}</p>}
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute left-[12px] lg:left-[14px] top-1/2 -translate-y-1/2 text-text-muted">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="yourname@company.com"
                          className={`w-full h-[46px] lg:h-[50px] pl-[38px] lg:pl-[42px] pr-3 lg:pr-4 rounded-[12px] bg-bg-input border text-text-primary placeholder-text-hint font-dm-sans text-[14px] lg:text-[15px] transition-all duration-[0.22s] ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none ${
                            errors.email ? "border-error-border" : "border-border-dim focus:border-border-focus focus:shadow-glow"
                          }`}
                        />
                      </div>
                      <p className={`text-[11px] lg:text-xs mt-1 ${errors.email ? "text-error-border" : "text-text-hint"}`}>
                        {errors.email || "We'll send a verification link to this address."}
                      </p>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Create password
                      </label>
                      <div className="relative">
                        <div className="absolute left-[12px] lg:left-[14px] top-1/2 -translate-y-1/2 text-text-muted">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showSignUpPassword ? "text" : "password"}
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="••••••••••"
                          className={`w-full h-[46px] lg:h-[50px] pl-[38px] lg:pl-[42px] pr-[38px] lg:pr-[44px] rounded-[12px] bg-bg-input border text-text-primary placeholder-text-hint font-dm-sans text-[14px] lg:text-[15px] transition-all duration-[0.22s] ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none ${
                            errors.password ? "border-error-border" : "border-border-dim focus:border-border-focus focus:shadow-glow"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-[12px] lg:right-[14px] top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                        >
                          {showSignUpPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Password Strength Bar */}
                      <div className="flex gap-1 mt-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 h-[3px] rounded-full ${
                              i < passwordStrength
                                ? passwordStrength === 1
                                  ? "bg-error-border"
                                  : passwordStrength <= 3
                                  ? "bg-warning"
                                  : "bg-success"
                                : "bg-border-dim"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] lg:text-xs mt-1 ${
                        passwordStrength === 0
                          ? "text-text-hint"
                          : passwordStrength === 1
                          ? "text-error-border"
                          : passwordStrength <= 3
                          ? "text-warning"
                          : "text-success"
                      }`}>
                        {passwordStrength === 0 && "Use 8+ chars, numbers & symbols"}
                        {passwordStrength === 1 && "Weak — add numbers & symbols"}
                        {passwordStrength === 2 && "Fair — try uppercase letters"}
                        {passwordStrength === 3 && "Good — add a special character"}
                        {passwordStrength === 4 && "Strong password ✓"}
                      </p>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Confirm password
                      </label>
                      <div className="relative">
                        <div className="absolute left-[12px] lg:left-[14px] top-1/2 -translate-y-1/2 text-text-muted">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••"
                          className={`w-full h-[46px] lg:h-[50px] pl-[38px] lg:pl-[42px] pr-[38px] lg:pr-[44px] rounded-[12px] bg-bg-input border text-text-primary placeholder-text-hint font-dm-sans text-[14px] lg:text-[15px] transition-all duration-[0.22s] ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none ${
                            confirmPassword && signUpPassword !== confirmPassword
                              ? "border-error-border"
                              : confirmPassword && signUpPassword === confirmPassword
                              ? "border-success"
                              : "border-border-dim focus:border-border-focus focus:shadow-glow"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-[12px] lg:right-[14px] top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                        >
                          {showConfirmPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className={`text-[11px] lg:text-xs mt-1 ${
                        !confirmPassword
                          ? "text-text-hint"
                          : signUpPassword === confirmPassword
                          ? "text-success"
                          : "text-error-border"
                      }`}>
                        {!confirmPassword && "Passwords must match."}
                        {confirmPassword && signUpPassword === confirmPassword && "✓ Passwords match"}
                        {confirmPassword && signUpPassword !== confirmPassword && "✕ Passwords do not match"}
                      </p>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2 lg:gap-3">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <div className="relative mt-0.5">
                          <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-[16px] lg:w-[18px] h-[16px] lg:h-[18px] rounded-[5px] border transition-all ${
                            agreeTerms ? "bg-accent-purple border-accent-purple" : "bg-bg-input border-border-dim"
                          }`}>
                            {agreeTerms && (
                              <svg className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-[13px] lg:text-sm text-text-muted">
                          I agree to the{" "}
                          <Link to="/terms" className="text-accent-sky hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link to="/privacy" className="text-accent-sky hover:underline">
                            Privacy Policy
                          </Link>
                        </span>
                      </label>
                    </div>
                    {errors.terms && <p className="text-[11px] lg:text-xs text-error-border">{errors.terms}</p>}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full h-[48px] lg:h-[52px] bg-grad-cta text-white font-syne font-semibold rounded-[12px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(139,92,246,0.45)] hover:brightness-[1.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:brightness-85"
                    >
                      {authLoading ? "Creating account…" : "Create Free Account"}
                    </button>
                  </form>

                  {/* Footer */}
                  <div className="mt-5 lg:mt-6 pt-5 lg:pt-6 border-t border-border-dim">
                    <div className="flex bg-bg-input border border-border-dim rounded-[10px] p-1 gap-1">
                      <button
                        onClick={() => setTab("signin")}
                        className={`flex-1 py-2 px-3 lg:px-4 rounded-[8px] text-[13px] lg:text-sm font-medium transition-all duration-300 ${
                          tab === "signin"
                            ? "bg-grad-cta text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => setTab("signup")}
                        className={`flex-1 py-2 px-3 lg:px-4 rounded-[8px] text-[13px] lg:text-sm font-medium transition-all duration-300 ${
                          tab === "signup"
                            ? "bg-grad-cta text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        Create Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease forwards;
        }
        @keyframes slideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
}
