import { AlertCircle, RefreshCw, Server, X } from "lucide-react";
import { useState } from "react";
import { useApiStatus } from "../context/ApiStatusContext";
import Button from "./ui/Button";

export default function ApiStatusBanner() {
  const { status, apiUrl, errorMessage, recheck } = useApiStatus();
  const [dismissed, setDismissed] = useState(false);

  if (status === "online" || dismissed) return null;

  const isMisconfigured = status === "misconfigured";
  const isDegraded = status === "degraded";

  return (
    <div className={`api-banner api-banner--${status}`}>
      <div className="api-banner-inner">
        <div className="api-banner-icon">
          {status === "checking" ? (
            <RefreshCw size={20} className="spin" />
          ) : isMisconfigured ? (
            <AlertCircle size={20} />
          ) : (
            <Server size={20} />
          )}
        </div>
        <div className="api-banner-content">
          <strong>
            {status === "checking" && "Connecting to backend..."}
            {isMisconfigured && "Frontend configuration required"}
            {isDegraded && "Backend API keys missing on Render"}
            {status === "offline" && "Backend API is not reachable"}
          </strong>
          <p>
            {isMisconfigured ? (
              <>
                Set <code>VITE_API_URL</code> in Vercel → Settings → Environment Variables
                to your Render backend URL (e.g. <code>https://finsight-ai.onrender.com</code>),
                then <strong>Redeploy</strong>.
              </>
            ) : isDegraded ? (
              <>
                {errorMessage}. On Render → your service → <strong>Environment</strong>,
                add the missing variables and click <strong>Save &amp; Deploy</strong>.
              </>
            ) : status === "offline" ? (
              <>
                {errorMessage}. Deploy the backend on Render and ensure API keys are set.
                Current API URL: <code>{apiUrl}</code>
              </>
            ) : (
              "Checking API connection..."
            )}
          </p>
          {!isMisconfigured && status === "offline" && (
            <details className="api-banner-steps">
              <summary>Setup checklist</summary>
              <ol>
                <li>Deploy backend folder on Render with OpenAI + Pinecone keys</li>
                <li>Set <code>CORS_ORIGINS</code> to your Vercel URL on Render</li>
                <li>Set <code>VITE_API_URL</code> on Vercel to your Render URL</li>
                <li>Redeploy both services</li>
              </ol>
            </details>
          )}
        </div>
        <div className="api-banner-actions">
          {status !== "checking" && (
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
