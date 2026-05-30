import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();
  const { register, authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const clearErrors = () => setErrors({});

  const validate = () => {
    const next = {};

    if (!name.trim()) {
      next.name = "Full name is required.";
    }

    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      next.email = "Enter a valid email address.";
    }

    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Use at least 8 characters.";
    }

    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearErrors();

    if (!validate()) {
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);
      navigate("/");
    } catch (error) {
      setToast({
        message: error.message || "Unable to register. Try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_26%),_radial-gradient(circle_at_top_right,_rgba(34,211,238,0.15),_transparent_18%),_linear-gradient(180deg,_#04050d_0%,_#090d18_100%)] text-white">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-10 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.14),_transparent_48%)]" />

        <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <section className="relative flex flex-col justify-between overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/75 p-8 shadow-[0_40px_120px_-60px_rgba(79,70,229,0.35)] backdrop-blur-xl md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.08),_transparent_35%)] opacity-80" />
            <div className="relative z-10 space-y-8 fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-white/5 px-4 py-2 text-sm text-violet-200 shadow-[0_0_40px_rgba(124,58,237,0.12)]">
                <Sparkles size={16} className="text-violet-300" />
                Create your secure transcription account
              </div>

              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-300/80">Join the AI workspace</p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Register and keep every voice note, transcript, and session aligned.
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-400">
                  Get a fast, private, premium transcription dashboard designed for modern voice workflows.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Private AI transcription history",
                  "Secure JWT session storage",
                  "Elegant dark glass workspace",
                  "Responsive desktop and mobile flow",
                ].map((item) => (
                  <div key={item} className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 text-sm transition hover:border-violet-300/30 hover:bg-slate-900/90">
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 shadow-[0_20px_60px_-40px_rgba(124,58,237,0.35)]">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-white/90">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 flex items-center gap-4 rounded-[28px] border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-cyan-500/10 text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,0.16)]">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-200">Smooth onboarding for professionals.</p>
                <p className="text-xs text-slate-500">Your secure account is ready in seconds, with fast access to AI speech tools.</p>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/85 p-8 shadow-[0_40px_90px_-35px_rgba(15,23,42,0.7)] backdrop-blur-xl md:p-10">
            <div className="absolute right-[-44px] top-[-24px] h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute left-[-36px] bottom-[-16px] h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative z-10 space-y-8 fade-in-up">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Sign up</p>
                <h2 className="text-3xl font-semibold tracking-tight text-white">Build your secure AI speech dashboard</h2>
                <p className="text-sm leading-6 text-slate-400">
                  Register now and access a private, cloud-ready workspace for all your voice recordings.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Full name</label>
                  <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-900/80 px-4 py-3 transition duration-300 focus-within:border-violet-300/50 focus-within:ring-1 focus-within:ring-violet-300/20">
                    <User size={18} className="text-violet-300" />
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your full name"
                      type="text"
                      className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                      aria-invalid={!!errors.name}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-rose-300">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Email</label>
                  <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-900/80 px-4 py-3 transition duration-300 focus-within:border-cyan-300/50 focus-within:ring-1 focus-within:ring-cyan-300/20">
                    <Mail size={18} className="text-cyan-300" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      type="email"
                      className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs text-rose-300">{errors.email}</p>
                  ) : (
                    <p className="text-xs text-slate-500">We'll keep your account secure with strong encryption.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Password</label>
                  <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-900/80 px-4 py-3 transition duration-300 focus-within:border-violet-300/60 focus-within:ring-1 focus-within:ring-violet-300/20">
                    <Lock size={18} className="text-violet-300" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a password"
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-slate-400 transition hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-rose-300">{errors.password}</p>
                  ) : (
                    <p className="text-xs text-slate-500">At least 8 characters for reliable protection.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Confirm password</label>
                  <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-900/80 px-4 py-3 transition duration-300 focus-within:border-cyan-300/50 focus-within:ring-1 focus-within:ring-cyan-300/20">
                    <Lock size={18} className="text-cyan-300" />
                    <input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat your password"
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-slate-400 transition hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-300">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_-20px_rgba(124,58,237,0.45)] transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authLoading ? (
                    <>
                      <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>

              <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-cyan-300 transition hover:text-white">
                  Sign in <ArrowRight size={16} className="inline-block" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
