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
  Camera,
  CameraOff,
  Video,
  VideoOff,
  Square,
  AlertTriangle,
} from "lucide-react";

import Toast from "../components/Toast.jsx";
import DropZone from "../components/DropZone.jsx";
import Waveform from "../components/Waveform.jsx";
import AudioPreview from "../components/AudioPreview.jsx";
import { useAuth } from "../utils/context/AuthContext.jsx";

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
  console.log("Dashboard Rendered");

  const [selectedFile, setSelectedFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [isFileTranscribing, setIsFileTranscribing] = useState(false);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
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
  const [recordedAudioFile, setRecordedAudioFile] = useState(null);

  // Camera & Subtitle State
  const [cameraOn, setCameraOn] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [liveSubtitle, setLiveSubtitle] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [subtitlesUnavailable, setSubtitlesUnavailable] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  const { user, logout } = useAuth();
  console.log("Dashboard rendered, user:", user);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    console.log("Dashboard useEffect running");
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

    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!mediaStream || !videoRef.current) return;
    const video = videoRef.current;
    if (video.srcObject === mediaStream) {
      console.log('Stream already attached, skipping');
      return;
    }

    console.log('Attaching stream to video (useEffect)');
    video.srcObject = mediaStream;
    video.muted = true;
    video.playsInline = true;

    const play = () => video.play().catch(e => console.error('play:', e));
    if (video.readyState >= 1) {
      play();
    } else {
      video.onloadedmetadata = play;
    }

    return () => { video.onloadedmetadata = null; };
  }, [mediaStream]);

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
      if (serverStatus !== "Backend Offline") {
        showToast("Unable to fetch history. Check the backend.", "error");
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const uploadAudio = async (audioFile, setLoadingState) => {
    setLoadingState(true);
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
      setLoadingState(false);
    }
  };

  const handleFileTranscribe = async () => {
    if (!selectedFile) return;
    await uploadAudio(selectedFile, setIsFileTranscribing);
  };

  const handleLiveTranscribe = async () => {
    if (!recordedAudioFile) {
      showToast("Please record audio first.", "error");
      return;
    }
    await uploadAudio(recordedAudioFile, setIsLiveTranscribing);
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

    handleFileTranscribe();
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

  const checkSupport = () => {
    const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia);
    const hasSpeechAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasMediaRecorder = !!(window.MediaRecorder);

    if (!hasGetUserMedia) {
      setCameraError('not_supported');
      return false;
    }
    if (!hasSpeechAPI) {
      setSubtitlesUnavailable(true);
      console.warn('Web Speech API not supported — subtitles unavailable');
    }
    return true;
  };

  const startSpeechRecognition = (audioStream) => {
    console.log("SpeechRecognition exists:", !!window.webkitSpeechRecognition || !!window.SpeechRecognition);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSubtitlesUnavailable(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage === 'Auto Detect' ? 'en-US' : selectedLanguage;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log("LIVE TRANSCRIPT:", transcript);
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      const subtitleText = interim || final.trim().split(' ').slice(-8).join(' ');
      setLiveSubtitle(subtitleText);

      if (final) {
        setFinalTranscript(prev => prev + final);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') {
        // Speech recognition error - handled silently
      }
    };

    recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const startLiveSubtitles = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return; // silently skip if browser doesn't support it

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      // Show only last 10 words
      const words = text.trim().split(' ');
      setLiveSubtitle(words.slice(-10).join(' '));
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.warn('Speech recognition:', e.error);
    };

    recognition.onend = () => {
      // Restart if still recording
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) {}
  };

  const startSubtitles = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setLiveSubtitle(text.trim().split(' ').slice(-10).join(' '));
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.warn('Speech recognition error:', e.error);
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) {}
  };

  const startRecording = async () => {
    console.log("START RECORDING");

    
    // Request mic + camera together in one call  
    let stream;
    try {
      console.log("Requesting audio: true, video: true");
      stream = await navigator.mediaDevices.getUserMedia({
         audio: {
           echoCancellation: true,
           noiseSuppression: true,
           autoGainControl: true
         },
         video: {
           facingMode: "user"
         }
       });
      console.log("STREAM ACQUIRED");
      console.log("VIDEO TRACKS:", stream.getVideoTracks().length);
      console.log("AUDIO TRACKS:", stream.getAudioTracks().length);
    } catch (e1) {
      console.error("AUDIO+VIDEO FAILED:", e1.name, e1.message);
      // Camera failed or not present — try audio only
      try {
        console.log("Trying audio only");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        console.log("AUDIO-ONLY STREAM ACQUIRED");
      } catch (e2) {
        console.error("AUDIO-ONLY FAILED:", e2.name, e2.message);
        showToast(`Error: ${e2.name} - ${e2.message}`, 'error');
        return;
      }
    }

    streamRef.current = stream;
    setMediaStream(stream);
    audioChunksRef.current = [];

    // Set recording state FIRST so video element mounts in DOM
    setRecording(true);
    setRecordingTime(0);
    setLiveSubtitle('');
    setFinalTranscript('');

    const hasVideo = stream.getVideoTracks().length > 0;
    if (hasVideo) {
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().catch(e => console.error('play:', e));
      }
    }

    // MediaRecorder on audio tracks only
    const audioOnly = new MediaStream(stream.getAudioTracks());
    const recorder = new MediaRecorder(audioOnly, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      setRecordedAudioFile(audioFile);
      setSelectedFile(audioFile);
      setAudioPreviewUrl(URL.createObjectURL(blob));
    };

    recorder.start(250);
    timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);

    // Start live subtitles
   const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    let interim = '';
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t + ' ';
      else interim += t;
    }
    setLiveSubtitle((interim || final).trim());
    if (final) setFinalTranscript(prev => prev + final);
  };

  recognition.onerror = (e) => {
    // If permission denied — kill restart loop completely
    if (e.error === 'not-allowed') {
      recognitionRef.current = null;
      return;
    }
    if (e.error !== 'no-speech') console.warn('SR error:', e.error);
  };

  // KEY FIX — 500ms delay + active recording check stops the popup loop
  recognition.onend = () => {
    if (recognitionRef.current !== recognition) return;
    setTimeout(() => {
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch(e) {}
      }
    }, 500);
  };

  recognitionRef.current = recognition;
  try { recognition.start(); } catch(e) {}
    }
  };

  const stopRecording = () => {
    console.log("STOP RECORDING");
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      console.log("Clearing video srcObject");
      videoRef.current.srcObject = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    clearInterval(timerRef.current);
    setRecording(false);
    setCameraOn(false);
    setMicMuted(false);
    setLiveSubtitle('');
    setMediaStream(null);
    if (finalTranscript.trim()) setTranscription(finalTranscript.trim());
    console.log("STOP RECORDING COMPLETE");
  };

  const toggleCamera = () => {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCameraOn(prev => !prev);
  };

  const toggleMic = () => {
  if (!streamRef.current) return;

  const newState = !micMuted;

  streamRef.current.getAudioTracks().forEach(t => {
    t.enabled = !newState;
  });

  setMicMuted(newState);
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

  console.log("Rendering dashboard UI");

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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <AudioLines size={16} className="text-saas-text-secondary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-saas-text-primary">
                            {item.filename || `Recording ${item._id?.slice(-6)}`}
                          </p>
                          <p className="text-xs text-saas-text-secondary">
                            {item.relativeTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                    {item.transcription && (
                      <p className="text-xs text-saas-text-secondary mt-2 line-clamp-3 break-words">
                        {item.transcription}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-saas-elevated flex items-center justify-center mx-auto mb-3">
                    <AudioLines size={24} className="text-saas-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-saas-text-primary mb-1">No transcriptions yet</p>
                  <p className="text-xs text-saas-text-muted">Upload audio or start recording to begin</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-saas-border-subtle">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-saas-border-subtle bg-saas-surface hover:bg-saas-surface-hover hover:border-saas-border-hover hover:shadow-sm text-sm font-medium text-saas-text-primary transition-all duration-200 group"
            >
              <LogOut size={16} className="group-hover:text-red-500 transition-colors" />
              <span>Logout</span>
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
                disabled={isFileTranscribing || recording}
              />

              {audioPreviewUrl && !recording && (
                <div className="mt-4">
                  <AudioPreview src={audioPreviewUrl} />
                </div>
              )}

              {/* Transcribe Audio Button (after Audio Preview) */}
              {audioPreviewUrl && !recording && (
                <button
                  onClick={handleFileTranscribe}
                  disabled={!selectedFile || isFileTranscribing || recording || !isBackendOnline}
                  className="w-full h-[44px] mt-4 bg-grad-primary text-white font-semibold text-[15px] rounded-lg hover:-translate-y-1 hover:shadow-elevation hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isFileTranscribing ? (
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
              )}

              {/* Recording Section */}
              <div className="mt-4 bg-saas-surface border border-saas-border-subtle rounded-[10px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-saas-accent-blue flex items-center justify-center">
                      <Mic size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-saas-text-primary">Live Recording</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-xs text-saas-text-secondary">
                          {recording ? `Recording • ${formatTime(recordingTime)}` : 'Ready'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={isFileTranscribing || isLiveTranscribing}
                    className="w-10 h-10 rounded-full bg-saas-accent-blue flex items-center justify-center text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {recording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>

                {recording && (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    minHeight: '240px',
                    backgroundColor: '#0A0F1E',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #1E2D4A',
                    marginBottom: '16px'
                  }}>
                  <video
                    ref={el => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        console.log('Attaching stream to video (callback ref)');
                        el.srcObject = streamRef.current;
                        el.muted = true;
                        el.playsInline = true;
                        el.play().catch(e => console.error('play:', e));
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      display: 'block',
                      opacity: cameraOn ? 1 : 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)'
                    }}
                  />

                  {!cameraOn && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: '12px',
                      backgroundColor: '#0F1629'
                    }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        backgroundColor: '#141D35',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 600, color: '#64748B'
                      }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span style={{ color: '#64748B', fontSize: 14 }}>Camera Off</span>
                    </div>
                  )}

                  {/* REC badge */}
                  <div style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 6, padding: '4px 10px'
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      animation: 'pulse 1.2s infinite'
                    }} />
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>REC</span>
                  </div>

                  {/* Subtitle overlay */}
                  {liveSubtitle && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '10px 16px 14px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',
                      display: 'flex', justifyContent: 'center', pointerEvents: 'none'
                    }}>
                      <span style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500,
                        color: '#ffffff', background: 'rgba(0,0,0,0.55)',
                        padding: '4px 14px', borderRadius: 6,
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        maxWidth: '90%', textAlign: 'center'
                      }}>
                        {liveSubtitle}
                      </span>
                    </div>
                  )}
                </div>
                )}

                {recording && (
                  <div>
                    {/* Control Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                      <button
                        onClick={toggleMic}
                        style={{
                          height: 40, padding: '0 16px',
                          backgroundColor: '#141D35', border: '1px solid #1E2D4A',
                          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                          cursor: 'pointer', color: '#F1F5F9'
                        }}
                      >
                        {micMuted
                          ? <><MicOff size={16} color="#ef4444" /><span style={{ fontSize: 12 }}>Mic Muted</span></>
                          : <><Mic size={16} color="#3B82F6" /><span style={{ fontSize: 12 }}>Mic On</span></>
                        }
                      </button>
                      <button
                        onClick={toggleCamera}
                        style={{
                          height: 40, padding: '0 16px',
                          backgroundColor: '#141D35', border: '1px solid #1E2D4A',
                          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                          cursor: 'pointer', color: '#F1F5F9'
                        }}
                      >
                        {cameraOn
                          ? <><Camera size={16} color="#3B82F6" /><span style={{ fontSize: 12 }}>Camera On</span></>
                          : <><CameraOff size={16} color="#64748B" /><span style={{ fontSize: 12 }}>Camera Off</span></>
                        }
                      </button>
                      <button
                        onClick={stopRecording}
                        style={{
                          height: 40, padding: '0 20px',
                          backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                          cursor: 'pointer'
                        }}
                      >
                        <Square size={16} color="#ef4444" />
                        <span style={{ fontSize: 12, color: '#ef4444' }}>Stop Recording</span>
                      </button>
                    </div>

                    {/* Waveform bars — no vertical lines */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 32 }}>
                      {[16, 24, 32, 24, 16].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            width: 4, height: h, borderRadius: 999,
                            backgroundColor: '#3B82F6',
                            animation: 'pulse 1s ease-in-out infinite',
                            animationDelay: `${i * 0.12}s` 
                          }}
                        />
                      ))}
                    </div>
                    
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
                onClick={handleLiveTranscribe}
                disabled={!recordedAudioFile || isLiveTranscribing || recording || !isBackendOnline}
                className="w-full h-[44px] mt-4 bg-grad-primary text-white font-semibold text-[15px] rounded-lg hover:-translate-y-1 hover:shadow-elevation hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {isLiveTranscribing ? (
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
                {isFileTranscribing || isLiveTranscribing ? (
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