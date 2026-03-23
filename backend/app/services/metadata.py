from typing import Any
from urllib.parse import urlparse

import yt_dlp
from yt_dlp.utils import DownloadError

from app.config import settings


def _normalize_info(raw: dict[str, Any]) -> dict[str, Any]:
    # Some extractors return playlist-like wrappers with entries.
    if raw.get("entries") and not raw.get("formats"):
        first = next((entry for entry in raw.get("entries", []) if entry), None)
        if isinstance(first, dict):
            return first
    return raw


def _looks_like_facebook(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return "facebook.com" in host or "fb.watch" in host


def _friendly_error(url: str, err: Exception) -> str:
    message = str(err)
    if _looks_like_facebook(url):
        cookie_hint = ""
        if settings.facebook_cookie_path and settings.facebook_cookie_path.exists():
            cookie_hint = " A Facebook cookie file is configured, but the URL may still be restricted."
        elif settings.facebook_cookie_path:
            cookie_hint = (
                " Cookie path is configured but file was not found at "
                f"{settings.facebook_cookie_path}. Place facebook_cookies.txt there."
            )
        else:
            cookie_hint = (
                " If the video is not public, configure FACEBOOK_COOKIE_FILE in backend .env "
                "with an exported cookies.txt path."
            )
        return (
            "Facebook metadata could not be fetched. Make sure the post/video is public, "
            "not age/region restricted, and try the direct video URL."
            + cookie_hint
        )
    return f"{message}"


def extract_metadata(url: str) -> dict[str, Any]:
    base_opts = {
        "quiet": True,
        "no_warnings": True,
        "ignoreconfig": True,
        "skip_download": True,
        "noplaylist": True,
        "extract_flat": False,
        "socket_timeout": 20,
        "retries": 2,
        "extractor_retries": 2,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.facebook.com/",
        },
    }

    cookie_path = settings.facebook_cookie_path
    if cookie_path and cookie_path.exists():
        base_opts["cookiefile"] = str(cookie_path)

    profiles: list[dict[str, Any]] = [
        {
            **base_opts,
        },
        {
            **base_opts,
            "extractor_args": {
                "facebook": {
                    "format": ["sd"],
                }
            },
        },
        {
            **base_opts,
            "force_generic_extractor": True,
        },
    ]

    last_error: Exception | None = None
    info: dict[str, Any] | None = None

    for opts in profiles:
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                current = ydl.extract_info(url, download=False, process=False)
                current = _normalize_info(current)
                if not current.get("formats") and not current.get("title"):
                    current = ydl.extract_info(url, download=False)
                    current = _normalize_info(current)

                if current.get("title") or current.get("formats"):
                    info = current
                    break
        except DownloadError as exc:
            last_error = exc
            continue
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            continue

    if not info:
        raise RuntimeError(_friendly_error(url, last_error or RuntimeError("Unknown extractor error")))

    formats: list[dict[str, Any]] = []
    for item in info.get("formats", []):
        formats.append(
            {
                "format_id": item.get("format_id"),
                "ext": item.get("ext"),
                "resolution": item.get("resolution") or item.get("format_note") or "audio",
                "filesize": item.get("filesize") or item.get("filesize_approx"),
                "acodec": item.get("acodec"),
                "vcodec": item.get("vcodec"),
                "tbr": item.get("tbr"),
                "height": item.get("height"),
            }
        )

    return {
        "title": info.get("title"),
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
        "uploader": info.get("uploader"),
        "view_count": info.get("view_count"),
        "formats": formats,
    }
