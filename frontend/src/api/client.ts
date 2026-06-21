import type { ChatResponse, UploadResponse, ApiError, HealthResponse } from "../types";

/** Render backend URL — used by Vercel proxy in vercel.json */
export const RENDER_BACKEND_URL = "https://finsight-ai-iw2a.onrender.com";

/** Resolve API base URL for fetch calls. */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "").replace(/\/health$/i, "");
  }
  // Production: same-origin proxy via vercel.json → avoids CORS issues
  if (import.meta.env.PROD) return "/api";
  // Local dev: Vite proxy
  return "/api";
}

/** Human-readable API target for error messages. */
export function getApiDisplayUrl(): string {
  const base = getApiBaseUrl();
  if (base.startsWith("http")) return base;
  if (import.meta.env.PROD) return `${RENDER_BACKEND_URL} (via Vercel proxy)`;
  return "http://localhost:8000 (dev proxy)";
}

const API_BASE = getApiBaseUrl();
const RENDER_WAKE_RETRIES = 4;
const RENDER_WAKE_DELAY_MS = 8000;
const REQUEST_TIMEOUT_MS = 90000;

class ApiConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConnectionError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  let lastError: unknown;

  for (let attempt = 1; attempt <= RENDER_WAKE_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      const isLastAttempt = attempt === RENDER_WAKE_RETRIES;
      const isAbort = error instanceof DOMException && error.name === "AbortError";

      if (!isLastAttempt) {
        await sleep(RENDER_WAKE_DELAY_MS);
        continue;
      }

      if (isAbort) {
        throw new ApiConnectionError(
          `Backend timed out waking up on Render (free tier can take up to 60s). ` +
            `Click Retry or open ${RENDER_BACKEND_URL}/health in a new tab first, then refresh this page.`
        );
      }

      throw new ApiConnectionError(
        `Cannot connect to backend at ${getApiDisplayUrl()}. ` +
          `If Render free tier was sleeping, click Retry and wait ~60 seconds. ` +
          `Direct test: ${RENDER_BACKEND_URL}/health`
      );
    }
  }

  throw lastError;
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
