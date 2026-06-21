"""Health check endpoint."""

from typing import List

from fastapi import APIRouter, Depends

from app import __version__
from app.config import Settings, get_settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Return service health status."""
    missing: List[str] = settings.missing_secrets()
    return HealthResponse(
        status="ok" if settings.is_fully_configured else "degraded",
        version=__version__,
        environment=settings.environment,
        pinecone_index=settings.pinecone_index_name,
        configured=settings.is_fully_configured,
        missing_env=missing,
    )
