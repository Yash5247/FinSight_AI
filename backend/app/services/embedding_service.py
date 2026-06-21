"""OpenAI embedding service."""

from langchain_openai import OpenAIEmbeddings

from app.config import Settings
from app.logging_config import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    """Create embeddings using OpenAI."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            openai_api_key=settings.openai_api_key,
        )
        logger.info("Initialized embedding model: %s", settings.embedding_model)

    @property
    def embeddings(self) -> OpenAIEmbeddings:
        """Return LangChain embeddings instance."""
        return self._embeddings
