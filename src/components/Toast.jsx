import { useEffect } from "react";
import { Check, AlertCircle, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const theme =
    type === "success"
      ? "from-emerald-500/20 to-emerald-500/10 border-emerald-400/30 text-emerald-100"
      : "from-rose-500/20 to-red-500/10 border-rose-400/30 text-rose-100";

  return (
    <div
      className={`toast-enter fixed right-5 top-5 z-50 flex max-w-sm items-center gap-3 rounded-3xl border px-4 py-3 bg-gradient-to-r backdrop-blur-3xl shadow-2xl ${theme}`}
    >
      {type === "success" ? (
        <Check size={18} className="text-current" />
      ) : (
        <AlertCircle size={18} className="text-current" />
      )}

      <p className="text-sm leading-5">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1 transition hover:bg-white/10"
      >
        <X size={16} />
      </button>
    </div>
  );
}
