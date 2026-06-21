"""Request and response schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., examples=["ok", "degraded"])
    version: str
    environment: str
    pinecone_index: str
    configured: bool = True
    missing_env: List[str] = Field(default_factory=list)


class UploadResponse(BaseModel):
    """PDF upload and indexing response."""

    document_id: str = Field(..., description="Unique identifier for the uploaded document")
    filename: str
    company_name: Optional[str] = Field(
        default=None,
        description="Detected or user-provided company name",
    )
    page_count: int
    chunk_count: int
    message: str


class Citation(BaseModel):
    """Source citation for a chat answer."""

    source: str = Field(..., description="Source filename or document reference")
    page: Optional[int] = Field(default=None, description="Page number in the PDF")
    excerpt: str = Field(..., description="Relevant text excerpt from the source")
    score: Optional[float] = Field(default=None, description="Similarity score")


class ChatRequest(BaseModel):
    """Chat question request."""

    question: str = Field(..., min_length=1, max_length=2000)
    document_id: Optional[str] = Field(
        default=None,
        description="Scope search to a specific uploaded document",
    )


class ChatResponse(BaseModel):
    """Chat answer with citations."""

    answer: str
    citations: List[Citation]
    document_id: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    error_type: Optional[str] = None
