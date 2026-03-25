import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import HistoryTable from "../components/HistoryTable";
import { useDownloadStore } from "../store/downloadStore";

export default function History() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const loadHistory = useDownloadStore((state) => state.loadHistory);
  const history = useDownloadStore((state) => state.history);
  const total = useDownloadStore((state) => state.historyTotal);
  const deleteItem = useDownloadStore((state) => state.deleteHistory);
  const setUrl = useDownloadStore((state) => state.setUrl);
  const setSelectedFormat = useDownloadStore((state) => state.setSelectedFormat);
  const setSelectedQuality = useDownloadStore((state) => state.setSelectedQuality);
  const setSelectedExt = useDownloadStore((state) => state.setSelectedExt);

  const perPage = 10;

  useEffect(() => {
    loadHistory({ page, per_page: perPage, format_type: filter || undefined, search: search || undefined }).catch(
      () => toast.error("Failed to load history"),
    );
  }, [loadHistory, page, filter, search]);

  return (
    <div className="grid gap-5 overflow-hidden py-10 pb-16">
      <section className="pb-2">
        <h1 className="animate-fade-up text-[clamp(1.5rem,4.5vw,2.6rem)] font-extrabold tracking-tight">
          Download History
        </h1>
        <p className="animate-fade-up-d1 mt-2 text-sm text-textSecondary">
          Filter, search, retry, and clean up old downloads.
        </p>
      </section>

      <HistoryTable
        rows={history}
        page={page}
        setPage={setPage}
        hasNext={page * perPage < total}
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        onDelete={async (id) => {
          try {
            await deleteItem(id);
            toast.success("History item deleted");
          } catch {
            toast.error("Failed to delete history item");
          }
        }}
        onRetry={(item) => {
          setUrl(item.url);
          setSelectedFormat(item.format_type);
          setSelectedQuality((item.quality || "320").replace("kbps", "").replace("p", ""));
          setSelectedExt(item.file_format || "mp3");
          toast.success("Loaded item into Home form");
        }}
      />
    </div>
  );
}
