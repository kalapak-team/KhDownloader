from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.download import Download, FormatType
from app.models.user import User
from app.schemas.download import DownloadHistoryItem, HistoryResponse
from app.utils.file_utils import remove_file_if_exists

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=HistoryResponse)
async def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    format_type: FormatType | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HistoryResponse:
    where_clauses = [Download.user_id == current_user.id]
    if format_type:
        where_clauses.append(Download.format_type == format_type)
    if search:
        where_clauses.append(Download.title.ilike(f"%{search}%"))

    query = select(Download)
    count_query = select(func.count(Download.id))
    for clause in where_clauses:
        query = query.where(clause)
        count_query = count_query.where(clause)

    query = query.order_by(Download.created_at.desc()).offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    total_result = await db.execute(count_query)

    items = [DownloadHistoryItem.model_validate(row) for row in result.scalars().all()]
    total = total_result.scalar_one()

    return HistoryResponse(items=items, total=total, page=page, per_page=per_page)


@router.delete("/{download_id}")
async def delete_history_item(
    download_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    result = await db.execute(select(Download).where(Download.id == download_id, Download.user_id == current_user.id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="History item not found")

    remove_file_if_exists(record.file_path)
    await db.delete(record)
    await db.commit()
    return {"message": "History item deleted"}


@router.delete("")
async def clear_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    result = await db.execute(select(Download).where(Download.user_id == current_user.id))
    records = result.scalars().all()
    for record in records:
        remove_file_if_exists(record.file_path)
        await db.delete(record)

    await db.commit()
    return {"message": "History cleared"}
