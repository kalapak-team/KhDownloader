import asyncio
import base64
import io

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/pdf2docx", tags=["pdf2docx"])

MAX_PDF_SIZE_MB = 50
MAX_PDF_SIZE = MAX_PDF_SIZE_MB * 1024 * 1024


@router.post("")
async def pdf_to_docx(
    file: UploadFile = File(..., description="PDF file to convert to DOCX"),
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
        from pdf2docx import Converter  # noqa: PLC0415

        pdf_stream = io.BytesIO(content)
        docx_stream = io.BytesIO()
        cv = Converter(stream=pdf_stream)
        cv.convert(docx_stream)
        cv.close()
        docx_stream.seek(0)
        return docx_stream.read()

    try:
        docx_data = await asyncio.to_thread(_convert)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}") from exc

    stem = file.filename[:-4] if file.filename and len(file.filename) > 4 else "converted"
    safe_stem = "".join(c if ord(c) < 128 else "_" for c in stem).strip("_") or "converted"
    docx_filename = f"{safe_stem}.docx"

    return JSONResponse({
        "filename": docx_filename,
        "data": base64.b64encode(docx_data).decode("ascii"),
    })
