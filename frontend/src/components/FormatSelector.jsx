const audioExts = ["mp3", "m4a", "ogg", "opus", "wav"];
const videoExts = ["mp4", "webm", "mkv"];
const audioQualities = ["320", "256", "192", "128", "96"];

export default function FormatSelector({
  format,
  setFormat,
  quality,
  setQuality,
  ext,
  setExt,
  availableVideoHeights,
}) {
  const qualityOptions =
    format === "audio"
      ? audioQualities.map((q) => ({ label: `${q} kbps`, value: q }))
      : (availableVideoHeights.length ? availableVideoHeights : [2160, 1440, 1080, 720, 480, 360]).map((q) => ({
          label: `${q}p`,
          value: String(q),
        }));

  const extOptions = format === "audio" ? audioExts : videoExts;

  const baseChip =
    "rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-textSecondary transition-all duration-200";
  const activeChip = "border-[rgba(232,71,42,0.55)] bg-[rgba(232,71,42,0.12)] text-textPrimary";

  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-md">
      <div>
        <h4 className="mb-2.5 text-base">Type</h4>
        <div className="flex flex-wrap gap-2">
          {["audio", "video"].map((opt) => (
            <button
              key={opt}
              type="button"
              className={`${baseChip} ${format === opt ? activeChip : "hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.07)] hover:text-textPrimary"}`}
              onClick={() => {
                setFormat(opt);
                setExt(opt === "audio" ? "mp3" : "mp4");
                setQuality(opt === "audio" ? "320" : "1080");
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2.5 text-base">Format</h4>
          <div className="flex flex-wrap gap-2">
            {extOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`${baseChip} ${ext === opt ? activeChip : "hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.07)] hover:text-textPrimary"}`}
                onClick={() => setExt(opt)}
              >
                {opt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2.5 text-base">Quality</h4>
          <div className="flex flex-wrap gap-2">
            {qualityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${baseChip} ${quality === opt.value ? activeChip : "hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.07)] hover:text-textPrimary"}`}
                onClick={() => setQuality(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
