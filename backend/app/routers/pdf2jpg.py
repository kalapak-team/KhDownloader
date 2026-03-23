import asyncio
import base64
import io
import zipfile
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/pdf2jpg", tags=["pdf2jpg"])

MAX_PDF_SIZE_MB = 50
MAX_PDF_SIZE = MAX_PDF_SIZE_MB * 1024 * 1024


@router.post("")
async def pdf_to_jpg(
    file: Annotated[UploadFile, File(description="PDF file to convert to JPG images")],
) -> JSONResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"PDF exceeds maximum allowed size of {MAX_PDF_SIZE_MB} MB",
        )

    def _convert() -> bytes:
        from pdf2image import convert_from_bytes  # noqa: PLC0415

        images = convert_from_bytes(content, dpi=150, fmt="jpeg")
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for i, img in enumerate(images, start=1):
                img_bytes = io.BytesIO()
                img.save(img_bytes, format="JPEG", quality=90)
                img_bytes.seek(0)
                zf.writestr(f"page_{i:03d}.jpg", img_bytes.read())
        zip_buffer.seek(0)
        return zip_buffer.read()

    try:
        zip_data = await asyncio.to_thread(_convert)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}") from exc

    # Use only ASCII characters in the filename to avoid encoding issues
    stem = file.filename[:-4] if file.filename and len(file.filename) > 4 else "converted"
    safe_stem = "".join(c if ord(c) < 128 else "_" for c in stem).strip("_") or "converted"
    zip_filename = f"{safe_stem}_pages.zip"

    # Return ZIP as base64 inside JSON so IDM cannot intercept it.
    # IDM only intercepts binary download responses, not JSON API responses.
    return JSONResponse({
        "filename": zip_filename,
        "data": base64.b64encode(zip_data).decode("ascii"),
    })

