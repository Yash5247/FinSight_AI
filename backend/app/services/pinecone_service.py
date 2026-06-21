"""Pinecone vector store service."""

import uuid
from typing import List, Optional

from langchain_core.documents import Document
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec

from app.config import Settings
from app.core.exceptions import DocumentNotFoundError, VectorStoreError
from app.logging_config import get_logger
from app.services.embedding_service import EmbeddingService

logger = get_logger(__name__)

# text-embedding-3-small dimension
EMBEDDING_DIMENSION = 1536


class PineconeService:
    """Manage document storage and retrieval in Pinecone."""

    def __init__(self, settings: Settings, embedding_service: EmbeddingService) -> None:
        self._settings = settings
        self._embedding_service = embedding_service
        self._pc = Pinecone(api_key=settings.pinecone_api_key)
        self._ensure_index()
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def _ensure_index(self) -> None:
        """Create Pinecone index if it does not exist."""
        index_name = self._settings.pinecone_index_name
        try:
            existing = {idx.name for idx in self._pc.list_indexes()}
        except Exception as exc:
            raise VectorStoreError(
                f"Invalid PINECONE_API_KEY or Pinecone account issue: {exc}"
            ) from exc

        if index_name not in existing:
            logger.info(
                "Creating Pinecone index '%s' (cloud=%s, region=%s)",
                index_name,
                self._settings.pinecone_cloud,
                self._settings.pinecone_region,
            )
            try:
                self._pc.create_index(
                    name=index_name,
                    dimension=EMBEDDING_DIMENSION,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud=self._settings.pinecone_cloud,
                        region=self._settings.pinecone_region,
                    ),
                )
            except Exception as exc:
                raise VectorStoreError(
                    "Failed to create Pinecone index. On Render, set "
                    "PINECONE_CLOUD=aws and PINECONE_REGION=us-east-1 (defaults). "
                    "Or create index 'finsight-reports' manually in Pinecone console. "
                    f"Details: {exc}"
                ) from exc
        else:
            logger.info("Using existing Pinecone index: %s", index_name)

    def _get_vector_store(self) -> PineconeVectorStore:
        """Return a LangChain Pinecone vector store instance."""
        return PineconeVectorStore(
            index_name=self._settings.pinecone_index_name,
            embedding=self._embedding_service.embeddings,
            pinecone_api_key=self._settings.pinecone_api_key,
        )

    def index_document(
        self,
        page_texts: List[str],
        filename: str,
        company_name: Optional[str] = None,
    ) -> tuple[str, int]:
        """
        Chunk, embed, and store a document in Pinecone.

        Returns:
            Tuple of (document_id, chunk_count)
        """
        document_id = str(uuid.uuid4())
        documents: List[Document] = []

        for page_num, page_text in enumerate(page_texts, start=1):
            documents.append(
                Document(
                    page_content=page_text,
                    metadata={
                        "document_id": document_id,
                        "source": filename,
                        "page": page_num,
                        "company_name": company_name or "Unknown",
                    },
                )
            )

        try:
            chunks = self._text_splitter.split_documents(documents)

            if not chunks:
                raise VectorStoreError("Document produced no chunks after splitting.")

            # Enrich chunk metadata with chunk index
            for idx, chunk in enumerate(chunks):
                chunk.metadata["chunk_index"] = idx

            vector_store = self._get_vector_store()
            vector_store.add_documents(chunks)

            logger.info(
                "Indexed document %s (%s): %d chunks",
                document_id,
                filename,
                len(chunks),
            )
            return document_id, len(chunks)
        except VectorStoreError:
            raise
        except Exception as exc:
            raise VectorStoreError(f"Failed to index document in Pinecone: {exc}") from exc

    def similarity_search(
        self,
        query: str,
        document_id: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> List[Document]:
        """Retrieve relevant document chunks for a query."""
        k = top_k or self._settings.top_k
        filter_dict = {"document_id": document_id} if document_id else None

        try:
            vector_store = self._get_vector_store()
            results = vector_store.similarity_search_with_score(
                query,
                k=k,
                filter=filter_dict,
            )

            if document_id and not results:
                raise DocumentNotFoundError(
                    f"No indexed content found for document_id: {document_id}"
                )

            documents: List[Document] = []
            for doc, score in results:
                doc.metadata["score"] = float(score)
                documents.append(doc)

            logger.info(
                "Retrieved %d chunks for query (document_id=%s)",
                len(documents),
                document_id or "all",
            )
            return documents
        except DocumentNotFoundError:
            raise
        except Exception as exc:
            raise VectorStoreError(f"Similarity search failed: {exc}") from exc

    def document_exists(self, document_id: str) -> bool:
        """Check if a document has vectors in the index."""
        try:
            results = self.similarity_search(
                query="annual report financial highlights",
                document_id=document_id,
                top_k=1,
            )
            return len(results) > 0
        except DocumentNotFoundError:
            return False
