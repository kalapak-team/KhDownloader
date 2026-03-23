from collections.abc import Callable
from pathlib import Path
from typing import Any

import yt_dlp

from app.config import settings
from app.models.download import FormatType
from app.utils.file_utils import ensure_download_dir


def build_audio_opts(
    quality: str,
    format_ext: str,
    progress_hook: Callable[[dict[str, Any]], None],
) -> dict[str, Any]:
    return {
        "format": "bestaudio/best",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": format_ext,
                "preferredquality": quality,
            }
        ],
        "outtmpl": str(settings.download_dir / "%(id)s.%(ext)s"),
        "progress_hooks": [progress_hook],
        "noplaylist": True,
        "quiet": True,
    }


def build_video_opts(
    quality: str,
    format_ext: str,
    progress_hook: Callable[[dict[str, Any]], None],
) -> dict[str, Any]:
    return {
        "format": f"bestvideo[height<={quality}]+bestaudio/best[height<={quality}]",
        "merge_output_format": format_ext,
        "outtmpl": str(settings.download_dir / "%(id)s.%(ext)s"),
        "progress_hooks": [progress_hook],
        "noplaylist": True,
        "quiet": True,
    }


def run_download(
    url: str,
    format_type: FormatType,
    quality: str,
    format_ext: str,
    progress_hook: Callable[[dict[str, Any]], None],
) -> tuple[str | None, int | None]:
    ensure_download_dir()

    opts = (
        build_audio_opts(quality=quality, format_ext=format_ext, progress_hook=progress_hook)
        if format_type == FormatType.audio
        else build_video_opts(quality=quality, format_ext=format_ext, progress_hook=progress_hook)
    )

    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
        file_path = ydl.prepare_filename(info)

    path = Path(file_path)
    if not path.exists():
        stem = path.stem
        candidates = sorted(path.parent.glob(f"{stem}.*"), key=lambda p: p.stat().st_mtime, reverse=True)
        if candidates:
            path = candidates[0]

    size = path.stat().st_size if path.exists() else None
    return (str(path) if path.exists() else None, size)
