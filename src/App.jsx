import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Mic,
  MicOff,
  Upload,
  FileAudio,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  X,

  Sparkles,
  Volume2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors =
    type === "success"
      ? "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300"
      : "from-red-500/20 to-rose-500/20 border-red-500/30 text-red-300";

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border bg-gradient-to-r backdrop-blur-xl shadow-2xl animate-slide-in ${colors}`}
      style={{ animation: "slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      {type === "success" ? (
        <Check size={17} className="shrink-0" />
      ) : (
        <AlertCircle size={17} className="shrink-0" />
      )}
      <span className="text-sm font-medium tracking-wide">{message}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Waveform Animation (recording indicator) ─────────────────────────────────
const WaveformBars = () => (
  <div className="flex items-end gap-[3px] h-7">
    {[1, 2, 3, 4, 5, 4, 3].map((h, i) => (
      <span
        key={i}
        className="w-[3px] rounded-full bg-rose-400"
        style={{
          animation: `wave 1.1s ease-in-out infinite`,
          animationDelay: `${i * 0.1}s`,
          height: `${h * 20}%`,
        }}
      />
    ))}
  </div>
);

// ─── Drag-and-drop Upload Zone ────────────────────────────────────────────────
const DropZone = ({ onFileSelect, selectedFile, onClear }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onClick={() => !selectedFile && inputRef.current?.click()}
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
        ${selectedFile
          ? "border-violet-500/40 bg-violet-500/5 cursor-default"
          : dragging
          ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
          : "border-white/10 bg-white/[0.03] hover:border-violet-500/40 hover:bg-violet-500/5"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])}
      />

      {selectedFile ? (
        /* ── File selected state ── */
        <div className="flex items-center gap-4 p-5">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <FileAudio size={22} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/90 truncate">{selectedFile.name}</p>
            <p className="text-xs text-white/40 mt-0.5">
              {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white/40 flex items-center justify-center transition-all duration-200"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        /* ── Empty drop zone ── */
        <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-1">
            <Upload size={24} className="text-white/30" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">
              Drop your audio file here
            </p>
            <p className="text-xs text-white/30 mt-1">
              or <span className="text-violet-400 underline underline-offset-2">browse files</span> · MP3, WAV, M4A, OGG
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Audio Preview Player ─────────────────────────────────────────────────────
const AudioPreview = ({ src }) => (
  <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10">
    <Volume2 size={16} className="text-violet-400 shrink-0" />
    <audio
      src={src}
      controls
      className="flex-1 h-7"
      style={{ filter: "invert(0.85) hue-rotate(200deg)" }}
    />
  </div>
);

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  // Core state
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setTranscription("");
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setAudioPreviewUrl(null);
    setTranscription("");
    setError(null);
  };

  // ── Upload to backend ──────────────────────────────────────────────────────
  const uploadAudio = async (audioFile) => {
    setLoading(true);
    setError(null);
    setTranscription("");

    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      setTranscription(res.data.transcription || "");
      showToast("Transcription complete!", "success");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "Upload failed. Please check your connection.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      showToast("Please select an audio file first.", "error");
      return;
    }
    uploadAudio(selectedFile);
  };

  // ── Recording ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
  mimeType: "audio/webm",
});
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunksRef.current, {
    type: "audio/webm",
  });

  const audioFile = new File(
    [audioBlob],
    "recording.webm",
    {
      type: "audio/webm",
    }
  );

  console.log("Recorded file:", audioFile);

  setSelectedFile(audioFile);
  setAudioPreviewUrl(URL.createObjectURL(audioBlob));

  await uploadAudio(audioFile);

  stream.getTracks().forEach((track) => track.stop());
};

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      setTranscription("");
      setError(null);

      // Start timer
      timerRef.current = setInterval(
        () => setRecordingTime((t) => t + 1),
        1000
      );
    } catch (err) {
      showToast("Microphone access denied.", "error");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Copy transcription ─────────────────────────────────────────────────────
  const copyTranscription = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription).then(() => {
      setCopied(true);
      showToast("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Full reset ─────────────────────────────────────────────────────────────
  const reset = () => {
    handleClearFile();
    setTranscription("");
    setError(null);
    setRecordingTime(0);
    if (recording) stopRecording();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Global styles injected inline ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: 'DM Sans', sans-serif;
          background: #080b14;
        }

        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fade-up { animation: fade-up 0.5s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .fade-up-3 { animation-delay: 0.2s; }
        .fade-up-4 { animation-delay: 0.28s; }

        audio::-webkit-media-controls-panel {
          background: transparent;
        }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Background ── */}
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, #1e0a3c 0%, #080b14 65%)" }}>

        {/* Decorative orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)" }} />
          <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)" }} />
        </div>

        {/* ── Card ── */}
        <div className="relative w-full max-w-2xl">

          {/* Header */}
          <div className="text-center mb-10 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium tracking-wider uppercase mb-5">
              <Sparkles size={12} />
              AI Speech Recognition
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>
              Voice to{" "}
              <span style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Text
              </span>
            </h1>
            <p className="mt-3 text-white/40 text-sm">
              Upload or record audio — get accurate transcriptions instantly.
            </p>
          </div>

          {/* Main glass card */}
          <div className="rounded-3xl border border-white/10 overflow-hidden fade-up fade-up-1"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
            }}>

            <div className="p-6 sm:p-8 space-y-6">

              {/* ── Upload Section ─────────────────────────────────────────── */}
              <div className="fade-up fade-up-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
                    <Upload size={11} className="text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                    Upload Audio
                  </span>
                </div>

                <DropZone
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onClear={handleClearFile}
                />

                {/* Audio preview */}
                {audioPreviewUrl && !recording && (
                  <AudioPreview src={audioPreviewUrl} />
                )}

                {/* Upload button */}
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || loading || recording}
                  className="mt-4 w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: selectedFile && !loading && !recording
                      ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                      : "rgba(255,255,255,0.06)",
                    boxShadow: selectedFile && !loading && !recording
                      ? "0 0 24px rgba(124,58,237,0.35)"
                      : "none",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Transcribing…
                    </>
                  ) : (
                    <>
                      Transcribe File
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-white/25 font-medium">or record live</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* ── Recording Section ───────────────────────────────────────── */}
              <div className="fade-up fade-up-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 flex items-center justify-center">
                    <Mic size={11} className="text-rose-400" />
                  </div>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                    Live Recording
                  </span>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/8 bg-white/[0.03]">
                  {/* Record / Stop button */}
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={loading}
                    className="relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: recording
                        ? "linear-gradient(135deg, #ef4444, #be123c)"
                        : "linear-gradient(135deg, #10b981, #059669)",
                      boxShadow: recording
                        ? "0 0 24px rgba(239,68,68,0.4)"
                        : "0 0 20px rgba(16,185,129,0.3)",
                    }}
                  >
                    {/* Pulse ring when recording */}
                    {recording && (
                      <span className="absolute inset-0 rounded-2xl"
                        style={{
                          border: "2px solid rgba(239,68,68,0.5)",
                          animation: "pulse-ring 1.2s ease-out infinite",
                        }}
                      />
                    )}
                    {recording ? (
                      <MicOff size={22} className="text-white" />
                    ) : (
                      <Mic size={22} className="text-white" />
                    )}
                  </button>

                  {/* Status + waveform */}
                  <div className="flex-1">
                    {recording ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-rose-300">Recording…</p>
                          <p className="text-xs text-white/40 mt-0.5 font-mono">
                            {formatTime(recordingTime)}
                          </p>
                        </div>
                        <WaveformBars />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-white/70">Ready to record</p>
                        <p className="text-xs text-white/30 mt-0.5">
                          Click the button to start
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Error Banner ─────────────────────────────────────────────── */}
              {error && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-red-500/25 bg-red-500/10">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
            </div>

            {/* ── Transcription Panel ─────────────────────────────────────────── */}
            {(transcription || loading) && (
              <div className="border-t border-white/8 p-6 sm:p-8 fade-up fade-up-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                      Transcription
                    </span>
                  </div>
                  {transcription && (
                    <button
                      onClick={copyTranscription}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all duration-150"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div
                  className="max-h-56 overflow-y-auto rounded-xl p-4 text-sm leading-relaxed text-white/80"
                  style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {loading ? (
                    <div className="flex items-center gap-3 text-white/40">
                      <Loader2 size={16} className="animate-spin text-violet-400" />
                      Analyzing audio…
                    </div>
                  ) : (
                    transcription
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Reset Button ── */}
          {(selectedFile || transcription || recording) && (
            <div className="mt-4 flex justify-center fade-up">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-150"
              >
                <RotateCcw size={13} />
                Reset everything
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-white/20 text-xs mt-8">
            Audio is processed locally · No data stored
          </p>
        </div>
      </div>
    </>
  );
}