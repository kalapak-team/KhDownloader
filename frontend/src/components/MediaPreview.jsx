import { Eye, Timer } from "lucide-react";

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return "--:--";
  const s = Number(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  return `${m}:${String(rem).padStart(2, "0")}`;
};

const detectPlatform = (url) => {
  if (!url) return "Web";
  if (url.includes("youtube") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("soundcloud")) return "SoundCloud";
  if (url.includes("vimeo")) return "Vimeo";
  if (url.includes("twitter") || url.includes("x.com")) return "Twitter/X";
  if (url.includes("instagram")) return "Instagram";
  return "Web";
};

export default function MediaPreview({ mediaInfo, sourceUrl }) {
  if (!mediaInfo) return null;

  return (
    <section className="animate-reveal grid items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-4 backdrop-blur-md md:grid-cols-[220px_1fr]">
      <img
        src={mediaInfo.thumbnail}
        alt={mediaInfo.title}
        loading="lazy"
        className="h-[126px] w-full rounded-xl object-cover"
      />
      <div>
        <span className="inline-block rounded-full border border-[rgba(232,71,42,0.35)] bg-[rgba(232,71,42,0.12)] px-2.5 py-1 text-xs text-[#FF8F87]">
          {detectPlatform(sourceUrl)}
        </span>
        <h3 className="line-clamp-two mt-2 text-lg font-semibold">{mediaInfo.title}</h3>
        <p className="mt-1.5 text-sm text-textSecondary">{mediaInfo.uploader || "Unknown uploader"}</p>
        <div className="mt-2.5 flex gap-3 text-xs text-textSecondary md:text-sm">
          <span className="inline-flex items-center gap-1.5 font-mono">
            <Timer size={14} /> {formatDuration(mediaInfo.duration)}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono">
            <Eye size={14} /> {(mediaInfo.view_count || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
}
