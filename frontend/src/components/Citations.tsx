import { BookOpen, FileText } from "lucide-react";
import type { Citation } from "../types";

interface CitationsProps {
  citations: Citation[];
}

export default function Citations({ citations }: CitationsProps) {
  if (!citations.length) return null;

  return (
    <div className="citations">
      <div className="citations-header">
        <BookOpen size={14} />
        Verified Sources ({citations.length})
      </div>
      <div className="citations-list">
        {citations.map((citation, index) => (
          <div key={`${citation.source}-${citation.page}-${index}`} className="citation-card">
            <div className="citation-source">
              <FileText size={14} />
              <span>{citation.source}</span>
              {citation.page != null && (
                <span className="citation-page">Page {citation.page}</span>
              )}
              {citation.score != null && (
                <span className="citation-score">
                  match {(1 - citation.score).toFixed(2)}
                </span>
              )}
            </div>
            <p className="citation-excerpt">{citation.excerpt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
