import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const { login, authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const clearErrors = () => setErrors({});

  const validate = () => {
    const next = {};

    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      next.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      next.password = "Password is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleForgotPassword = (event) => {
    event.preventDefault();
    setToast({
      message: "Forgot password support is coming soon.",
      type: "success",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearErrors();

    if (!validate()) {
      return;
    }

    try {
      await login(email.trim(), password, rememberMe);
      navigate("/");
    } catch (error) {
      setToast({
        message:
          error.message || "Unable to sign in. Check your email and password.",
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_26%),_radial-gradient(circle_at_top_right,_rgba(34,211,238,0.15),_transparent_18%),_linear-gradient(180deg,_#04050d_0%,_#090d18_100%)] text-white">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-[radial-gradient(circle_at_center,_rgba(101,116,255,0.18),_transparent_48%)]" />

        <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <section className="relative flex flex-col justify-between overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/75 p-8 shadow-[0_40px_120px_-60px_rgba(79,70,229,0.35)] backdrop-blur-xl md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.08),_transparent_35%)] opacity-80" />
            <div className="relative z-10 space-y-8 fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/5 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
                <Sparkles size={16} className="text-cyan-300" />
                Premium AI Speech Intelligence
              </div>

              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-300/80">Secure voice workspace</p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Transform voice into searchable text with secure AI transcription.
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-400">
                  Log in to a polished workspace built for fast speech capture, private history, and effortless AI-powered transcription.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Encrypted session storage",
                  "Realtime file upload + voice recording",
                  "Intuitive transcription history",
                  "Premium dark glass aesthetic",
                ].map((item) => (
                  <div key={item} className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 text-sm transition hover:border-cyan-300/30 hover:bg-slate-900/90">
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 shadow-[0_20px_60px_-40px_rgba(34,211,238,0.35)]">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-white/90">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 flex items-center gap-4 rounded-[28px] border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-violet-500/10 text-violet-300 shadow-[0_0_40px_rgba(124,58,237,0.16)]">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-200">Instant collaboration-ready workspace</p>
                <p className="text-xs text-slate-500">Seamless access from any device with the same premium feel.</p>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/85 p-8 shadow-[0_40px_90px_-35px_rgba(15,23,42,0.7)] backdrop-blur-xl md:p-10">
            <div className="absolute right-[-44px] top-[-24px] h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute left-[-36px] bottom-[-16px] h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative z-10 space-y-8 fade-in-up">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Sign in</p>
                <h2 className="text-3xl font-semibold tracking-tight text-white">Access your AI transcription dashboard</h2>
                <p className="text-sm leading-6 text-slate-400">
                  Use secure credentials to continue your workflow and access your personalized transcription history.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    <p className="text-xs text-slate-500">Secure email login for your private workspace.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-200">
                    <span>Password</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-slate-400 transition hover:text-white"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-900/80 px-4 py-3 transition duration-300 focus-within:border-violet-300/60 focus-within:ring-1 focus-within:ring-violet-300/20">
                    <Lock size={18} className="text-violet-300" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Your secure password"
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
                    <p className="text-xs text-slate-500">Minimum 8 characters recommended.</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/30">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-white/15 bg-slate-950 text-cyan-400 focus:ring-cyan-300"
                    />
                    Remember me
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-cyan-300 transition hover:text-white"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_-20px_rgba(124,58,237,0.45)] transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authLoading ? (
                    <>
                      <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-400">
                New to the workspace?{' '}
                <Link to="/register" className="font-semibold text-cyan-300 transition hover:text-white">
                  Create an account <ArrowRight size={16} className="inline-block" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
