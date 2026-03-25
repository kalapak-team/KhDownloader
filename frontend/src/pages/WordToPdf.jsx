import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { convertDocxToPdf } from "../services/api";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPT = ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// ── Drop zone ─────────────────────────────────────────────────────────────────

function DropZone({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={[
        "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 select-none",
        dragging
          ? "border-[#e8472a] bg-[rgba(232,71,42,0.08)]"
          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.04)]",
      ].join(" ")}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(232,71,42,0.12)] text-[#e8472a]">
        <Upload size={28} />
      </span>
      <div>
        <p className="text-base font-semibold text-textPrimary">
          Drop your Word file here or <span className="text-[#e8472a]">browse</span>
        </p>
        <p className="mt-1 text-sm text-textSecondary">DOC / DOCX files only · Max 50 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WordToPdf() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [downloadBlob, setDownloadBlob] = useState(null);
  const [downloadName, setDownloadName] = useState("");

  const handleFile = useCallback((f) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith(".doc") && !name.endsWith(".docx")) {
      toast.error("Only DOC and DOCX files are accepted");
      return;
    }
    setFile(f);
    setStatus("idle");
    setDownloadBlob(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setStatus("uploading");
    try {
      const { filename, data } = await convertDocxToPdf(file);
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
    try {
      const blob = downloadBlob;
      if (!blob || blob.size === 0) {
        toast.error("No file ready — please convert first");
        return;
      }

      const buffer = await blob.arrayBuffer();

      if (window.showSaveFilePicker) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: downloadName || "converted.pdf",
            types: [{ description: "PDF Document", accept: { "application/pdf": [".pdf"] } }],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(buffer);
          await writable.close();
          return;
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName || "converted.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.message || "Download failed");
    }
  };

  const handleReset = () => {
    setFile(null);
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
          Word to{" "}
          <span className="bg-gradient-to-r from-[#e8472a] to-[#ff7a52] bg-clip-text text-transparent">
            PDF
          </span>
        </h1>
        <p className="animate-fade-up-d1 mt-2 text-sm text-textSecondary">
          Make DOC and DOCX files easy to read by converting them to PDF.
        </p>
      </div>

      {/* Main card */}
      <div className="animate-fade-up-d1 mx-auto w-full max-w-xl rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6 backdrop-blur-md">
        {/* File selected info */}
        {file && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(232,71,42,0.12)] text-[#e8472a]">
              <FileText size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-textPrimary">{file.name}</p>
              <p className="text-xs text-textSecondary">{fmtSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-textSecondary transition hover:text-textPrimary"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Drop zone */}
        {(!file || status === "idle") && !file && <DropZone onFile={handleFile} />}
        {file && status === "idle" && <DropZone onFile={handleFile} />}

        {/* Converting */}
        {status === "uploading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={32} className="animate-spin text-[#e8472a]" />
            <p className="text-sm font-medium text-textPrimary">Converting…</p>
          </div>
        )}

        {/* Done */}
        {status === "done" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 size={40} className="text-[#30D158]" />
            <p className="text-base font-semibold text-textPrimary">Conversion complete!</p>
            <p className="text-sm text-textSecondary">Your PDF document is ready to download.</p>
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
              Convert another file
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertCircle size={36} className="text-[#FF453A]" />
            <p className="text-sm text-textSecondary">Something went wrong. Please try again.</p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] px-5 py-2.5 text-sm font-medium text-textPrimary transition hover:border-[rgba(232,71,42,0.4)]"
            >
              Try again
            </button>
          </div>
        )}

        {/* Convert button */}
        {file && status === "idle" && (
          <button
            type="button"
            onClick={handleConvert}
            className="mt-4 w-full rounded-xl bg-[#e8472a] py-3 text-sm font-semibold text-white transition hover:bg-[#ff5c3a] hover:shadow-[0_0_20px_rgba(232,71,42,0.35)]"
          >
            Convert to PDF
          </button>
        )}
      </div>

      {/* How it works */}
      <div className="animate-fade-up-d2 mx-auto w-full max-w-xl">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-textSecondary">
          How it works
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { step: "1", title: "Upload Word", desc: "Drag & drop or click to select your DOC/DOCX file." },
            { step: "2", title: "Convert", desc: "Your document is converted to a high-fidelity PDF." },
            { step: "3", title: "Download", desc: "Download your PDF file, ready to share anywhere." },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4"
            >
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(232,71,42,0.15)] text-xs font-bold text-[#e8472a]">
                {step}
              </span>
              <p className="text-sm font-semibold text-textPrimary">{title}</p>
              <p className="mt-0.5 text-xs text-textSecondary">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
