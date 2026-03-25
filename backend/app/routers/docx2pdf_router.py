import asyncio
import base64
import subprocess
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/docx2pdf", tags=["docx2pdf"])

MAX_SIZE_MB = 50
MAX_SIZE = MAX_SIZE_MB * 1024 * 1024
ALLOWED_EXT = {".doc", ".docx"}


@router.post("")
async def docx_to_pdf(
    file: UploadFile = File(..., description="DOC/DOCX file to convert to PDF"),
) -> JSONResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Only DOC and DOCX files are accepted")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {MAX_SIZE_MB} MB",
        )

    def _convert() -> bytes:
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / f"input{ext}"
            src.write_bytes(content)

            subprocess.run(
                [
                    "libreoffice",
                    "--headless",
                    "--norestore",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    tmp,
                    str(src),
                ],
                check=True,
                timeout=120,
                capture_output=True,
            )

            pdf_path = Path(tmp) / "input.pdf"
            if not pdf_path.exists():
                raise RuntimeError("LibreOffice did not produce a PDF file")
            return pdf_path.read_bytes()

    try:
        pdf_data = await asyncio.to_thread(_convert)
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Conversion timed out") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}") from exc

    stem = Path(file.filename).stem
    safe_stem = "".join(c if ord(c) < 128 else "_" for c in stem).strip("_") or "converted"
    pdf_filename = f"{safe_stem}.pdf"

    return JSONResponse({
        "filename": pdf_filename,
        "data": base64.b64encode(pdf_data).decode("ascii"),
    })
