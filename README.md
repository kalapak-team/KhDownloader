# Media Downloader (FastAPI + React + PostgreSQL)

A full-stack media downloader for YouTube and other `yt-dlp` supported URLs.

## Stack

- Backend: FastAPI, SQLAlchemy async, Celery, Redis, yt-dlp
- Frontend: React (Vite), Zustand, Axios, react-hot-toast
- Database: PostgreSQL
- Containers: Docker Compose

## Project Structure

- `backend/`: API, services, tasks, database model
- `frontend/`: UI, store, hooks, API client
- `docker-compose.yml`: Postgres + Redis + backend + worker + frontend

## Quick Start (Docker)

1. Open this folder: `media-downloader`
2. Run:

```bash
docker-compose up --build
```

3. Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/health

## Local Dev (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Run Celery worker in another shell:

```bash
cd backend
celery -A app.celery_app.celery worker --loglevel=info --concurrency=4
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Summary

- `POST /api/info`
- `POST /api/download`
- `GET /api/download/{download_id}/status`
- `GET /api/download/{download_id}/file`
- `GET /api/history`
- `DELETE /api/history/{download_id}`
- `DELETE /api/history`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`

## Authentication Setup

Email/password authentication works out of the box.

To enable `Continue with Google`:

1. Create a Google OAuth client (Web application) and copy the client ID.
2. Set `GOOGLE_CLIENT_ID` in `backend/.env`.
3. Set `VITE_GOOGLE_CLIENT_ID` for frontend build:

```bash
# PowerShell (from project root)
$env:VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
docker-compose up -d --build frontend backend
```

Or place `VITE_GOOGLE_CLIENT_ID=...` in a root `.env` used by Docker Compose.

## Notes

- Rate limit: max 10 `POST /api/download` requests per IP per hour.
- Download history is account-scoped: each user only sees and can delete their own history records.
- File size check: rejects oversized requests when size is known before download and validates again after download.
- Cleanup: served files are deleted after `CLEANUP_AFTER_MINUTES`.
- CORS: restricted to `ALLOWED_ORIGINS`.
- Facebook private/restricted links: export browser cookies (`cookies.txt`) to `backend/cookies/facebook_cookies.txt` and restart backend.

## Database

`downloads` model includes:

- URL/title/thumbnail/duration
- format type and quality
- file format/path/size
- status lifecycle (`pending`, `processing`, `completed`, `failed`)
- error message, download counter, timestamps, client IP

The app creates tables on startup via SQLAlchemy metadata. For production, use Alembic migrations.

### Alembic

Baseline migration is provided in `backend/alembic/versions/20260323_0001_create_downloads.py`.
Authentication migration is provided in `backend/alembic/versions/20260323_0002_create_users.py`.

```bash
cd backend
alembic upgrade head
```
