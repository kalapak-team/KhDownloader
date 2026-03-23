from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.download import router as download_router
from app.routers.history import router as history_router
from app.routers.info import router as info_router
from app.routers.jpg2pdf import router as jpg2pdf_router
from app.routers.mergepdf import router as mergepdf_router
from app.routers.pdf2jpg import router as pdf2jpg_router
from app.routers.profile import router as profile_router

__all__ = ["admin_router", "auth_router", "download_router", "history_router", "info_router", "jpg2pdf_router", "mergepdf_router", "pdf2jpg_router", "profile_router"]
