import { ArrowDownToLine } from "lucide-react";

export default function DownloadButton({ onClick, disabled }) {
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#e8472a] px-6 py-4 text-base font-semibold text-white shadow-[0_4px_24px_rgba(232,71,42,0.3)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#ff5c3a] hover:shadow-[0_4px_32px_rgba(232,71,42,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <ArrowDownToLine size={18} />
      Download Now
    </button>
  );
}
