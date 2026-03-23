import { useCallback } from "react";
import toast from "react-hot-toast";

import { getDownloadFile } from "../services/api";
import { useDownloadStore } from "../store/downloadStore";

export default function useDownload() {
  const beginDownload = useDownloadStore((state) => state.startDownload);
  const pollStatus = useDownloadStore((state) => state.pollDownloadStatus);

  const start = useCallback(async () => {
    const id = await beginDownload();

    const timer = setInterval(async () => {
      try {
        const status = await pollStatus(id);

        if (status.status === "completed") {
          clearInterval(timer);
          const link = document.createElement("a");
          link.href = getDownloadFile(id);
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success("Download completed");
        }

        if (status.status === "failed") {
          clearInterval(timer);
          toast.error("Download failed");
        }
      } catch (error) {
        clearInterval(timer);
        toast.error(error?.response?.data?.detail || "Failed to poll download status");
      }
    }, 1500);

    return id;
  }, [beginDownload, pollStatus]);

  return { start };
}
