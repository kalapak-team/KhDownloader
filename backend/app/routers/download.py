import asyncio
import json
from pathlib import Path
from uuid import UUID

import redis
from celery.exceptions import CeleryError
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.auth import get_current_user_optional
from app.database import get_db
from app.models.download import Download, DownloadStatus
from app.models.user import User
from app.schemas.download import DownloadCreateRequest, DownloadCreateResponse, DownloadStatusResponse
from app.services.metadata import extract_metadata
from app.tasks import process_download
from app.utils.file_utils import remove_file_if_exists, safe_download_path, sanitize_filename

router = APIRouter(prefix="/api/download", tags=["download"])
redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)


async def _remove_file_delayed(file_path: str) -> None:
    await asyncio.sleep(settings.cleanup_after_minutes * 60)
    remove_file_if_exists(file_path)


@router.post("", response_model=DownloadCreateResponse)
async def create_download(
    payload: DownloadCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> DownloadCreateResponse:
    ip = request.client.host if request.client else "unknown"

    metadata = extract_metadata(str(payload.url))
    requested_size = None
    for item in metadata.get("formats", []):
        ext = (item.get("ext") or "").lower()
        height = item.get("height")
        filesize = item.get("filesize")
        if not filesize:
            continue

        if payload.format.value == "audio" and ext == payload.format_ext.lower():
            requested_size = filesize
            break
        if payload.format.value == "video" and ext == payload.format_ext.lower() and height:
            target_h = int(payload.quality.replace("p", ""))
            if int(height) <= target_h:
                requested_size = filesize
                break

    if requested_size and requested_size > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Requested file exceeds max allowed size")

    record = Download(
        user_id=current_user.id if current_user else None,
        url=str(payload.url),
        title=metadata.get("title"),
        thumbnail_url=metadata.get("thumbnail"),
        duration=metadata.get("duration"),
        format_type=payload.format,
        quality=payload.quality,
        file_format=payload.format_ext,
        status=DownloadStatus.pending,
        ip_address=ip,
    )

    db.add(record)
    await db.commit()
    await db.refresh(record)

    try:
        process_download.delay(str(record.id))
    except CeleryError as exc:
        record.status = DownloadStatus.failed
        record.error_message = f"Queue unavailable: {exc}"
        await db.commit()
        raise HTTPException(status_code=503, detail="Download queue is temporarily unavailable") from exc

    return DownloadCreateResponse(download_id=record.id, status=record.status)


@router.get("/{download_id}/status", response_model=DownloadStatusResponse)
async def get_download_status(download_id: UUID, db: AsyncSession = Depends(get_db)) -> DownloadStatusResponse:
    progress_key = f"download_progress:{download_id}"
    cached = redis_client.get(progress_key)
    if cached:
        parsed = json.loads(cached)
        status = parsed.get("status", "pending")
        if status not in DownloadStatus.__members__:
            status = "processing" if status in {"downloading", "finished"} else "pending"
        return DownloadStatusResponse(
            status=DownloadStatus(status),
            progress=parsed.get("progress") or 0,
            speed=parsed.get("speed"),
            eta=parsed.get("eta"),
            file_size=parsed.get("file_size"),
        )

    result = await db.execute(select(Download).where(Download.id == download_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Download not found")

    return DownloadStatusResponse(status=record.status, progress=100 if record.status == DownloadStatus.completed else 0)


@router.get("/{download_id}/file")
async def get_download_file(
    download_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Download).where(Download.id == download_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Download not found")
    if record.status != DownloadStatus.completed or not record.file_path:
        raise HTTPException(status_code=409, detail="Download is not ready")

    path = safe_download_path(record.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Downloaded file is missing")

    record.download_count += 1
    await db.commit()

    safe_name = sanitize_filename((record.title or "download") + f".{record.file_format or path.suffix.lstrip('.')}" )
    background_tasks.add_task(_remove_file_delayed, str(path))

    return FileResponse(path=path, media_type="application/octet-stream", filename=safe_name)
