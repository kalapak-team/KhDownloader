import { CloudDownload, FileImage, FilePlus2, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import DownloadButton from "../components/DownloadButton";
import FormatSelector from "../components/FormatSelector";
import MediaPreview from "../components/MediaPreview";
import ProgressBar from "../components/ProgressBar";
import UrlInput from "../components/UrlInput";
import useDownload from "../hooks/useDownload";
import useMediaInfo from "../hooks/useMediaInfo";
import { useDownloadStore } from "../store/downloadStore";

const SUPPORTED_SITES = [
  "YouTube",
  "SoundCloud",
  "Vimeo",
  "Twitter / X",
  "TikTok",
  "Instagram",
  "Facebook",
  "Dailymotion",
];

export default function Home() {
  const currentUrl = useDownloadStore((state) => state.currentUrl);
  const setUrl = useDownloadStore((state) => state.setUrl);
  const selectedFormat = useDownloadStore((state) => state.selectedFormat);
  const selectedQuality = useDownloadStore((state) => state.selectedQuality);
  const selectedExt = useDownloadStore((state) => state.selectedExt);
  const setSelectedFormat = useDownloadStore((state) => state.setSelectedFormat);
  const setSelectedQuality = useDownloadStore((state) => state.setSelectedQuality);
  const setSelectedExt = useDownloadStore((state) => state.setSelectedExt);
  const activeDownloads = useDownloadStore((state) => state.activeDownloads);

  const { fetchMedia, mediaInfo, isFetchingInfo } = useMediaInfo();
  const { start } = useDownload();

  const availableVideoHeights = Array.from(
    new Set((mediaInfo?.formats || []).map((f) => f.height).filter(Boolean)),
  ).sort((a, b) => b - a);

  return (
    <div className="grid gap-5 py-10 pb-16">
      {/* Hero */}
      <section className="pb-2 pt-4 text-center">
        <h1 className="animate-fade-up text-[clamp(2.8rem,6.5vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight">
          Download{" "}
          <span className="bg-gradient-to-r from-[#e8472a] to-[#ff7a52] bg-clip-text text-transparent">
            Anything.
          </span>
        </h1>
        <p className="animate-fade-up-d1 animate-shimmer mt-4 text-base text-textSecondary">
          YouTube &bull; SoundCloud &bull; Vimeo &bull; Twitter&nbsp;/&nbsp;X &bull; TikTok &bull; 1000+ sites
        </p>
        {/* Supported site badges */}
        <div className="animate-fade-up-d2 mt-5 flex flex-wrap items-center justify-center gap-2">
          {SUPPORTED_SITES.map((site) => (
            <span
              key={site}
              className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-medium text-textSecondary backdrop-blur-sm transition-all duration-200 hover:border-[rgba(232,71,42,0.35)] hover:bg-[rgba(232,71,42,0.07)] hover:text-textPrimary"
            >
              {site}
            </span>
          ))}
        </div>
      </section>

      {/* URL Input */}
      <div className="animate-fade-up-d3">
        <UrlInput
          value={currentUrl}
          onChange={setUrl}
          onSubmit={async () => {
            try {
              await fetchMedia();
              toast.success("Metadata loaded");
            } catch (error) {
              toast.error(error?.response?.data?.detail || "Could not fetch media info");
            }
          }}
          loading={isFetchingInfo}
        />
      </div>

      <MediaPreview mediaInfo={mediaInfo} sourceUrl={currentUrl} />

      {mediaInfo && (
        <>
          <FormatSelector
            format={selectedFormat}
            setFormat={setSelectedFormat}
            quality={selectedQuality}
            setQuality={setSelectedQuality}
            ext={selectedExt}
            setExt={setSelectedExt}
            availableVideoHeights={availableVideoHeights}
          />
          <DownloadButton
            onClick={async () => {
              try {
                await start();
                toast.success("Download started");
              } catch (error) {
                toast.error(error?.response?.data?.detail || "Failed to start download");
              }
            }}
            disabled={!mediaInfo}
          />
        </>
      )}

      {/* Active Downloads */}
      <section className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-md">
        <h3 className="mb-1 text-base font-semibold text-textPrimary">Active Downloads</h3>
        {!activeDownloads.length ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CloudDownload size={38} strokeWidth={1.2} className="text-[rgba(255,255,255,0.12)]" />
            <p className="text-sm text-textSecondary">No active downloads right now.</p>
          </div>
        ) : (
          activeDownloads.map((item) => (
            <div key={item.id} className="mt-4 grid gap-2">
              <div className="truncate text-sm text-textPrimary">{item.title}</div>
              <ProgressBar
                progress={item.progress}
                speed={item.speed}
                eta={item.eta}
                status={item.status}
              />
            </div>
          ))
        )}
      </section>

      {/* Tools */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-textSecondary">
          More Tools
        </h3>
        <div className="flex flex-col gap-2">
        <Link
          to="/pdf-to-jpg"
          className="flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 no-underline backdrop-blur-md transition-all duration-200 hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.06)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(232,71,42,0.12)] text-[#e8472a]">
            <FileImage size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-textPrimary">PDF → JPG</p>
            <p className="mt-0.5 text-xs text-textSecondary">
              Convert each PDF page into a JPG image. Download all as a ZIP.
            </p>
          </div>
        </Link>
        <Link
          to="/jpg-to-pdf"
          className="flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 no-underline backdrop-blur-md transition-all duration-200 hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.06)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(232,71,42,0.12)] text-[#e8472a]">
            <FileText size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-textPrimary">JPG → PDF</p>
            <p className="mt-0.5 text-xs text-textSecondary">
              Convert JPG images to PDF in seconds. Adjust orientation and margins.
            </p>
          </div>
        </Link>
        <Link
          to="/merge-pdf"
          className="flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 no-underline backdrop-blur-md transition-all duration-200 hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.06)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(232,71,42,0.12)] text-[#e8472a]">
            <FilePlus2 size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-textPrimary">Merge PDF</p>
            <p className="mt-0.5 text-xs text-textSecondary">
              Combine PDFs in the order you want with the easiest PDF merger available.
            </p>
          </div>
        </Link>
        </div>
      </section>
    </div>
  );
}
