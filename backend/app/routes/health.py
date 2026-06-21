"""Health check endpoint."""

from fastapi import APIRouter, Depends

from app import __version__
from app.config import Settings, get_settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Return service health status."""
    return HealthResponse(
        status="ok",
        version=__version__,
        environment=settings.environment,
        pinecone_index=settings.pinecone_index_name,
    )
