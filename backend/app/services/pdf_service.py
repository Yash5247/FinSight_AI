"""PDF text extraction service."""

import io
import re
from typing import List, Optional, Tuple

from pypdf import PdfReader

from app.core.exceptions import PDFProcessingError
from app.logging_config import get_logger

logger = get_logger(__name__)

# Common Indian company names for auto-detection from filenames
COMPANY_PATTERNS = {
    r"tcs|tata\s*consultancy": "TCS",
    r"infosys": "Infosys",
    r"reliance": "Reliance Industries",
    r"hdfc\s*bank|hdfcbank": "HDFC Bank",
    r"wipro": "Wipro",
    r"hcl": "HCL Technologies",
    r"icici": "ICICI Bank",
    r"sbi|state\s*bank": "State Bank of India",
    r"axis\s*bank": "Axis Bank",
    r"bajaj": "Bajaj Finance",
}


class PDFService:
    """Extract and validate text from PDF documents."""

    MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

    def validate_pdf(self, content: bytes, filename: str) -> None:
        """Validate PDF file size and format."""
        if not filename.lower().endswith(".pdf"):
            raise PDFProcessingError("Only PDF files are supported.")

        if len(content) == 0:
            raise PDFProcessingError("Uploaded file is empty.")

        if len(content) > self.MAX_FILE_SIZE_BYTES:
            raise PDFProcessingError(
                f"File exceeds maximum size of {self.MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            )

        try:
            reader = PdfReader(io.BytesIO(content))
            if len(reader.pages) == 0:
                raise PDFProcessingError("PDF contains no pages.")
        except PDFProcessingError:
            raise
        except Exception as exc:
            raise PDFProcessingError(f"Invalid or corrupted PDF file: {exc}") from exc

    def extract_text(self, content: bytes) -> Tuple[List[str], int]:
        """
        Extract text from each page of a PDF.

        Returns:
            Tuple of (list of page texts, page count)
        """
        try:
            reader = PdfReader(io.BytesIO(content))
            pages: List[str] = []

            for page_num, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                text = text.strip()
                if text:
                    pages.append(text)
                else:
                    logger.warning("Page %d returned empty text", page_num)

            if not pages:
                raise PDFProcessingError(
                    "No extractable text found in PDF. The document may be scanned/image-based."
                )

            return pages, len(reader.pages)
        except PDFProcessingError:
            raise
        except Exception as exc:
            raise PDFProcessingError(f"Failed to extract text from PDF: {exc}") from exc

    def detect_company_name(
        self,
        filename: str,
        page_texts: List[str],
    ) -> Optional[str]:
        """Attempt to detect company name from filename or first pages."""
        search_text = f"{filename} {' '.join(page_texts[:3])}".lower()

        for pattern, company in COMPANY_PATTERNS.items():
            if re.search(pattern, search_text, re.IGNORECASE):
                return company

        # Fallback: clean filename
        name = re.sub(r"[_\-]", " ", filename)
        name = re.sub(r"\.pdf$", "", name, flags=re.IGNORECASE)
        name = re.sub(r"\s*(annual|report|fy\d+|20\d{2}).*", "", name, flags=re.IGNORECASE)
        cleaned = name.strip()
        return cleaned if cleaned else None
