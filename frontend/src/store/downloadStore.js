import { create } from "zustand";

import {
  deleteHistory,
  fetchMediaInfo,
  getDownloadStatus,
  getHistory,
  startDownload,
} from "../services/api";

export const useDownloadStore = create((set, get) => ({
  currentUrl: "",
  mediaInfo: null,
  selectedFormat: "audio",
  selectedQuality: "320",
  selectedExt: "mp3",
  activeDownloads: [],
  history: [],
  historyTotal: 0,
  isFetchingInfo: false,

  setUrl: (url) => set({ currentUrl: url }),
  setSelectedFormat: (selectedFormat) => set({ selectedFormat }),
  setSelectedQuality: (selectedQuality) => set({ selectedQuality }),
  setSelectedExt: (selectedExt) => set({ selectedExt }),

  fetchMediaInfo: async () => {
    const { currentUrl } = get();
    set({ isFetchingInfo: true });
    try {
      const { data } = await fetchMediaInfo(currentUrl);
      set({ mediaInfo: data });
      return data;
    } finally {
      set({ isFetchingInfo: false });
    }
  },

  startDownload: async () => {
    const { currentUrl, selectedFormat, selectedQuality, selectedExt, mediaInfo } = get();
    const { data } = await startDownload({
      url: currentUrl,
      format: selectedFormat,
      quality: selectedQuality,
      format_ext: selectedExt,
    });

    set((state) => ({
      activeDownloads: [
        {
          id: data.download_id,
          title: mediaInfo?.title || "Unknown title",
          progress: 0,
          status: data.status,
          speed: null,
          eta: null,
          file_size: null,
        },
        ...state.activeDownloads,
      ],
    }));

    return data.download_id;
  },

  pollDownloadStatus: async (id) => {
    const { data } = await getDownloadStatus(id);
    set((state) => ({
      activeDownloads: state.activeDownloads.map((item) =>
        item.id === id ? { ...item, ...data } : item,
      ),
    }));
    return data;
  },

  loadHistory: async (params) => {
    const { data } = await getHistory(params);
    set({ history: data.items, historyTotal: data.total });
    return data;
  },

  deleteHistory: async (id) => {
    await deleteHistory(id);
    const { history } = get();
    set({ history: history.filter((item) => item.id !== id) });
  },
}));
