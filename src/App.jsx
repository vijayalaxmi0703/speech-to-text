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

// ================= BACKEND URL =================
const API_URL = "http://localhost:5000";

// ================= TOAST =================
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
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border bg-gradient-to-r backdrop-blur-xl shadow-2xl ${colors}`}
    >
      {type === "success" ? (
        <Check size={17} />
      ) : (
        <AlertCircle size={17} />
      )}

      <span className="text-sm font-medium">{message}</span>

      <button onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};

// ================= WAVEFORM =================
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

// ================= DROPZONE =================
const DropZone = ({ onFileSelect, selectedFile, onClear }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);

      const file = e.dataTransfer.files[0];

      if (file && file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !selectedFile && inputRef.current?.click()}
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
        ${
          selectedFile
            ? "border-violet-500/40 bg-violet-500/5"
            : dragging
            ? "border-violet-400 bg-violet-500/10"
            : "border-white/10 bg-white/[0.03]"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) =>
          e.target.files[0] && onFileSelect(e.target.files[0])
        }
      />

      {selectedFile ? (
        <div className="flex items-center gap-4 p-5">
          <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <FileAudio size={22} className="text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/90 truncate">
              {selectedFile.name}
            </p>

            <p className="text-xs text-white/40 mt-0.5">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Upload size={24} className="text-white/30" />
          </div>

          <div>
            <p className="text-sm font-medium text-white/70">
              Drop your audio file here
            </p>

            <p className="text-xs text-white/30 mt-1">
              MP3, WAV, WEBM supported
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= AUDIO PREVIEW =================
const AudioPreview = ({ src }) => (
  <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10">
    <Volume2 size={16} className="text-violet-400" />

    <audio src={src} controls className="flex-1 h-7" />
  </div>
);

// ================= MAIN APP =================
export default function App() {
  // ================= STATES =================
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);

  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [toast, setToast] = useState(null);

  const [copied, setCopied] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [serverStatus, setServerStatus] =
    useState("Checking backend...");

  // ================= REFS =================
  const mediaRecorderRef = useRef(null);

  const audioChunksRef = useRef([]);

  const timerRef = useRef(null);

  // ================= CHECK BACKEND =================
  useEffect(() => {
    axios
      .get(API_URL)
      .then(() => {
        setServerStatus("Backend Connected");
      })
      .catch(() => {
        setServerStatus("Backend Offline");
      });
  }, []);

  // ================= HELPERS =================
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
      s % 60
    ).padStart(2, "0")}`;

  // ================= FILE SELECT =================
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

  // ================= UPLOAD AUDIO =================
  const uploadAudio = async (audioFile) => {
    setLoading(true);

    setError(null);

    setTranscription("");

    const formData = new FormData();

    formData.append("audio", audioFile);

    try {
      const res = await axios.post(
        `${API_URL}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setTranscription(res.data.transcription || "");

      showToast("Transcription complete!", "success");
    } catch (err) {
      console.error(err);

      const msg =
        err.response?.data?.message ||
        "Upload failed. Please check backend.";

      setError(msg);

      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLE UPLOAD =================
  const handleUpload = () => {
    if (!selectedFile) {
      showToast("Please select audio first.", "error");
      return;
    }

    uploadAudio(selectedFile);
  };

  // ================= START RECORDING =================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

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

        setSelectedFile(audioFile);

        setAudioPreviewUrl(URL.createObjectURL(audioBlob));

        await uploadAudio(audioFile);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      setRecording(true);

      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);

      showToast(
        "Microphone access denied. Allow microphone permission.",
        "error"
      );
    }
  };

  // ================= STOP RECORDING =================
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();

    setRecording(false);

    clearInterval(timerRef.current);
  };

  // ================= COPY =================
  const copyTranscription = () => {
    navigator.clipboard.writeText(transcription);

    setCopied(true);

    showToast("Copied to clipboard!");

    setTimeout(() => setCopied(false), 2000);
  };

  // ================= RESET =================
  const reset = () => {
    handleClearFile();

    setRecording(false);

    setRecordingTime(0);

    setError(null);

    setTranscription("");

    clearInterval(timerRef.current);
  };

  // ================= CLEANUP =================
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // ================= UI =================
  return (
    <>
      <style>{`
        body {
          margin: 0;
          background: #080b14;
          font-family: sans-serif;
        }

        @keyframes wave {
          0%,100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080b14]">
        <div className="w-full max-w-2xl">

          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs mb-4">
              <Sparkles size={12} />
              AI Speech Recognition
            </div>

            <h1 className="text-5xl font-bold text-white">
              Voice to Text
            </h1>

            <p className="text-white/40 mt-3">
              Upload or record audio — get accurate transcriptions instantly.
            </p>

            {/* SERVER STATUS */}
            <p
              className={`text-xs mt-3 ${
                serverStatus === "Backend Connected"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {serverStatus}
            </p>
          </div>

          {/* CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 space-y-6">

            {/* UPLOAD */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-white/60 text-sm">
                <Upload size={14} />
                Upload Audio
              </div>

              <DropZone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleClearFile}
              />

              {audioPreviewUrl && !recording && (
                <AudioPreview src={audioPreviewUrl} />
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading || recording}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    Transcribe File
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* RECORD */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-white/60 text-sm">
                <Mic size={14} />
                Live Recording
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">

                <button
                  onClick={recording ? stopRecording : startRecording}
                  disabled={loading}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    recording
                      ? "bg-red-500"
                      : "bg-emerald-500"
                  }`}
                >
                  {recording ? (
                    <MicOff className="text-white" />
                  ) : (
                    <Mic className="text-white" />
                  )}
                </button>

                <div className="flex-1">
                  {recording ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-rose-300 font-semibold">
                          Recording...
                        </p>

                        <p className="text-white/40 text-xs">
                          {formatTime(recordingTime)}
                        </p>
                      </div>

                      <WaveformBars />
                    </div>
                  ) : (
                    <div>
                      <p className="text-white/70">
                        Ready to record
                      </p>

                      <p className="text-white/30 text-xs">
                        Click mic button
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* TRANSCRIPTION */}
            {(transcription || loading) && (
              <div className="border-t border-white/10 pt-6">

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">
                    Transcription
                  </h2>

                  {transcription && (
                    <button
                      onClick={copyTranscription}
                      className="text-xs text-white/60 hover:text-white flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check size={12} />
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

                <div className="p-4 rounded-xl bg-black/20 border border-white/10 text-white/80 text-sm min-h-[120px]">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Analyzing audio...
                    </div>
                  ) : (
                    transcription
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RESET */}
          {(selectedFile || transcription) && (
            <div className="flex justify-center mt-5">
              <button
                onClick={reset}
                className="flex items-center gap-2 text-white/40 hover:text-white text-sm"
              >
                <RotateCcw size={14} />
                Reset Everything
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}