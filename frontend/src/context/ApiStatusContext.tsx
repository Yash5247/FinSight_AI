import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { checkHealth, getApiDisplayUrl } from "../api/client";

export type ApiStatus = "checking" | "online" | "degraded" | "offline" | "waking";

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
  const apiUrl = getApiDisplayUrl();

  const recheck = useCallback(async () => {
    setStatus("checking");
    setErrorMessage(null);
    setMissingEnv([]);

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
      const message = err instanceof Error ? err.message : "Cannot reach the backend API.";
      if (message.includes("timed out") || message.includes("waking up")) {
        setStatus("waking");
      } else {
        setStatus("offline");
      }
      setErrorMessage(message);
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
