from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/api/users", tags=["profile"])

AVATAR_DIR = Path("/app/downloads/avatars")
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


def _build_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        auth_provider=user.auth_provider,
        is_admin=user.is_admin,
        avatar_url=user.avatar_url,
    )


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.full_name = body.full_name
    await db.commit()
    await db.refresh(current_user)
    return _build_response(current_user)


@router.put("/me/password", status_code=204)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.auth_provider != "email":
        raise HTTPException(
            status_code=400,
            detail="Password change is only available for email accounts",
        )
    if not current_user.password_hash:
        raise HTTPException(status_code=400, detail="No password set for this account")
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current one",
        )
    current_user.password_hash = hash_password(body.new_password)
    await db.commit()


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WebP or GIF images are accepted",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Avatar file must be under 5 MB")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)

    # Remove any previous avatar for this user
    for old in AVATAR_DIR.glob(f"{current_user.id}.*"):
        old.unlink(missing_ok=True)

    raw_ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    ext = raw_ext if raw_ext in ("jpg", "jpeg", "png", "webp", "gif") else "jpg"

    filepath = AVATAR_DIR / f"{current_user.id}.{ext}"
    filepath.write_bytes(contents)

    current_user.avatar_url = f"/api/users/avatar/{current_user.id}"
    await db.commit()
    await db.refresh(current_user)
    return _build_response(current_user)


@router.get("/avatar/{user_id}")
async def get_avatar(user_id: str):
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    for ext in ("jpg", "jpeg", "png", "webp", "gif"):
        filepath = AVATAR_DIR / f"{user_id}.{ext}"
        if filepath.exists():
            media_type = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
            return FileResponse(filepath, media_type=media_type)
    raise HTTPException(status_code=404, detail="Avatar not found")
