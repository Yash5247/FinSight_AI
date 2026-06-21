import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UploadedDocument } from "../types";

interface DocumentContextValue {
  documents: UploadedDocument[];
  activeDocumentId: string | null;
  addDocument: (doc: UploadedDocument) => void;
  setActiveDocumentId: (id: string | null) => void;
  clearDocuments: () => void;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  const addDocument = useCallback((doc: UploadedDocument) => {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.document_id === doc.document_id);
      if (exists) return prev;
      return [...prev, doc];
    });
    setActiveDocumentId(doc.document_id);
  }, []);

  const clearDocuments = useCallback(() => {
    setDocuments([]);
    setActiveDocumentId(null);
  }, []);

  return (
    <DocumentContext.Provider
      value={{
        documents,
        activeDocumentId,
        addDocument,
        setActiveDocumentId,
        clearDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
}
