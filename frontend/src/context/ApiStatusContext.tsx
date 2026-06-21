import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { checkHealth, getApiBaseUrl } from "../api/client";

export type ApiStatus = "checking" | "online" | "degraded" | "offline" | "misconfigured";

interface ApiStatusContextValue {
  status: ApiStatus;
  apiUrl: string;
  errorMessage: string | null;
  missingEnv: string[];
  recheck: () => Promise<void>;
}

const ApiStatusContext = createContext<ApiStatusContextValue | null>(null);

export function ApiStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingEnv, setMissingEnv] = useState<string[]>([]);
  const apiUrl = getApiBaseUrl();

  const recheck = useCallback(async () => {
    setStatus("checking");
    setErrorMessage(null);
    setMissingEnv([]);

    if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
      setStatus("misconfigured");
      setErrorMessage(
        "VITE_API_URL is not set on Vercel. Add your Render backend URL and redeploy."
      );
      return;
    }

    try {
      const health = await checkHealth();
      if (!health.configured) {
        setStatus("degraded");
        setMissingEnv(health.missing_env);
        setErrorMessage(
          `Backend is running but missing API keys on Render: ${health.missing_env.join(", ")}`
        );
        return;
      }
      setStatus("online");
    } catch (err) {
      setStatus("offline");
      setErrorMessage(
        err instanceof Error ? err.message : "Cannot reach the backend API."
      );
    }
  }, []);

  useEffect(() => {
    recheck();
  }, [recheck]);

  return (
    <ApiStatusContext.Provider
      value={{ status, apiUrl, errorMessage, missingEnv, recheck }}
    >
      {children}
    </ApiStatusContext.Provider>
  );
}

export function useApiStatus() {
  const ctx = useContext(ApiStatusContext);
  if (!ctx) throw new Error("useApiStatus must be used within ApiStatusProvider");
  return ctx;
}
