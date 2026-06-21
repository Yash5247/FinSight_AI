"""PDF upload endpoint."""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.exceptions import FinSightError, PDFProcessingError, VectorStoreError
from app.logging_config import get_logger
from app.models.schemas import UploadResponse
from app.services.pdf_service import PDFService
from app.services.pinecone_service import PineconeService

logger = get_logger(__name__)
router = APIRouter(tags=["Upload"])


def get_pdf_service() -> PDFService:
    return PDFService()


def get_pinecone_service() -> PineconeService:
    from app.main import pinecone_service

    return pinecone_service


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(..., description="Annual report PDF file"),
    company_name: Optional[str] = Form(default=None, description="Optional company name override"),
    pdf_service: PDFService = Depends(get_pdf_service),
    vector_service: PineconeService = Depends(get_pinecone_service),
) -> UploadResponse:
    """
    Upload a PDF annual report, extract text, chunk, embed, and store in Pinecone.
    """
    filename = file.filename or "document.pdf"
    logger.info("Upload request received: %s", filename)

    try:
        content = await file.read()
        pdf_service.validate_pdf(content, filename)
        page_texts, page_count = pdf_service.extract_text(content)

        detected_company = company_name or pdf_service.detect_company_name(filename, page_texts)

        document_id, chunk_count = vector_service.index_document(
            page_texts=page_texts,
            filename=filename,
            company_name=detected_company,
        )

        return UploadResponse(
            document_id=document_id,
            filename=filename,
            company_name=detected_company,
            page_count=page_count,
            chunk_count=chunk_count,
            message=f"Successfully indexed {chunk_count} chunks from {page_count} pages.",
        )
    except PDFProcessingError as exc:
        logger.warning("PDF processing error: %s", exc.message)
        raise
    except VectorStoreError as exc:
        logger.error("Vector store error: %s", exc.message)
        raise
    except Exception as exc:
        logger.exception("Unexpected upload error")
        raise FinSightError(f"Upload failed: {exc}") from exc
