import { format } from "date-fns";
import { RefreshCw, Trash2 } from "lucide-react";

const fmtBytes = (bytes) => {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  return `${size.toFixed(1)} ${units[idx]}`;
};

export default function HistoryTable({
  rows,
  onDelete,
  onRetry,
  page,
  setPage,
  hasNext,
  filter,
  setFilter,
  search,
  setSearch,
}) {
  const statusClasses = {
    completed: "border border-[rgba(48,209,88,0.3)] bg-[rgba(48,209,88,0.2)] text-[#7CE89A]",
    failed: "border border-[rgba(255,69,58,0.3)] bg-[rgba(255,69,58,0.2)] text-[#FF8B85]",
    processing: "border border-[rgba(255,214,10,0.3)] bg-[rgba(255,214,10,0.2)] text-[#FFE37A]",
    pending: "border border-[rgba(255,214,10,0.3)] bg-[rgba(255,214,10,0.2)] text-[#FFE37A]",
  };

  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-md">
      <div className="mb-4 grid grid-cols-1 gap-2.5 md:grid-cols-[180px_1fr]">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 text-sm text-textPrimary outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)]"
        >
          <option value="">All</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title"
          className="h-10 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 text-sm text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)]"
        />
      </div>

      {!rows.length && (
        <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.08)] p-8 text-center text-textSecondary">
          No history yet. Start your first download.
        </div>
      )}

      {!!rows.length && (
        <div className="overflow-auto">
          <table className="min-w-[820px] w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-borderColor p-2.5 text-left text-xs font-medium text-textSecondary">Thumbnail</th>
                <th className="border-b border-borderColor p-2.5 text-left text-xs font-medium text-textSecondary">Title</th>
                <th className="border-b border-borderColor p-2.5 text-left text-xs font-medium text-textSecondary">Type</th>
                <th className="border-b border-borderColor p-2.5 text-left text-xs font-medium text-textSecondary">Quality</th>
                <th className="border-b border-borderColor p-2.5 text-left text-xs font-medium text-textSecondary">Size</th>
                <th className="border-b border-borderColor p-2.5 text-left text-xs font-medium text-textSecondary">Date</th>
                <th className="border-b border-borderColor p-2.5 text-left text-xs font-medium text-textSecondary">Status</th>
                <th className="border-b border-borderColor p-2.5 text-left text-xs font-medium text-textSecondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className="border-b border-borderColor p-2.5 text-xs">
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="h-10 w-[72px] rounded-md object-cover"
                      loading="lazy"
                    />
                  </td>
                  <td className="border-b border-borderColor p-2.5 text-xs">{item.title || "Untitled"}</td>
                  <td className="border-b border-borderColor p-2.5 text-xs">{item.format_type}</td>
                  <td className="border-b border-borderColor p-2.5 text-xs">{item.quality || "-"}</td>
                  <td className="border-b border-borderColor p-2.5 text-xs">{fmtBytes(item.file_size_bytes)}</td>
                  <td className="border-b border-borderColor p-2.5 text-xs">{format(new Date(item.created_at), "yyyy-MM-dd HH:mm")}</td>
                  <td className="border-b border-borderColor p-2.5 text-xs">
                    <span
                      className={[
                        "inline-flex rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.05em]",
                        statusClasses[item.status] || statusClasses.pending,
                      ].join(" ")}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="border-b border-borderColor p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-borderColor bg-bgSurface text-textPrimary"
                        onClick={() => onRetry(item)}
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,69,58,0.5)] bg-bgSurface text-textPrimary"
                        onClick={() => {
                          if (window.confirm("Delete this history record?")) onDelete(item.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-textPrimary transition-all duration-200 hover:border-[rgba(232,71,42,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>
        <span className="text-sm text-textSecondary">Page {page}</span>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-textPrimary transition-all duration-200 hover:border-[rgba(232,71,42,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
