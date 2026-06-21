"""Lazy-initialized AI service container."""

from typing import Optional

from app.config import Settings, get_settings
from app.core.configuration import ConfigurationError
from app.logging_config import get_logger
from app.services.embedding_service import EmbeddingService
from app.services.pinecone_service import PineconeService
from app.services.rag_service import RAGService

logger = get_logger(__name__)


class ServiceContainer:
    """Initialize expensive AI services only when configured and needed."""

    def __init__(self) -> None:
        self._settings: Settings = get_settings()
        self._embedding: Optional[EmbeddingService] = None
        self._pinecone: Optional[PineconeService] = None
        self._rag: Optional[RAGService] = None

    def _require_configuration(self) -> None:
        missing = self._settings.missing_secrets()
        if missing:
            raise ConfigurationError(
                "Backend is missing required environment variables on Render: "
                + ", ".join(missing)
                + ". Add them under Environment → Environment Variables and redeploy."
            )

    def get_embedding_service(self) -> EmbeddingService:
        self._require_configuration()
        if self._embedding is None:
            self._embedding = EmbeddingService(self._settings)
        return self._embedding

    def get_pinecone_service(self) -> PineconeService:
        self._require_configuration()
        if self._pinecone is None:
            self._pinecone = PineconeService(self._settings, self.get_embedding_service())
        return self._pinecone

    def get_rag_service(self) -> RAGService:
        self._require_configuration()
        if self._rag is None:
            self._rag = RAGService(self._settings, self.get_pinecone_service())
        return self._rag


# Singleton used by route dependencies
services = ServiceContainer()
