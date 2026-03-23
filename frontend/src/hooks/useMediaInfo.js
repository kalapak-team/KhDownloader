import { useDownloadStore } from "../store/downloadStore";

export default function useMediaInfo() {
  const fetchMedia = useDownloadStore((state) => state.fetchMediaInfo);
  const mediaInfo = useDownloadStore((state) => state.mediaInfo);
  const isFetchingInfo = useDownloadStore((state) => state.isFetchingInfo);

  return { fetchMedia, mediaInfo, isFetchingInfo };
}
