import { Clipboard, Link as LinkIcon, Loader2 } from "lucide-react";
import { useMemo } from "react";

export default function UrlInput({ value, onChange, onSubmit, loading }) {
  const urlValid = useMemo(() => {
    if (!value) return null;
    try {
      // eslint-disable-next-line no-new
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, [value]);

  const pasteFromClipboard = async () => {
    const text = await navigator.clipboard.readText();
    onChange(text);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-1.5 backdrop-blur-md transition-all duration-200 focus-within:border-[rgba(232,71,42,0.5)] focus-within:shadow-[0_0_0_3px_rgba(232,71,42,0.1),0_0_24px_rgba(232,71,42,0.08)]">
        <div className="flex flex-1 items-center gap-2.5 px-3">
          <LinkIcon size={16} className="shrink-0 text-textSecondary" />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            className="h-11 w-full border-none bg-transparent font-mono text-sm text-textPrimary placeholder-[#55556A] outline-none"
            placeholder="Paste a YouTube, TikTok, Vimeo, or any media URL..."
          />
          <span
            className={[
              "h-2 w-2 shrink-0 rounded-full transition-colors duration-300",
              urlValid === null ? "bg-[#44445A]" : urlValid ? "bg-success" : "bg-danger",
            ].join(" ")}
          />
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.09)] bg-transparent px-4 text-sm text-textSecondary transition-all duration-200 hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.04)] hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
          onClick={pasteFromClipboard}
          type="button"
        >
          <Clipboard size={14} />
          <span className="hidden sm:inline">Paste</span>
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#e8472a] px-5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-[#ff5c3a] hover:shadow-[0_0_20px_rgba(232,71,42,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSubmit}
          disabled={!urlValid || loading}
          type="button"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : "Fetch"}
        </button>
      </div>
    </div>
  );
}
