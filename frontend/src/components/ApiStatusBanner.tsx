import { AlertCircle, RefreshCw, Server, X } from "lucide-react";
import { useState } from "react";
import { RENDER_BACKEND_URL } from "../api/client";
import { useApiStatus } from "../context/ApiStatusContext";
import Button from "./ui/Button";

export default function ApiStatusBanner() {
  const { status, apiUrl, errorMessage, recheck } = useApiStatus();
  const [dismissed, setDismissed] = useState(false);

  if (status === "online" || dismissed) return null;

  const isDegraded = status === "degraded";
  const isWaking = status === "waking" || status === "checking";

  return (
    <div className={`api-banner api-banner--${status}`}>
      <div className="api-banner-inner">
        <div className="api-banner-icon">
          {isWaking ? (
            <RefreshCw size={20} className="spin" />
          ) : isDegraded ? (
            <AlertCircle size={20} />
          ) : (
            <Server size={20} />
          )}
        </div>
        <div className="api-banner-content">
          <strong>
            {status === "checking" && "Connecting to backend (may take up to 60s on free Render)..."}
            {isWaking && "Render backend is waking up — please wait"}
            {isDegraded && "Backend API keys missing on Render"}
            {status === "offline" && "Backend API is not reachable"}
          </strong>
          <p>
            {isDegraded ? (
              <>
                {errorMessage}. On Render → Environment, add missing keys and redeploy.
              </>
            ) : isWaking ? (
              <>
                Render free tier sleeps after inactivity. Retries automatically — or open{" "}
                <a href={`${RENDER_BACKEND_URL}/health`} target="_blank" rel="noopener noreferrer">
                  {RENDER_BACKEND_URL}/health
                </a>{" "}
                in a new tab to wake it, then click Retry.
              </>
            ) : status === "offline" ? (
              <>
                {errorMessage}
                <br />
                Backend target: <code>{apiUrl}</code>
              </>
            ) : (
              "Checking API via Vercel proxy..."
            )}
          </p>
        </div>
        <div className="api-banner-actions">
          {!isWaking && (
            <Button variant="secondary" size="sm" onClick={() => recheck()}>
              <RefreshCw size={14} />
              Retry
            </Button>
          )}
          <button
            className="api-banner-dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
