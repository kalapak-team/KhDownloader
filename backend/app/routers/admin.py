from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin
from app.database import get_db
from app.models.download import Download, DownloadStatus
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Response schemas ────────────────────────────────────────────────────────

class AdminUserItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str | None
    auth_provider: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    download_count: int = 0


class AdminDownloadItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    user_email: str | None
    url: str
    title: str | None
    thumbnail_url: str | None
    format_type: str
    quality: str | None
    file_format: str | None
    file_size_bytes: int | None
    status: str
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None


class StatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_downloads: int
    completed_downloads: int
    failed_downloads: int
    pending_downloads: int
    downloads_today: int
    downloads_this_week: int
    total_bytes: int


class UserListResponse(BaseModel):
    items: list[AdminUserItem]
    total: int


class DownloadListResponse(BaseModel):
    items: list[AdminDownloadItem]
    total: int


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> StatsResponse:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())

    total_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    active_users = (await db.execute(select(func.count()).select_from(User).where(User.is_active.is_(True)))).scalar_one()
    total_dl = (await db.execute(select(func.count()).select_from(Download))).scalar_one()
    completed_dl = (await db.execute(select(func.count()).select_from(Download).where(Download.status == DownloadStatus.completed))).scalar_one()
    failed_dl = (await db.execute(select(func.count()).select_from(Download).where(Download.status == DownloadStatus.failed))).scalar_one()
    pending_dl = (await db.execute(select(func.count()).select_from(Download).where(Download.status.in_([DownloadStatus.pending, DownloadStatus.processing])))).scalar_one()
    today_dl = (await db.execute(select(func.count()).select_from(Download).where(Download.created_at >= today_start))).scalar_one()
    week_dl = (await db.execute(select(func.count()).select_from(Download).where(Download.created_at >= week_start))).scalar_one()
    total_bytes_result = (await db.execute(select(func.coalesce(func.sum(Download.file_size_bytes), 0)).select_from(Download))).scalar_one()

    return StatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_downloads=total_dl,
        completed_downloads=completed_dl,
        failed_downloads=failed_dl,
        pending_downloads=pending_dl,
        downloads_today=today_dl,
        downloads_this_week=week_dl,
        total_bytes=total_bytes_result,
    )


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> UserListResponse:
    where = []
    if search:
        where.append(func.lower(User.email).contains(search.lower()))

    count_q = select(func.count()).select_from(User)
    users_q = select(User)
    if where:
        count_q = count_q.where(*where)
        users_q = users_q.where(*where)

    total = (await db.execute(count_q)).scalar_one()
    users_q = users_q.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(users_q)).scalars().all()

    # count downloads per user in one query
    dl_counts_raw = (
        await db.execute(
            select(Download.user_id, func.count().label("cnt"))
            .where(Download.user_id.in_([u.id for u in rows]))
            .group_by(Download.user_id)
        )
    ).all()
    dl_map = {str(r.user_id): r.cnt for r in dl_counts_raw}

    items = [
        AdminUserItem(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            auth_provider=u.auth_provider,
            is_active=u.is_active,
            is_admin=u.is_admin,
            created_at=u.created_at,
            download_count=dl_map.get(str(u.id), 0),
        )
        for u in rows
    ]
    return UserListResponse(items=items, total=total)


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict[str, bool]:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    await db.commit()
    return {"is_active": user.is_active}


@router.patch("/users/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict[str, bool]:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own admin status")
    user.is_admin = not user.is_admin
    await db.commit()
    return {"is_admin": user.is_admin}


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.delete(user)
    await db.commit()


@router.get("/downloads", response_model=DownloadListResponse)
async def list_all_downloads(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: DownloadStatus | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> DownloadListResponse:
    where = []
    if status:
        where.append(Download.status == status)
    if search:
        where.append(Download.title.ilike(f"%{search}%"))

    count_q = select(func.count()).select_from(Download)
    dl_q = select(Download)
    if where:
        count_q = count_q.where(*where)
        dl_q = dl_q.where(*where)

    total = (await db.execute(count_q)).scalar_one()
    dl_q = dl_q.order_by(Download.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(dl_q)).scalars().all()

    # bulk fetch user emails
    user_ids = [r.user_id for r in rows if r.user_id]
    email_map: dict[str, str] = {}
    if user_ids:
        user_rows = (await db.execute(select(User.id, User.email).where(User.id.in_(user_ids)))).all()
        email_map = {str(r.id): r.email for r in user_rows}

    items = [
        AdminDownloadItem(
            id=r.id,
            user_id=r.user_id,
            user_email=email_map.get(str(r.user_id)) if r.user_id else None,
            url=r.url,
            title=r.title,
            thumbnail_url=r.thumbnail_url,
            format_type=r.format_type.value,
            quality=r.quality,
            file_format=r.file_format,
            file_size_bytes=r.file_size_bytes,
            status=r.status.value,
            error_message=r.error_message,
            created_at=r.created_at,
            completed_at=r.completed_at,
        )
        for r in rows
    ]
    return DownloadListResponse(items=items, total=total)


@router.delete("/downloads/{download_id}", status_code=204)
async def delete_download(
    download_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    result = await db.execute(select(Download).where(Download.id == download_id))
    dl = result.scalar_one_or_none()
    if not dl:
        raise HTTPException(status_code=404, detail="Download not found")
    await db.delete(dl)
    await db.commit()
