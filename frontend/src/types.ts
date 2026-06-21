export interface Citation {
  source: string;
  page: number | null;
  excerpt: string;
  score: number | null;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  company_name: string | null;
  page_count: number;
  chunk_count: number;
  message: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  document_id: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface UploadedDocument {
  document_id: string;
  filename: string;
  company_name: string | null;
  page_count: number;
  chunk_count: number;
}

export interface ApiError {
  detail: string;
  error_type?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  pinecone_index: string;
}
