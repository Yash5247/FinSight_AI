import type { ChatResponse, UploadResponse, ApiError, HealthResponse } from "../types";

/** Resolve API base URL — VITE_API_URL is required in production (Vercel). */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  // Local dev fallback via Vite proxy
  return "/api";
}

const API_BASE = getApiBaseUrl();

class ApiConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConnectionError";
  }
}

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

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`;
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiConnectionError(
      import.meta.env.PROD && !import.meta.env.VITE_API_URL
        ? "Backend URL not configured. Set VITE_API_URL on Vercel and redeploy."
        : `Cannot connect to API at ${url}. Is the backend running on Render?`
    );
  }
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

  const response = await apiFetch("/upload", {
    method: "POST",
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

export async function sendChatMessage(
  question: string,
  documentId?: string
): Promise<ChatResponse> {
  const response = await apiFetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      document_id: documentId || null,
    }),
  });

  return handleResponse<ChatResponse>(response);
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await apiFetch("/health");
  return handleResponse<HealthResponse>(response);
}
