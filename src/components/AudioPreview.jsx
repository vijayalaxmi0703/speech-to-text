import { Volume2 } from "lucide-react";

export default function AudioPreview({ src }) {
  return (
    <div className="mt-4 rounded-2xl glass-soft p-4">
      <div className="flex items-center gap-3 text-white/70">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/10 text-violet-300">
          <Volume2 size={18} />
        </div>
        <div>
          <div className="text-sm font-medium">Audio Preview</div>
          <div className="text-xs text-white/40">Playback controls</div>
        </div>
      </div>

      <audio
        className="mt-4 w-full rounded-lg bg-white/3 p-2"
        controls
        src={src}
      />
    </div>
  );
}
