import { FileText, Copy, Trash2 } from "lucide-react";

export default function HistoryCard({ entry, onCopy, onDelete, deleting }) {
  return (
    <article className="group rounded-2xl glass-soft p-4 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/10 text-violet-300">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{entry.filename}</p>
            <p className="mt-0.5 text-xs text-white/40">{entry.createdAt}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCopy(entry.transcription)}
            className="rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-xs text-white/70 transition hover:bg-white/6"
          >
            <Copy size={14} className="inline-block mr-1" /> Copy
          </button>

          <button
            type="button"
            onClick={() => onDelete(entry._id)}
            disabled={deleting}
            className="rounded-lg border border-white/8 bg-rose-500/8 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/16 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={14} className="inline-block mr-1" />
            {deleting ? "Removing" : "Delete"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70 line-clamp-4">
        {entry.transcription || "No transcription available."}
      </p>
    </article>
  );
}
