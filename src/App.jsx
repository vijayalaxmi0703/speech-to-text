import { useState, useRef, useEffect } from "react";
import api from "./utils/api";
import "./App.css";
import {
  Mic,
  MicOff,
  CloudUpload,
  Copy,
  Check,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import Toast from "./components/Toast.jsx";
import DropZone from "./components/DropZone.jsx";
import Waveform from "./components/Waveform.jsx";
import AudioPreview from "./components/AudioPreview.jsx";
import HistoryCard from "./components/HistoryCard.jsx";

const API_URL = "http://localhost:5000";

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.get("/", { timeout: 4500 });
        setServerStatus("Backend Connected");
        await fetchTranscriptions();
      } catch (err) {
        setServerStatus("Backend Offline");
      }
    };

    checkBackend();

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const formatTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`;

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const fetchTranscriptions = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get(`/transcriptions`, {
        timeout: 10000,
      });
      setHistory(
        response.data.map((item) => ({
          ...item,
          createdAt: formatDate(item.createdAt),
        }))
      );
    } catch (err) {
      console.error(err);
      if (serverStatus !== "Backend Offline") {
        showToast("Unable to fetch history. Check the backend.", "error");
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const uploadAudio = async (audioFile) => {
    setLoading(true);
    setError(null);
    setTranscription("");

    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      const response = await api.post(`/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000,
      });

      setTranscription(response.data.transcription || "");
      showToast("Transcription complete!", "success");
      await fetchTranscriptions();
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message || err.message ||
        "Upload failed. Please check your connection.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      showToast("Please select an audio file first.", "error");
      return;
    }

    if (!selectedFile.type.startsWith("audio/")) {
      showToast("Unsupported file type. Upload audio only.", "error");
      return;
    }

    uploadAudio(selectedFile);
  };

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const audioFile = new File([blob], "recording.webm", {
          type: "audio/webm",
        });

        setSelectedFile(audioFile);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        await uploadAudio(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast(
        "Microphone access denied. Please allow access and retry.",
        "error"
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const copyTranscription = async (text = transcription) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      showToast("Unable to copy. Try again.", "error");
    }
  };

  const deleteTranscription = async (id) => {
    try {
      setDeleteId(id);
      await api.delete(`/transcriptions/${id}`, {
        timeout: 10000,
      });
      showToast("Transcript deleted.", "success");
      await fetchTranscriptions();
    } catch (err) {
      console.error(err);
      showToast("Could not delete the transcript.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const resetAll = () => {
    handleClearFile();
    setRecording(false);
    setRecordingTime(0);
    setCopied(false);
    setError(null);
    clearInterval(timerRef.current);
  };

  const isBackendOnline = serverStatus === "Backend Connected";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),_transparent_28%),_radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_20%),_linear-gradient(180deg,_#04050d_0%,_#090d18_100%)] text-white">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 md:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/80 p-8 shadow-[0_50px_150px_-60px_rgba(59,130,246,0.3)] backdrop-blur-2xl">
          <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute left-0 top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200/90 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                <Sparkles size={14} /> AI badge
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-cyan-200 to-white sm:text-5xl">
                  Transform speech into search-ready text with a futuristic AI dashboard.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Upload audio, record live voice, and manage every transcription through a responsive premium interface.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Backend status</p>
                  <p className={`mt-3 text-sm font-semibold ${isBackendOnline ? "text-emerald-300" : "text-rose-300"}`}>
                    {serverStatus}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Transcript count</p>
                  <p className="mt-3 text-sm font-semibold text-white/80">{history.length} saved</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live AI flow</p>
                  <p className="mt-3 text-lg font-semibold text-white">Ready to convert audio instantly.</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-violet-500/10 text-violet-300">
                  <CloudUpload size={22} />
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-[28px] border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/5 text-cyan-300">1</span>
                  Drop or upload audio.
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/5 text-fuchsia-300">2</span>
                  Record with the mic button.
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/5 text-emerald-300">3</span>
                  Save transcripts automatically.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-[38px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Source control</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Upload or record audio with confidence.</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/60 shadow-inner shadow-slate-950/20">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <CloudUpload size={18} />
                </span>
                Fast uploads
              </div>
            </div>

            <div className="space-y-6">
              <DropZone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleClearFile}
                disabled={loading || recording}
              />

              {audioPreviewUrl && !recording && <AudioPreview src={audioPreviewUrl} />}

              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || loading || recording || !isBackendOnline}
                  className="group inline-flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(124,58,237,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <CloudUpload size={16} className="mr-2" />
                      Transcribe File
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={loading || !isBackendOnline}
                  className={`inline-flex min-h-[56px] min-w-[56px] items-center justify-center rounded-3xl px-5 text-sm font-semibold transition ${
                    recording
                      ? "bg-rose-500 text-white shadow-[0_20px_80px_rgba(248,113,113,0.25)]"
                      : "bg-emerald-400 text-slate-950 shadow-[0_20px_80px_rgba(34,197,94,0.25)]"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {recording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Live microphone recording</p>
                    <p className="text-xs text-slate-400">Tap the mic to start or stop audio capture anytime.</p>
                  </div>
                  <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-950/60 px-4 py-3 text-sm text-white/70">
                    <span className={`h-3 w-3 rounded-full ${recording ? "bg-rose-400 animate-pulse" : "bg-emerald-300"}`} />
                    {recording ? `Recording • ${formatTime(recordingTime)}` : "Ready to capture"}
                  </div>
                </div>
                <div className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
                  <Waveform />
                </div>
              </div>

              {error && (
                <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 rounded-[38px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Transcription output</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Beautiful text results</h2>
              </div>
              <button
                type="button"
                onClick={() => copyTranscription()}
                disabled={!transcription}
                className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy result"}
              </button>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 min-h-[220px] text-sm leading-7 text-white/70">
              {loading ? (
                <div className="flex items-center gap-3 text-white/60">
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing audio and generating your transcript...
                </div>
              ) : transcription ? (
                <p className="whitespace-pre-wrap break-words">{transcription}</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-white/50">Your transcript will appear here once the audio processing completes.</p>
                  <p className="text-xs text-white/30">Upload a file or record live audio to begin.</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={resetAll}
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/80 transition hover:border-cyan-300/30 hover:text-white"
            >
              <RotateCcw size={16} className="inline-block mr-2" /> Reset workspace
            </button>
          </div>
        </section>

        <section className="space-y-6 rounded-[38px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Transcript history</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Saved transcripts</h2>
            </div>
            <p className="text-sm text-white/50">Auto-refreshes after upload, record, and delete.</p>
          </div>

          {historyLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <div className="h-4 w-2/5 rounded-full bg-white/10" />
                  <div className="mt-4 space-y-3">
                    <div className="h-3 rounded-full bg-white/10" />
                    <div className="h-3 rounded-full bg-white/10" />
                    <div className="h-3 rounded-full bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {history.map((entry) => (
                <div key={entry._id}>
                  <HistoryCard
                    entry={entry}
                    onCopy={copyTranscription}
                    onDelete={deleteTranscription}
                    deleting={deleteId === entry._id}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-8 text-center text-white/60">
              <p className="text-lg font-semibold text-white">Your history is empty.</p>
              <p className="mt-3 text-sm text-white/40">
                Start by uploading a file or recording live audio to save transcripts automatically.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
