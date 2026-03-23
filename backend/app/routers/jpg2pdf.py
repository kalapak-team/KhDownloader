import asyncio
import base64
import io
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image

router = APIRouter(prefix="/api/jpg2pdf", tags=["jpg2pdf"])

MAX_FILE_SIZE_MB = 20
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_FILES = 50

# A4 dimensions in pixels at 150 DPI  (8.27 × 11.69 inches)
_A4_SHORT = 1240
_A4_LONG = 1754

_MARGIN_PX: dict[str, int] = {
    "none": 0,
    "small": 47,    # ≈ 8 mm at 150 dpi
    "medium": 118,  # ≈ 20 mm
    "large": 177,   # ≈ 30 mm
}


@router.post("")
async def jpg_to_pdf(
    files: list[Annotated[UploadFile, File(description="JPG/PNG images to combine into a PDF")]],
    orientation: str = Form("portrait"),
    margin: str = Form("small"),
) -> JSONResponse:
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_FILES} files allowed")
    if orientation not in ("portrait", "landscape"):
        raise HTTPException(status_code=400, detail="orientation must be 'portrait' or 'landscape'")
    if margin not in _MARGIN_PX:
        raise HTTPException(status_code=400, detail="margin must be one of: none, small, medium, large")

    contents: list[bytes] = []
    for f in files:
        data = await f.read()
        if len(data) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File '{f.filename}' exceeds the {MAX_FILE_SIZE_MB} MB limit",
            )
        contents.append(data)

    _orientation = orientation
    _margin = margin

    def _convert() -> bytes:
        page_w = _A4_SHORT if _orientation == "portrait" else _A4_LONG
        page_h = _A4_LONG if _orientation == "portrait" else _A4_SHORT
        m = _MARGIN_PX[_margin]
        max_w = max(page_w - 2 * m, 1)
        max_h = max(page_h - 2 * m, 1)

        pages: list[Image.Image] = []
        for raw in contents:
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            img.thumbnail((max_w, max_h), Image.LANCZOS)
            canvas = Image.new("RGB", (page_w, page_h), (255, 255, 255))
            x = (page_w - img.width) // 2
            y = (page_h - img.height) // 2
            canvas.paste(img, (x, y))
            pages.append(canvas)

        if not pages:
            raise ValueError("No valid images could be processed")

        out = io.BytesIO()
        pages[0].save(out, format="PDF", save_all=True, append_images=pages[1:])
        out.seek(0)
        return out.read()

    try:
        pdf_data = await asyncio.to_thread(_convert)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}") from exc

    # Return PDF as base64 inside JSON so IDM cannot intercept it.
    return JSONResponse({
        "filename": "images.pdf",
        "data": base64.b64encode(pdf_data).decode("ascii"),
    })
