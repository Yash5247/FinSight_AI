"""FinSight AI – FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.config import get_settings
from app.core.exceptions import (
    DocumentNotFoundError,
    FinSightError,
    PDFProcessingError,
    RAGError,
    VectorStoreError,
)
from app.logging_config import get_logger, setup_logging
from app.routes import chat, health, upload
from app.services.embedding_service import EmbeddingService
from app.services.pinecone_service import PineconeService
from app.services.rag_service import RAGService

logger = get_logger(__name__)

# Module-level service instances (initialized at startup)
embedding_service: EmbeddingService
pinecone_service: PineconeService
rag_service: RAGService


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialize services on startup and clean up on shutdown."""
    global embedding_service, pinecone_service, rag_service

    settings = get_settings()
    setup_logging(settings.log_level)
    logger.info("Starting FinSight AI v%s [%s]", __version__, settings.environment)

    embedding_service = EmbeddingService(settings)
    pinecone_service = PineconeService(settings, embedding_service)
    rag_service = RAGService(settings, pinecone_service)

    logger.info("All services initialized successfully")
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
        }

    # Exception handlers
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

    # Routes
    app.include_router(health.router)
    app.include_router(upload.router)
    app.include_router(chat.router)

    return app


app = create_app()
