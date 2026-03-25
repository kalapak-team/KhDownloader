from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.docx2pdf_router import router as docx2pdf_router
from app.routers.download import router as download_router
from app.routers.excel2pdf_router import router as excel2pdf_router
from app.routers.history import router as history_router
from app.routers.info import router as info_router
from app.routers.jpg2pdf import router as jpg2pdf_router
from app.routers.mergepdf import router as mergepdf_router
from app.routers.pdf2docx_router import router as pdf2docx_router
from app.routers.pdf2excel_router import router as pdf2excel_router
from app.routers.pdf2jpg import router as pdf2jpg_router
from app.routers.pdf2pptx_router import router as pdf2pptx_router
from app.routers.pptx2pdf_router import router as pptx2pdf_router
from app.routers.profile import router as profile_router

__all__ = ["admin_router", "auth_router", "docx2pdf_router", "download_router", "excel2pdf_router", "history_router", "info_router", "jpg2pdf_router", "mergepdf_router", "pdf2docx_router", "pdf2excel_router", "pdf2jpg_router", "pdf2pptx_router", "pptx2pdf_router", "profile_router"]
