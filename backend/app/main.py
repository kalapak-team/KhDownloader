from contextlib import asynccontextmanager
from datetime import datetime, timezone

import redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.models import Download, User  # noqa: F401
from app.routers import admin_router, auth_router, download_router, history_router, info_router, jpg2pdf_router, mergepdf_router, pdf2jpg_router, profile_router
from app.utils.file_utils import ensure_download_dir

redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_download_dir()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Media Downloader API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=0,
)


@app.middleware("http")
async def rate_limit_downloads(request: Request, call_next):
    if request.method == "POST" and request.url.path == "/api/download":
        ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:downloads:{ip}:{datetime.now(timezone.utc).strftime('%Y%m%d%H')}"
        count = redis_client.incr(key)
        if count == 1:
            redis_client.expire(key, 3600)
        if count > settings.max_downloads_per_ip_per_hour:
            origin = request.headers.get("origin", "")
            cors_headers = {}
            if origin in settings.allowed_origins_list:
                cors_headers = {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true",
                    "Vary": "Origin",
                }
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded (10 downloads/hour)"},
                headers=cors_headers,
            )

    return await call_next(request)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(info_router)
app.include_router(download_router)
app.include_router(history_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(pdf2jpg_router)
app.include_router(jpg2pdf_router)
app.include_router(mergepdf_router)
app.include_router(profile_router)
