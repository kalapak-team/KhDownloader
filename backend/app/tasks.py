import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

import redis
from sqlalchemy import select

from app.celery_app import celery
from app.config import settings
from app.database import AsyncSessionLocal
from app.models.download import Download, DownloadStatus
from app.services.downloader import run_download

redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)


def _parse_downloaded_bytes(raw: str | int | None) -> int:
    if raw is None:
        return 0
    if isinstance(raw, int):
        return raw
    return int(raw)


def _update_progress(download_id: str, payload: dict) -> None:
    redis_client.setex(f"download_progress:{download_id}", 3600, json.dumps(payload))


@celery.task(name="app.tasks.process_download")
def process_download(download_id: str) -> None:
    asyncio.run(_process_download_async(download_id))


async def _process_download_async(download_id: str) -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Download).where(Download.id == UUID(download_id)))
        record = result.scalar_one_or_none()
        if not record:
            return

        record.status = DownloadStatus.processing
        await session.commit()

        def progress_hook(data: dict) -> None:
            status = data.get("status")
            total = data.get("total_bytes") or data.get("total_bytes_estimate") or 0
            downloaded = _parse_downloaded_bytes(data.get("downloaded_bytes"))
            progress = (downloaded / total * 100) if total else 0
            payload = {
                "status": "processing" if status == "downloading" else status,
                "progress": round(progress, 2),
                "speed": data.get("_speed_str"),
                "eta": data.get("eta"),
                "file_size": total or None,
            }
            _update_progress(download_id, payload)

        try:
            file_path, file_size = run_download(
                url=record.url,
                format_type=record.format_type,
                quality=(record.quality or "320").replace("kbps", "").replace("p", ""),
                format_ext=record.file_format or "mp3",
                progress_hook=progress_hook,
            )

            if not file_path:
                raise RuntimeError("Download completed but output file was not found")

            output = Path(file_path)
            if file_size and file_size > settings.max_file_size_mb * 1024 * 1024:
                output.unlink(missing_ok=True)
                raise RuntimeError("Downloaded file exceeds allowed file size")

            record.file_path = str(output)
            record.file_size_bytes = file_size
            record.status = DownloadStatus.completed
            record.completed_at = datetime.now(timezone.utc)
            record.error_message = None
            _update_progress(
                download_id,
                {
                    "status": "completed",
                    "progress": 100,
                    "speed": None,
                    "eta": 0,
                    "file_size": file_size,
                },
            )
        except Exception as exc:
            record.status = DownloadStatus.failed
            record.error_message = str(exc)
            _update_progress(
                download_id,
                {
                    "status": "failed",
                    "progress": 0,
                    "speed": None,
                    "eta": None,
                    "file_size": None,
                },
            )
        finally:
            await session.commit()
