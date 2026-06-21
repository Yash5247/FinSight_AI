"""Retrieval-Augmented Generation service."""

from typing import List, Optional

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import Settings
from app.core.exceptions import RAGError
from app.logging_config import get_logger
from app.models.schemas import ChatResponse, Citation
from app.services.pinecone_service import PineconeService

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are FinSight AI, an expert financial analyst assistant specializing in Indian corporate annual reports.

Your role is to answer questions accurately based ONLY on the provided context from uploaded annual reports (e.g., TCS, Infosys, Reliance, HDFC Bank).

Rules:
1. Base your answers strictly on the provided context. Do not invent figures or facts.
2. If the context does not contain enough information, clearly state that you cannot find the answer in the uploaded report(s).
3. Use precise financial terminology and cite specific numbers when available.
4. Format currency in INR (₹) or as stated in the report.
5. Be concise but thorough. Use bullet points for multi-part answers when helpful.
6. When referencing data, mention which section or page it came from if available in the context.

Context from annual report(s):
{context}
"""

HUMAN_PROMPT = """Question: {question}

Provide a clear, accurate answer based on the context above. If citing specific figures, ensure they match the context exactly."""


class RAGService:
    """Orchestrate retrieval and answer generation with citations."""

    def __init__(self, settings: Settings, pinecone_service: PineconeService) -> None:
        self._settings = settings
        self._pinecone_service = pinecone_service
        self._llm = ChatOpenAI(
            model=settings.chat_model,
            openai_api_key=settings.openai_api_key,
            temperature=0.1,
        )
        self._prompt = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("human", HUMAN_PROMPT),
            ]
        )
        logger.info("Initialized RAG service with model: %s", settings.chat_model)

    def _build_context(self, documents: List[Document]) -> str:
        """Format retrieved chunks into context string."""
        sections: List[str] = []
        for idx, doc in enumerate(documents, start=1):
            source = doc.metadata.get("source", "Unknown")
            page = doc.metadata.get("page", "N/A")
            company = doc.metadata.get("company_name", "")
            header = f"[Source {idx}: {source}, Page {page}"
            if company:
                header += f", {company}"
            header += "]"
            sections.append(f"{header}\n{doc.page_content}")
        return "\n\n---\n\n".join(sections)

    def _build_citations(self, documents: List[Document]) -> List[Citation]:
        """Build citation objects from retrieved documents."""
        citations: List[Citation] = []
        seen_excerpts: set[str] = set()

        for doc in documents:
            excerpt = doc.page_content[:400].strip()
            if len(doc.page_content) > 400:
                excerpt += "..."

            # Deduplicate very similar excerpts
            excerpt_key = excerpt[:100]
            if excerpt_key in seen_excerpts:
                continue
            seen_excerpts.add(excerpt_key)

            page = doc.metadata.get("page")
            citations.append(
                Citation(
                    source=doc.metadata.get("source", "Unknown"),
                    page=int(page) if page is not None else None,
                    excerpt=excerpt,
                    score=doc.metadata.get("score"),
                )
            )
        return citations

    async def answer_question(
        self,
        question: str,
        document_id: Optional[str] = None,
    ) -> ChatResponse:
        """Retrieve relevant chunks and generate an answer with citations."""
        try:
            documents = self._pinecone_service.similarity_search(
                query=question,
                document_id=document_id,
            )

            if not documents:
                return ChatResponse(
                    answer=(
                        "I couldn't find any relevant information in the uploaded reports "
                        "to answer your question. Please upload an annual report first or "
                        "try rephrasing your question."
                    ),
                    citations=[],
                    document_id=document_id,
                )

            context = self._build_context(documents)
            chain = self._prompt | self._llm
            result = await chain.ainvoke(
                {"context": context, "question": question}
            )

            answer_text = result.content if hasattr(result, "content") else str(result)
            citations = self._build_citations(documents)

            logger.info(
                "Generated answer for question (document_id=%s, citations=%d)",
                document_id or "all",
                len(citations),
            )

            return ChatResponse(
                answer=answer_text,
                citations=citations,
                document_id=document_id,
            )
        except Exception as exc:
            if isinstance(exc, RAGError):
                raise
            raise RAGError(f"Failed to generate answer: {exc}") from exc
