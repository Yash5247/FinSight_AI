"""Custom application exceptions."""

from typing import Any, Optional


class FinSightError(Exception):
    """Base exception for FinSight AI."""

    def __init__(self, message: str, details: Optional[Any] = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details


class PDFProcessingError(FinSightError):
    """Raised when PDF extraction or validation fails."""


class VectorStoreError(FinSightError):
    """Raised when Pinecone operations fail."""


class RAGError(FinSightError):
    """Raised when RAG pipeline fails."""


class DocumentNotFoundError(FinSightError):
    """Raised when a requested document is not found in the vector store."""
