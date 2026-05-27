import { useState, useRef, useCallback } from "react";
import { Upload, FileAudio, X } from "lucide-react";

export default function DropZone({ onFileSelect, selectedFile, onClear, disabled }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !disabled && !selectedFile && inputRef.current?.click()}
      className={`rounded-2xl transition-all duration-300 ${
        selectedFile
          ? "glass-soft shadow-md"
          : dragging
          ? "border border-cyan-400/20 bg-cyan-500/6 shadow-lg"
          : "border border-white/6 bg-transparent"
      } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"} p-1`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />

      {selectedFile ? (
        <div className="flex items-center gap-4 p-4">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-violet-500/12 text-violet-300">
            <FileAudio size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-white/40">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            className="rounded-lg bg-white/3 p-2 text-white/70 transition hover:bg-white/8"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-white/60">
          <div className="grid h-14 w-14 place-items-center rounded-lg border border-white/8 bg-white/3 text-white/40">
            <Upload size={22} />
          </div>
          <div>
            <p className="font-semibold">Drag & drop audio</p>
            <p className="mt-1 text-xs text-white/40">MP3, WAV, WEBM — up to 20MB</p>
          </div>
          <button className="mt-2 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-300/8 px-4 py-2 text-[12px] uppercase tracking-wide text-white/80 hover:from-violet-500/30 hover:to-cyan-300/12 transition">
            Browse files
          </button>
        </div>
      )}
    </div>
  );
}
