"""FinSight AI – FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.config import get_settings
from app.core.configuration import ConfigurationError
from app.core.exceptions import (
    DocumentNotFoundError,
    FinSightError,
    PDFProcessingError,
    RAGError,
    VectorStoreError,
)
from app.logging_config import get_logger, setup_logging
from app.routes import chat, health, upload

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup/shutdown — server binds to PORT even if API keys are not yet configured."""
    settings = get_settings()
    setup_logging(settings.log_level)
    logger.info("Starting FinSight AI v%s [%s]", __version__, settings.environment)

    missing = settings.missing_secrets()
    if missing:
        logger.warning(
            "Running in degraded mode — missing env vars: %s. "
            "Add them on Render and redeploy to enable upload/chat.",
            ", ".join(missing),
        )
    else:
        logger.info("All required environment variables are configured")

    yield
    logger.info("Shutting down FinSight AI")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title="FinSight AI",
        description="Financial Report RAG Assistant – Upload annual reports and ask questions.",
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["Root"])
    async def root() -> dict:
        """Root endpoint for platform health probes."""
        return {
            "service": "FinSight AI API",
            "version": __version__,
            "docs": "/docs",
            "health": "/health",
            "configured": settings.is_fully_configured,
        }

    @app.exception_handler(ConfigurationError)
    async def config_error_handler(request: Request, exc: ConfigurationError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={"detail": exc.message, "error_type": "ConfigurationError"},
        )

    @app.exception_handler(PDFProcessingError)
    async def pdf_error_handler(request: Request, exc: PDFProcessingError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": exc.message, "error_type": "PDFProcessingError"})

    @app.exception_handler(DocumentNotFoundError)
    async def doc_not_found_handler(request: Request, exc: DocumentNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": exc.message, "error_type": "DocumentNotFoundError"})

    @app.exception_handler(VectorStoreError)
    async def vector_error_handler(request: Request, exc: VectorStoreError) -> JSONResponse:
        return JSONResponse(status_code=502, content={"detail": exc.message, "error_type": "VectorStoreError"})

    @app.exception_handler(RAGError)
    async def rag_error_handler(request: Request, exc: RAGError) -> JSONResponse:
        return JSONResponse(status_code=502, content={"detail": exc.message, "error_type": "RAGError"})

    @app.exception_handler(FinSightError)
    async def finsight_error_handler(request: Request, exc: FinSightError) -> JSONResponse:
        return JSONResponse(status_code=500, content={"detail": exc.message, "error_type": "FinSightError"})

    app.include_router(health.router)
    app.include_router(upload.router)
    app.include_router(chat.router)

    return app


app = create_app()
