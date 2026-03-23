from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.models.download import DownloadStatus, FormatType


class InfoRequest(BaseModel):
    url: HttpUrl


class InfoResponse(BaseModel):
    title: str | None = None
    thumbnail: str | None = None
    duration: float | None = None
    uploader: str | None = None
    view_count: int | None = None
    formats: list[dict[str, Any]] = Field(default_factory=list)


class DownloadCreateRequest(BaseModel):
    url: HttpUrl
    format: FormatType
    quality: str
    format_ext: str


class DownloadCreateResponse(BaseModel):
    download_id: UUID
    status: DownloadStatus


class DownloadStatusResponse(BaseModel):
    status: DownloadStatus
    progress: float = 0
    speed: str | None = None
    eta: int | None = None
    file_size: int | None = None


class DownloadHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    title: str | None
    thumbnail_url: str | None
    duration: int | None
    format_type: FormatType
    quality: str | None
    file_format: str | None
    file_size_bytes: int | None
    status: DownloadStatus
    error_message: str | None
    download_count: int
    created_at: datetime
    completed_at: datetime | None


class HistoryResponse(BaseModel):
    items: list[DownloadHistoryItem]
    total: int
    page: int
    per_page: int
