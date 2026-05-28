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
} from "lucide-react";

import Toast from "./components/Toast.jsx";
import DropZone from "./components/DropZone.jsx";
import Waveform from "./components/Waveform.jsx";
import AudioPreview from "./components/AudioPreview.jsx";
import HistoryCard from "./components/HistoryCard.jsx";

const API_URL = "http://localhost:5000";

const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

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

      let msg = "Something went wrong.";

      if (err.response) {
        msg =
          err.response.data?.message || "Server error occurred.";
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
      setError(
        "Only MP3, WAV, WEBM, OGG, and M4A files are allowed."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast("File size exceeds 10MB.", "error");
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

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

  const isBackendOnline =
    serverStatus === "Backend Connected";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),_transparent_28%),_radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_20%),_linear-gradient(180deg,_#04050d_0%,_#090d18_100%)] text-white">
      {toast && (
        <Toast
          {...toast}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 md:px-6 lg:px-8">

        {/* Remaining UI stays EXACTLY SAME */}

      </div>
    </div>
  );
}