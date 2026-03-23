import clsx from "clsx";
import { CheckCircle2 } from "lucide-react";

export default function ProgressBar({ progress, speed, eta, status }) {
  return (
    <div className={clsx("grid gap-1.5", status === "failed" && "animate-shake-error")}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className={clsx(
            "h-full transition-all duration-300",
            status === "completed"
              ? "bg-[linear-gradient(135deg,#30D158,#3BE06A)]"
              : "animate-progress-pulse bg-gradient-to-r from-[#e8472a] to-[#ff7a52]",
          )}
          style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
        />
      </div>
      <div className="flex items-center gap-3 font-mono text-xs text-textSecondary">
        <span>{Math.round(progress || 0)}%</span>
        <span>{speed || "-"}</span>
        <span>{eta ? `${eta}s ETA` : "-"}</span>
        {status === "completed" && <CheckCircle2 size={16} className="text-success" />}
      </div>
    </div>
  );
}
