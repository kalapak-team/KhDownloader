from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/mediadownloader"
    redis_url: str = "redis://localhost:6379/0"
    download_path: str = "./downloads"
    max_file_size_mb: int = 500
    allowed_origins: str = "http://localhost:5173"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24 * 7
    google_client_id: str = ""
    facebook_cookie_file: str = ""
    cleanup_after_minutes: int = 30
    max_downloads_per_ip_per_hour: int = 10
    admin_email: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def download_dir(self) -> Path:
        return Path(self.download_path).resolve()

    @property
    def facebook_cookie_path(self) -> Path | None:
        if not self.facebook_cookie_file.strip():
            return None
        return Path(self.facebook_cookie_file).resolve()


settings = Settings()
