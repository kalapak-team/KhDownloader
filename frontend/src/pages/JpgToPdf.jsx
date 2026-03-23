import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Monitor,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { convertJpgToPdf } from "../services/api";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED = ".jpg,.jpeg,.png,.webp,.bmp";
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/bmp"];
const MARGINS = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

// ── Drop zone ─────────────────────────────────────────────────────────────────

function DropZone({ onFiles, hasFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (list) => {
      const valid = Array.from(list).filter(
        (f) => ACCEPTED_MIME.includes(f.type) || f.name.match(/\.(jpe?g|png|webp|bmp)$/i),
      );
      if (!valid.length) { toast.error("Only JPG, PNG, WebP or BMP images are accepted"); return; }
      onFiles(valid);
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={[
        "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-7 sm:p-10 text-center transition-all duration-200 select-none",
        dragging
          ? "border-[#e8472a] bg-[rgba(232,71,42,0.08)]"
          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.04)]",
      ].join(" ")}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(232,71,42,0.12)] text-[#e8472a]">
        <Upload size={26} />
      </span>
      <div>
        <p className="text-base font-semibold text-textPrimary">
          {hasFiles ? "Add more images or " : "Drop images here or "}
          <span className="text-[#e8472a]">browse</span>
        </p>
        <p className="mt-1 text-sm text-textSecondary">JPG, PNG, WebP, BMP · Max 20 MB each · Up to 50 files</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

// ── Option button ─────────────────────────────────────────────────────────────

function OptionBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "border-[#e8472a] bg-[rgba(232,71,42,0.14)] text-[#e8472a]"
          : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-textSecondary hover:border-[rgba(232,71,42,0.3)] hover:text-textPrimary",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JpgToPdf() {
  const [files, setFiles] = useState([]);
  const [orientation, setOrientation] = useState("portrait");
  const [margin, setMargin] = useState("small");
  const [status, setStatus] = useState("idle"); // idle | converting | done | error
  const [downloadBlob, setDownloadBlob] = useState(null);
  const [downloadName, setDownloadName] = useState("");

  const addFiles = useCallback((incoming) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const deduped = incoming.filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...deduped];
    });
    setStatus("idle");
    setDownloadBlob(null);
  }, []);

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setDownloadBlob(null);
    setStatus("idle");
  };

  const handleConvert = async () => {
    if (!files.length) return;
    setStatus("converting");
    setDownloadBlob(null);
    try {
      const { filename, data } = await convertJpgToPdf(files, orientation, margin);
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      setDownloadBlob(blob);
      setDownloadName(filename);
      setStatus("done");
      toast.success("Conversion complete!");
    } catch (err) {
      toast.error(err?.message || "Conversion failed");
      setStatus("error");
    }
  };

  const handleDownload = async () => {
    if (!downloadBlob || downloadBlob.size === 0) { toast.error("No file ready — please convert first"); return; }
    const buffer = await downloadBlob.arrayBuffer();

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: downloadName || "images.pdf",
          types: [{ description: "PDF Document", accept: { "application/pdf": [".pdf"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(buffer);
        await writable.close();
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }

    // Fallback
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName || "images.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setDownloadBlob(null);
  };

  return (
    <div className="grid gap-6 py-10 pb-16">
      {/* Header */}
      <div className="animate-fade-up text-center">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(232,71,42,0.12)] text-[#e8472a]">
          <FileText size={28} />
        </span>
        <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight">
          JPG to{" "}
          <span className="bg-gradient-to-r from-[#e8472a] to-[#ff7a52] bg-clip-text text-transparent">
            PDF
          </span>
        </h1>
        <p className="animate-fade-up-d1 mt-2 text-sm text-textSecondary">
          Convert JPG images to PDF in seconds. Easily adjust orientation and margins.
        </p>
      </div>

      {/* Main card */}
      <div className="animate-fade-up-d1 mx-auto w-full max-w-xl rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6 backdrop-blur-md">

        {/* Drop zone */}
        {status !== "converting" && (
          <DropZone onFiles={addFiles} hasFiles={files.length > 0} />
        )}

        {/* File list */}
        {files.length > 0 && status !== "converting" && (
          <div className="mt-4 flex flex-col gap-2">
            {files.map((f, i) => (
              <div
                key={f.name + f.size}
                className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-3 py-2"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(232,71,42,0.12)] text-[#e8472a] text-xs font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-textPrimary">{f.name}</p>
                  <p className="text-xs text-textSecondary">{fmtSize(f.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-textSecondary transition hover:text-textPrimary"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Options */}
        {files.length > 0 && status !== "converting" && (
          <div className="mt-5 grid gap-4">
            {/* Orientation */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-textSecondary">Orientation</p>
              <div className="flex gap-2">
                <OptionBtn active={orientation === "portrait"} onClick={() => setOrientation("portrait")}>
                  <span className="inline-flex items-center gap-1.5"><Smartphone size={14} /> Portrait</span>
                </OptionBtn>
                <OptionBtn active={orientation === "landscape"} onClick={() => setOrientation("landscape")}>
                  <span className="inline-flex items-center gap-1.5"><Monitor size={14} /> Landscape</span>
                </OptionBtn>
              </div>
            </div>

            {/* Margin */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-textSecondary">Margin</p>
              <div className="flex gap-2">
                {MARGINS.map((m) => (
                  <OptionBtn key={m.value} active={margin === m.value} onClick={() => setMargin(m.value)}>
                    {m.label}
                  </OptionBtn>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Converting spinner */}
        {status === "converting" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 size={32} className="animate-spin text-[#e8472a]" />
            <p className="text-sm font-medium text-textPrimary">Converting {files.length} image{files.length !== 1 ? "s" : ""}…</p>
          </div>
        )}

        {/* Done */}
        {status === "done" && (
          <div className="mt-5 flex flex-col items-center gap-4 py-4">
            <CheckCircle2 size={40} className="text-[#30D158]" />
            <p className="text-base font-semibold text-textPrimary">Conversion complete!</p>
            <p className="text-sm text-textSecondary">Your PDF is ready to download.</p>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl bg-[#e8472a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff5c3a] hover:shadow-[0_0_16px_rgba(232,71,42,0.4)]"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-textSecondary transition hover:text-textPrimary"
            >
              Convert more images
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="mt-5 flex flex-col items-center gap-4 py-4">
            <AlertCircle size={36} className="text-[#FF453A]" />
            <p className="text-sm text-textSecondary">Something went wrong. Please try again.</p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="rounded-xl border border-[rgba(255,255,255,0.1)] px-5 py-2 text-sm text-textSecondary transition hover:text-textPrimary"
            >
              Try again
            </button>
          </div>
        )}

        {/* Convert button */}
        {files.length > 0 && status === "idle" && (
          <button
            type="button"
            onClick={handleConvert}
            className="mt-5 w-full rounded-xl bg-[#e8472a] py-3 text-sm font-semibold text-white transition hover:bg-[#ff5c3a] hover:shadow-[0_0_20px_rgba(232,71,42,0.35)]"
          >
            Convert {files.length} image{files.length !== 1 ? "s" : ""} to PDF
          </button>
        )}
      </div>
    </div>
  );
}
