from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, GoogleAuthRequest, LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        auth_provider=user.auth_provider,
        is_admin=user.is_admin,
        avatar_url=user.avatar_url,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    email = payload.email.lower().strip()

    existing = await db.execute(select(User).where(func.lower(User.email) == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        auth_provider="email",
        is_admin=bool(settings.admin_email and email == settings.admin_email.lower().strip()),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=_to_user_response(user))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    email = payload.email.lower().strip()

    result = await db.execute(select(User).where(func.lower(User.email) == email, User.is_active.is_(True)))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=_to_user_response(user))


@router.post("/google", response_model=AuthResponse)
async def google_login(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google login is not configured")

    try:
        google_info = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Google credential") from exc

    email = str(google_info.get("email", "")).lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Google account email is unavailable")

    full_name = google_info.get("name")

    result = await db.execute(select(User).where(func.lower(User.email) == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            full_name=full_name,
            auth_provider="google",
            password_hash=None,
            is_admin=bool(settings.admin_email and email == settings.admin_email.lower().strip()),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif user.full_name != full_name and full_name:
        user.full_name = full_name
        await db.commit()

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=_to_user_response(user))


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return _to_user_response(current_user)


@router.get("/google-config")
async def google_config() -> dict[str, str | bool]:
    return {
        "enabled": bool(settings.google_client_id),
        "client_id": settings.google_client_id or "",
    }
