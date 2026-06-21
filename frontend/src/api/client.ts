import type { ChatResponse, UploadResponse, ApiError } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const error: ApiError = await response.json();
      message = error.detail || message;
    } catch {
      // use default message
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function uploadPdf(
  file: File,
  companyName?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (companyName?.trim()) {
    formData.append("company_name", companyName.trim());
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

export async function sendChatMessage(
  question: string,
  documentId?: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      document_id: documentId || null,
    }),
  });

  return handleResponse<ChatResponse>(response);
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse<{ status: string }>(response);
}
