from fastapi import APIRouter, HTTPException

from app.schemas.download import InfoRequest, InfoResponse
from app.services.metadata import extract_metadata

router = APIRouter(prefix="/api", tags=["info"])


@router.post("/info", response_model=InfoResponse)
async def get_media_info(payload: InfoRequest) -> InfoResponse:
    try:
        data = extract_metadata(str(payload.url))
        return InfoResponse(**data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to fetch metadata: {exc}") from exc
