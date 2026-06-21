import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { checkHealth, getApiBaseUrl } from "../api/client";

export type ApiStatus = "checking" | "online" | "offline" | "misconfigured";

interface ApiStatusContextValue {
  status: ApiStatus;
  apiUrl: string;
  errorMessage: string | null;
  recheck: () => Promise<void>;
}

const ApiStatusContext = createContext<ApiStatusContextValue | null>(null);

export function ApiStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const apiUrl = getApiBaseUrl();

  const recheck = useCallback(async () => {
    setStatus("checking");
    setErrorMessage(null);

    if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
      setStatus("misconfigured");
      setErrorMessage(
        "VITE_API_URL is not set on Vercel. Add your Render backend URL and redeploy."
      );
      return;
    }

    try {
      await checkHealth();
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
    <ApiStatusContext.Provider value={{ status, apiUrl, errorMessage, recheck, }}>
      {children}
    </ApiStatusContext.Provider>
  );
}

export function useApiStatus() {
  const ctx = useContext(ApiStatusContext);
  if (!ctx) throw new Error("useApiStatus must be used within ApiStatusProvider");
  return ctx;
}
