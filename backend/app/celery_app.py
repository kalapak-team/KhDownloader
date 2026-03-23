from celery import Celery

from app.config import settings

celery = Celery(
    "media_downloader",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)

celery.conf.update(
    task_default_queue="celery",
    task_routes={"app.tasks.process_download": {"queue": "celery"}},
    broker_connection_retry_on_startup=True,
)
