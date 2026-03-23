import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  GripVertical,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { mergePdfs } from "../services/api";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

function DropZone({ onFiles, hasFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (list) => {
      const valid = Array.from(list).filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
      );
      if (!valid.length) { toast.error("Only PDF files are accepted"); return; }
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
          {hasFiles ? "Add more PDFs or " : "Drop PDF files here or "}
          <span className="text-[#e8472a]">browse</span>
        </p>
        <p className="mt-1 text-sm text-textSecondary">PDF files only · Max 50 MB each · Up to 20 files</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

// ── File row ─────────────────────────────────────────────────────────────────

function FileRow({ file, index, total, onRemove, onMoveUp, onMoveDown, dragHandleProps }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      {/* drag handle */}
      <span
        {...dragHandleProps}
        className="cursor-grab touch-none text-[rgba(255,255,255,0.25)] hover:text-textSecondary active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </span>
      {/* number badge */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(232,71,42,0.15)] text-[10px] font-bold text-[#e8472a]">
        {index + 1}
      </span>
      {/* name + size */}
      <span className="min-w-0 flex-1 truncate text-sm text-textPrimary">{file.name}</span>
      <span className="shrink-0 text-xs text-textSecondary">{fmtSize(file.size)}</span>
      {/* up/down buttons */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded-lg border border-[rgba(255,255,255,0.07)] px-2 py-1 text-xs text-textSecondary transition-colors hover:border-[rgba(232,71,42,0.3)] hover:text-textPrimary disabled:pointer-events-none disabled:opacity-25"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="rounded-lg border border-[rgba(255,255,255,0.07)] px-2 py-1 text-xs text-textSecondary transition-colors hover:border-[rgba(232,71,42,0.3)] hover:text-textPrimary disabled:pointer-events-none disabled:opacity-25"
        >
          ↓
        </button>
      </div>
      {/* remove */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-lg p-1 text-[rgba(255,255,255,0.3)] transition-colors hover:bg-[rgba(232,71,42,0.1)] hover:text-[#e8472a]"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MergePdf() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | merging | done | error
  const [downloadBlob, setDownloadBlob] = useState(null);
  const [downloadName, setDownloadName] = useState("");

  // drag-to-reorder state
  const dragIdx = useRef(null);

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

  const moveFile = (idx, dir) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setDownloadBlob(null);
    setStatus("idle");
  };

  // HTML5 drag-to-reorder handlers
  const onDragStart = (idx) => { dragIdx.current = idx; };
  const onDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
  };
  const onDragEnd = () => { dragIdx.current = null; };

  const handleMerge = async () => {
    if (files.length < 2) { toast.error("Add at least 2 PDF files to merge"); return; }
    setStatus("merging");
    setDownloadBlob(null);
    try {
      const { filename, data } = await mergePdfs(files);
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      setDownloadBlob(blob);
      setDownloadName(filename);
      setStatus("done");
      toast.success("PDFs merged successfully!");
    } catch (err) {
      toast.error(err?.message || "Merge failed");
      setStatus("error");
    }
  };

  const handleDownload = async () => {
    if (!downloadBlob || downloadBlob.size === 0) { toast.error("No file ready — please merge first"); return; }
    const buffer = await downloadBlob.arrayBuffer();

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: downloadName || "merged.pdf",
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

    const url = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName || "merged.pdf";
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
          <FilePlus2 size={28} />
        </span>
        <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight">
          Merge{" "}
          <span className="bg-gradient-to-r from-[#e8472a] to-[#ff7a52] bg-clip-text text-transparent">
            PDF
          </span>
        </h1>
        <p className="animate-fade-up-d1 mt-2 text-sm text-textSecondary">
          Combine PDFs in the order you want with the easiest PDF merger available.
        </p>
      </div>

      {/* Drop zone */}
      <div className="animate-fade-up-d2 mx-auto w-full max-w-2xl">
        <DropZone onFiles={addFiles} hasFiles={files.length > 0} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="animate-fade-up mx-auto w-full max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-textSecondary">
            {files.length} file{files.length !== 1 ? "s" : ""} · drag rows to reorder
          </p>
          <div className="flex flex-col gap-2">
            {files.map((file, idx) => (
              <div
                key={file.name + file.size}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
              >
                <FileRow
                  file={file}
                  index={idx}
                  total={files.length}
                  onRemove={() => removeFile(idx)}
                  onMoveUp={() => moveFile(idx, -1)}
                  onMoveDown={() => moveFile(idx, 1)}
                  dragHandleProps={{}}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action area */}
      <div className="animate-fade-up-d3 mx-auto w-full max-w-2xl">
        {status === "idle" || status === "error" ? (
          <button
            type="button"
            onClick={handleMerge}
            disabled={files.length < 2}
            className="w-full rounded-2xl bg-[#e8472a] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ff5c3a] hover:shadow-[0_0_20px_rgba(232,71,42,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {files.length < 2
              ? `Add at least ${2 - files.length} more PDF${2 - files.length !== 1 ? "s" : ""}`
              : `Merge ${files.length} PDFs into one`}
          </button>
        ) : status === "merging" ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.07)] py-3.5 text-sm text-textSecondary">
            <Loader2 size={18} className="animate-spin text-[#e8472a]" />
            Merging PDFs…
          </div>
        ) : status === "done" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.07)] px-5 py-3 text-sm text-[#4ade80]">
              <CheckCircle2 size={16} />
              Merge complete — your PDF is ready!
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 rounded-2xl bg-[#e8472a] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ff5c3a] hover:shadow-[0_0_20px_rgba(232,71,42,0.35)]"
              >
                Download merged PDF
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-2xl border border-[rgba(255,255,255,0.1)] px-5 py-3.5 text-sm text-textSecondary transition-colors hover:border-[rgba(232,71,42,0.3)] hover:text-textPrimary"
              >
                Start over
              </button>
            </div>
          </div>
        ) : null}

        {status === "error" && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.07)] px-5 py-3 text-sm text-[#f87171]">
            <AlertCircle size={16} />
            Merge failed. Please check your files and try again.
          </div>
        )}
      </div>

      {/* How it works */}
      <section className="animate-fade-up-d4 mx-auto w-full max-w-2xl">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-textSecondary">
          How it works
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", title: "Upload PDFs", desc: "Drag & drop or click to select two or more PDF files." },
            { n: "2", title: "Order them", desc: "Drag rows or use the ↑ ↓ buttons to set the merge order." },
            { n: "3", title: "Download", desc: "Click Merge and save the combined PDF to your device." },
          ].map(({ n, title, desc }) => (
            <div
              key={n}
              className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-5"
            >
              <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(232,71,42,0.18)] text-xs font-bold text-[#e8472a]">
                {n}
              </span>
              <p className="text-sm font-semibold text-textPrimary">{title}</p>
              <p className="mt-1 text-xs text-textSecondary">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
