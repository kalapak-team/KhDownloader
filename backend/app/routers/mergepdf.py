import asyncio
import base64
import io
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pypdf import PdfWriter

router = APIRouter(prefix="/api/mergepdf", tags=["mergepdf"])

MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_FILES = 20


@router.post("")
async def merge_pdfs(
    files: List[UploadFile] = File(description="PDF files to merge"),
) -> JSONResponse:
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 PDF files are required to merge")
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_FILES} files allowed")

    contents: list[bytes] = []
    for f in files:
        if not (f.filename or "").lower().endswith(".pdf") and f.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail=f"'{f.filename}' is not a PDF file")
        data = await f.read()
        if len(data) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File '{f.filename}' exceeds the {MAX_FILE_SIZE_MB} MB limit",
            )
        contents.append(data)

    _contents = contents

    def _merge() -> bytes:
        writer = PdfWriter()
        for raw in _contents:
            writer.append(io.BytesIO(raw))
        out = io.BytesIO()
        writer.write(out)
        out.seek(0)
        return out.read()

    try:
        pdf_bytes = await asyncio.get_event_loop().run_in_executor(None, _merge)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Merge failed: {exc}") from exc

    encoded = base64.b64encode(pdf_bytes).decode()
    return JSONResponse({"filename": "merged.pdf", "data": encoded})
