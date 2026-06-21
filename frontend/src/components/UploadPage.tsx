import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { Building2, CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";
import { uploadPdf } from "../api/client";
import { useDocuments } from "../context/DocumentContext";
import { useApiStatus } from "../context/ApiStatusContext";
import FadeIn from "./ui/FadeIn";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import SpotlightCard from "./ui/SpotlightCard";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    document_id: string;
    filename: string;
    company_name: string | null;
    page_count: number;
    chunk_count: number;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addDocument } = useDocuments();
  const { status: apiStatus } = useApiStatus();
  const backendReady = apiStatus === "online";

  const handleFile = useCallback((selected: File | null) => {
    setError(null);
    setSuccess(null);
    if (selected && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      setFile(null);
      return;
    }
    setFile(selected);
  }, []);

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadPdf(file, companyName || undefined);
      setSuccess(result);
      addDocument({
        document_id: result.document_id,
        filename: result.filename,
        company_name: result.company_name,
        page_count: result.page_count,
        chunk_count: result.chunk_count,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page">
      <FadeIn>
        <div className="page-header">
          <Badge variant="accent">Document Ingestion</Badge>
          <h2>Upload Annual Report</h2>
          <p>
            Ingest PDF annual reports from TCS, Infosys, Reliance, HDFC Bank and more.
            Our pipeline extracts text, chunks content, generates embeddings, and indexes
            everything in Pinecone for intelligent retrieval.
          </p>
        </div>
      </FadeIn>

      {error && (
        <FadeIn>
          <div className="alert alert-error">{error}</div>
        </FadeIn>
      )}

      <SpotlightCard className="upload-card">
        <div
          className={`upload-zone${isDragging ? " drag-over" : ""}${file ? " has-file" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        >
          <div className="upload-zone-icon">
            <FileUp size={36} strokeWidth={1.5} />
          </div>
          <h3>Drop your PDF here or click to browse</h3>
          <p>Annual reports up to 25 MB · PDF format only</p>
          {file && (
            <div className="file-name">
              <CheckCircle2 size={16} />
              {file.name}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={onFileChange}
            hidden
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="company-name">
            <Building2 size={14} />
            Company Name (optional)
          </label>
          <input
            id="company-name"
            type="text"
            className="form-input"
            placeholder="e.g. TCS, Infosys, Reliance, HDFC Bank"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="upload-actions">
          <Button onClick={handleUpload} disabled={!file || isUploading || !backendReady} icon={isUploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}>
            {isUploading ? "Processing..." : backendReady ? "Upload & Index" : "Backend Offline"}
          </Button>
          {file && (
            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setSuccess(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={isUploading}
            >
              Clear
            </Button>
          )}
        </div>

        {success && (
          <div className="upload-result">
            <div className="upload-result-header">
              <CheckCircle2 size={22} />
              <h4>Document indexed successfully</h4>
            </div>
            <dl className="result-grid">
              <dt>Document ID</dt>
              <dd className="mono">{success.document_id}</dd>
              <dt>Filename</dt>
              <dd>{success.filename}</dd>
              {success.company_name && (
                <>
                  <dt>Company</dt>
                  <dd>{success.company_name}</dd>
                </>
              )}
              <dt>Pages</dt>
              <dd>{success.page_count}</dd>
              <dt>Chunks</dt>
              <dd>{success.chunk_count}</dd>
            </dl>
            <div className="upload-actions">
              <Button to="/chat">Start Chatting</Button>
            </div>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
