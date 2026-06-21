"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for FinSight AI backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # OpenAI
    openai_api_key: str = Field(default="", description="OpenAI API key")
    embedding_model: str = Field(
        default="text-embedding-3-small",
        description="OpenAI embedding model",
    )
    chat_model: str = Field(default="gpt-4o-mini", description="OpenAI chat model")

    # Pinecone
    pinecone_api_key: str = Field(default="", description="Pinecone API key")
    pinecone_index_name: str = Field(
        default="finsight-reports",
        description="Pinecone index name",
    )
    pinecone_cloud: str = Field(default="aws", description="Pinecone cloud provider")
    pinecone_region: str = Field(default="us-east-1", description="Pinecone region")

    # RAG
    chunk_size: int = Field(default=1000, ge=100, le=8000)
    chunk_overlap: int = Field(default=200, ge=0, le=2000)
    top_k: int = Field(default=5, ge=1, le=20)

    # Application
    environment: str = Field(default="development")
    log_level: str = Field(default="INFO")
    cors_origins: str = Field(
        default="http://localhost:5173",
        description="Comma-separated allowed CORS origins",
    )

    # Server
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)

    @property
    def cors_origin_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def missing_secrets(self) -> List[str]:
        """Return names of required environment variables that are missing or placeholders."""
        missing: List[str] = []

        openai = self.openai_api_key.strip()
        if not openai or openai in {"sk-your-openai-api-key", "your-openai-api-key"}:
            missing.append("OPENAI_API_KEY")

        pinecone = self.pinecone_api_key.strip()
        if not pinecone or pinecone in {"your-pinecone-api-key", "pc-your-pinecone-api-key"}:
            missing.append("PINECONE_API_KEY")

        return missing

    @property
    def is_fully_configured(self) -> bool:
        """True when all secrets required for RAG are present."""
        return len(self.missing_secrets()) == 0


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
