import re
from pathlib import Path

from app.config import settings


def ensure_download_dir() -> Path:
    download_dir = settings.download_dir
    download_dir.mkdir(parents=True, exist_ok=True)
    return download_dir


def sanitize_filename(filename: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "_", filename).strip("._")
    return cleaned[:180] if cleaned else "download"


def safe_download_path(candidate: str | Path) -> Path:
    base = settings.download_dir
    target = Path(candidate).resolve()
    base.mkdir(parents=True, exist_ok=True)
    if base not in [target, *target.parents]:
        raise ValueError("Invalid file path")
    return target


def remove_file_if_exists(path: str | Path | None) -> None:
    if not path:
        return
    target = Path(path)
    if target.exists() and target.is_file():
        target.unlink(missing_ok=True)
