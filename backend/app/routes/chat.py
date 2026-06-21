"""Chat endpoint."""

from fastapi import APIRouter, Depends

from app.core.exceptions import DocumentNotFoundError, FinSightError, RAGError, VectorStoreError
from app.logging_config import get_logger
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_service import RAGService

logger = get_logger(__name__)
router = APIRouter(tags=["Chat"])


def get_rag_service() -> RAGService:
    from app.main import rag_service

    return rag_service


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    rag: RAGService = Depends(get_rag_service),
) -> ChatResponse:
    """
    Ask a natural language question about uploaded annual reports.
    Optionally scope to a specific document_id.
    """
    logger.info(
        "Chat request: question_len=%d, document_id=%s",
        len(request.question),
        request.document_id,
    )

    try:
        return await rag.answer_question(
            question=request.question.strip(),
            document_id=request.document_id,
        )
    except DocumentNotFoundError as exc:
        logger.warning("Document not found: %s", exc.message)
        raise
    except (RAGError, VectorStoreError) as exc:
        logger.error("Chat error: %s", exc.message)
        raise
    except Exception as exc:
        logger.exception("Unexpected chat error")
        raise FinSightError(f"Chat failed: {exc}") from exc
