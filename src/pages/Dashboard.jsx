import { useState, useRef, useEffect } from "react";
import api from "../utils/api";
import "../App.css";
import {
  Mic,
  MicOff,
  CloudUpload,
  Copy,
  Check,
  Loader2,
  Trash2,
  Download,
  FileText,
  Settings,
  LogOut,
  AudioLines,
  Clock,
  X,
} from "lucide-react";

import Toast from "../components/Toast.jsx";
import DropZone from "../components/DropZone.jsx";
import Waveform from "../components/Waveform.jsx";
import AudioPreview from "../components/AudioPreview.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const LANGUAGES = [
  "Auto Detect",
  "English",
  "Spanish",
  "French",
  "German",
  "Hindi",
  "Portuguese",
  "Arabic",
  "Chinese",
  "Japanese",
];

export default function Dashboard() {
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
  const [selectedLanguage, setSelectedLanguage] = useState("Auto Detect");
  const [speakerDiarization, setSpeakerDiarization] = useState(false);
  const [wordTimestamps, setWordTimestamps] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const { user, logout } = useAuth();
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
    const date = new Date(value);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getRelativeTime = (value) => {
    if (!value) return "";
    return formatDate(value);
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
          relativeTime: getRelativeTime(item.createdAt),
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
    formData.append("language", selectedLanguage);
    formData.append("speakerDiarization", speakerDiarization);
    formData.append("wordTimestamps", wordTimestamps);

    try {
      const response = await api.post(`/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000,
      });

      setTranscription(response.data.transcription || "");
      showToast("Transcription complete!", "success");
      if (autoSave) {
        await fetchTranscriptions();
      }
    } catch (err) {
      console.error(err);
      let msg = "Something went wrong.";
      if (err.response) {
        msg = err.response.data?.message || "Server error occurred.";
      } else if (err.request) {
        msg = "Cannot connect to backend server.";
      } else {
        msg = err.message;
      }
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

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      showToast("Unsupported file type. Upload audio only.", "error");
      return;
    }

    uploadAudio(selectedFile);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("Invalid audio format selected.", "error");
      setError("Only MP3, WAV, WEBM, OGG, and M4A files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast("File size exceeds 100MB.", "error");
      setError("Please upload a smaller audio file.");
      return;
    }

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

        const audioFile = new File([blob], `recording-${Date.now()}.webm`, {
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

  const loadTranscription = (item) => {
    setTranscription(item.transcription || "");
    setSelectedFile(null);
    setAudioPreviewUrl(null);
  };

  const downloadTranscript = (format) => {
    if (!transcription) return;
    
    let content = transcription;
    let filename = `transcript-${Date.now()}`;
    let mimeType = 'text/plain';

    if (format === 'srt') {
      // Simple SRT format
      const lines = transcription.split('\n');
      content = lines.map((line, i) => 
        `${i + 1}\n00:00:00,000 --> 00:00:05,000\n${line}\n`
      ).join('\n');
      filename += '.srt';
      mimeType = 'text/plain';
    } else if (format === 'txt') {
      filename += '.txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${format.toUpperCase()}`, "success");
  };

  const clearTranscript = () => {
    setTranscription("");
    setSelectedFile(null);
    setAudioPreviewUrl(null);
    setError(null);
  };

  const getWordCount = () => {
    if (!transcription) return 0;
    return transcription.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getDuration = () => {
    if (!recordingTime) return "0m 0s";
    return formatTime(recordingTime);
  };

  const isBackendOnline = serverStatus === "Backend Connected";

  return (
    <div className="h-screen bg-saas-base text-saas-text-primary font-inter overflow-hidden">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex h-full">
        {/* Left Sidebar - 240px */}
        <aside className="w-[240px] flex-shrink-0 bg-saas-surface border-r border-saas-border-subtle flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="p-4 border-b border-saas-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-grad-primary flex items-center justify-center">
                <AudioLines size={16} className="text-white" />
              </div>
              <span className="font-semibold text-[14px]">VoiceScribe</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-saas-border-subtle">
            {user && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-saas-accent-blue flex items-center justify-center text-white text-sm font-medium">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-saas-text-secondary truncate">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* New Transcription CTA */}
          <div className="p-4">
            <button
              onClick={() => {
                setSelectedFile(null);
                setAudioPreviewUrl(null);
                setTranscription("");
                setError(null);
              }}
              className="w-full h-[40px] bg-grad-primary text-white font-medium text-[14px] rounded-lg hover:shadow-elevation transition-all flex items-center justify-center gap-2"
            >
              <CloudUpload size={16} />
              New Transcription
            </button>
          </div>

          {/* Recent Transcriptions */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-saas-text-secondary">
                Recents
              </p>
            </div>
            <div className="px-2 space-y-1">
              {historyLoading ? (
                <div className="px-2 py-3 text-center text-xs text-saas-text-muted">
                  Loading...
                </div>
              ) : history.length > 0 ? (
                history.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => loadTranscription(item)}
                    className="group relative px-3 py-2 rounded-lg hover:bg-saas-elevated cursor-pointer border-l-2 border-transparent hover:border-saas-accent-blue transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <AudioLines size={16} className="text-saas-text-secondary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.filename || `Recording ${item._id?.slice(-6)}`}
                        </p>
                        <p className="text-xs text-saas-text-secondary">
                          {item.relativeTime}
                        </p>
                      </div>
                    </div>
                    {/* Hover Actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyTranscription(item.transcription);
                        }}
                        className="p-1.5 rounded hover:bg-saas-overlay text-saas-text-secondary hover:text-saas-accent-blue"
                        title="Copy"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTranscription(item._id);
                        }}
                        className="p-1.5 rounded hover:bg-saas-overlay text-saas-text-secondary hover:text-saas-accent-red"
                        title="Delete"
                        disabled={deleteId === item._id}
                      >
                        {deleteId === item._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-2 py-6 text-center">
                  <AudioLines size={24} className="mx-auto text-saas-text-muted mb-2" />
                  <p className="text-xs text-saas-text-muted">No transcriptions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-saas-border-subtle">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-saas-text-secondary hover:text-saas-text-primary transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
            <p className="text-center text-[10px] text-saas-text-muted mt-2">v1.0.0</p>
          </div>
        </aside>

        {/* Center Panel - 1fr */}
        <main className="flex-1 bg-saas-base overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Audio Input Section */}
            <div>
              <h2 className="text-[16px] font-semibold text-saas-text-primary mb-4">
                Audio Input
              </h2>

              {/* Drag & Drop Zone */}
              <DropZone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleClearFile}
                disabled={loading || recording}
              />

              {audioPreviewUrl && !recording && (
                <div className="mt-4">
                  <AudioPreview src={audioPreviewUrl} />
                </div>
              )}

              {/* Recording Section */}
              <div className="mt-4 bg-saas-surface border border-saas-border-subtle rounded-[10px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-saas-accent-blue flex items-center justify-center">
                      <Mic size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-saas-text-primary">
                        Live Recording
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${recording ? "bg-saas-accent-red animate-pulse" : "bg-saas-accent-emerald"}`} />
                        <span className="text-xs text-saas-text-secondary">
                          {recording ? `Recording • ${formatTime(recordingTime)}` : "Ready"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={loading || !isBackendOnline}
                    className="w-10 h-10 rounded-full bg-saas-accent-blue flex items-center justify-center text-white hover:shadow-elevation transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {recording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>

                {/* Animated Waveform when recording */}
                {recording && (
                  <div className="flex items-center justify-center gap-1 h-8">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-saas-accent-blue rounded-full animate-pulse"
                        style={{
                          height: `${20 + Math.random() * 20}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {!recording && (
                  <div className="rounded-lg border border-saas-border-subtle bg-saas-base p-4">
                    <Waveform />
                  </div>
                )}
              </div>

              {/* Language Selector */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-saas-text-primary mb-2">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full h-[40px] px-3 rounded-lg bg-saas-elevated border border-saas-border-subtle text-saas-text-primary text-sm focus:outline-none focus:border-saas-border-focus"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transcribe Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading || recording || !isBackendOnline}
                className="w-full h-[44px] mt-4 bg-grad-primary text-white font-semibold text-[15px] rounded-lg hover:-translate-y-1 hover:shadow-elevation hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <AudioLines size={18} />
                    Transcribe Audio
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 rounded-lg border border-saas-accent-red/30 bg-saas-accent-red/10 text-sm text-saas-accent-red">
                  {error}
                </div>
              )}
            </div>

            {/* Transcript Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-semibold text-saas-text-primary">
                  Transcript
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyTranscription()}
                    disabled={!transcription}
                    className="w-8 h-8 rounded-lg bg-saas-elevated border border-saas-border-subtle flex items-center justify-center text-saas-text-secondary hover:text-saas-accent-blue hover:border-saas-accent-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy to clipboard"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => downloadTranscript('txt')}
                    disabled={!transcription}
                    className="w-8 h-8 rounded-lg bg-saas-elevated border border-saas-border-subtle flex items-center justify-center text-saas-text-secondary hover:text-saas-accent-blue hover:border-saas-accent-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download TXT"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={() => downloadTranscript('srt')}
                    disabled={!transcription}
                    className="w-8 h-8 rounded-lg bg-saas-elevated border border-saas-border-subtle flex items-center justify-center text-saas-text-secondary hover:text-saas-accent-blue hover:border-saas-accent-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download SRT"
                  >
                    <FileText size={15} />
                  </button>
                  <button
                    onClick={clearTranscript}
                    disabled={!transcription}
                    className="w-8 h-8 rounded-lg bg-saas-elevated border border-saas-border-subtle flex items-center justify-center text-saas-text-secondary hover:text-saas-accent-red hover:border-saas-accent-red transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Clear"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="bg-saas-surface border border-saas-border-subtle rounded-[10px] p-6 min-h-[220px]">
                {loading ? (
                  <div className="flex items-center gap-3 text-saas-text-secondary">
                    <Loader2 size={18} className="animate-spin" />
                    Processing audio...
                  </div>
                ) : transcription ? (
                  <p className="text-[16px] leading-relaxed text-saas-text-primary whitespace-pre-wrap">
                    {transcription}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[220px] text-center">
                    <AudioLines size={32} className="text-saas-text-secondary mb-3" />
                    <p className="text-[14px] text-saas-text-secondary">
                      Your transcript will appear here
                    </p>
                    <p className="text-[12px] text-saas-text-muted mt-1">
                      Upload a file or start recording to begin
                    </p>
                  </div>
                )}
              </div>

              {transcription && (
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-xs text-saas-text-secondary bg-saas-elevated px-2 py-1 rounded">
                    {getWordCount()} words
                  </span>
                  <span className="text-xs text-saas-text-secondary bg-saas-elevated px-2 py-1 rounded">
                    {getDuration()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel - 300px */}
        <aside className="w-[300px] flex-shrink-0 bg-saas-surface border-l border-saas-border-subtle overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Status & Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${isBackendOnline ? "bg-saas-accent-emerald" : "bg-saas-accent-red"}`} />
                <span className="text-[13px] font-medium text-saas-text-primary">
                  {isBackendOnline ? "API Connected" : "API Offline"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-saas-text-primary">
                  {history.length}
                </span>
                <span className="text-[13px] text-saas-text-secondary">
                  transcriptions saved
                </span>
              </div>
            </div>

            {/* Export Options */}
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-saas-text-secondary mb-3">
                Export
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => downloadTranscript('txt')}
                  disabled={!transcription}
                  className="w-full h-[36px] bg-saas-elevated border border-saas-border-subtle rounded-lg text-[13px] font-medium text-saas-text-primary flex items-center justify-center gap-2 hover:border-saas-accent-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Download .TXT
                </button>
                <button
                  onClick={() => downloadTranscript('srt')}
                  disabled={!transcription}
                  className="w-full h-[36px] bg-saas-elevated border border-saas-border-subtle rounded-lg text-[13px] font-medium text-saas-text-primary flex items-center justify-center gap-2 hover:border-saas-accent-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText size={14} />
                  Download .SRT
                </button>
                <button
                  onClick={() => downloadTranscript('pdf')}
                  disabled={!transcription}
                  className="w-full h-[36px] bg-saas-elevated border border-saas-border-subtle rounded-lg text-[13px] font-medium text-saas-text-primary flex items-center justify-center gap-2 hover:border-saas-accent-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Download .PDF
                </button>
              </div>
            </div>

            {/* Audio Settings */}
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-saas-text-secondary mb-3">
                Settings
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-saas-text-primary">
                      Speaker Detection
                    </p>
                    <p className="text-[11px] text-saas-text-muted">
                      Identify multiple speakers
                    </p>
                  </div>
                  <button
                    onClick={() => setSpeakerDiarization(!speakerDiarization)}
                    className={`w-9 h-5 rounded-full transition-all ${
                      speakerDiarization
                        ? "bg-saas-accent-blue"
                        : "bg-saas-overlay"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-all ${
                        speakerDiarization ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-saas-text-primary">
                      Word Timestamps
                    </p>
                  </div>
                  <button
                    onClick={() => setWordTimestamps(!wordTimestamps)}
                    className={`w-9 h-5 rounded-full transition-all ${
                      wordTimestamps
                        ? "bg-saas-accent-blue"
                        : "bg-saas-overlay"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-all ${
                        wordTimestamps ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-saas-text-primary">
                      Auto-save transcripts
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoSave(!autoSave)}
                    className={`w-9 h-5 rounded-full transition-all ${
                      autoSave
                        ? "bg-saas-accent-blue"
                        : "bg-saas-overlay"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-all ${
                        autoSave ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
