import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import { sendChatMessage } from "../api/client";
import { useDocuments } from "../context/DocumentContext";
import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../types";
import FadeIn from "./ui/FadeIn";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

const SUGGESTED_QUESTIONS = [
  "What was the total revenue this fiscal year?",
  "What are the key risk factors mentioned?",
  "Summarize the CEO's message to shareholders.",
  "What is the dividend per share?",
  "How did operating margins change year-over-year?",
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatPage() {
  const { documents, activeDocumentId, setActiveDocumentId } = useDocuments();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInput("");

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(trimmed, activeDocumentId ?? undefined);
      const assistantMessage: ChatMessageType = {
        id: generateId(),
        role: "assistant",
        content: response.answer,
        citations: response.citations,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a response.");
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const activeDoc = documents.find((d) => d.document_id === activeDocumentId);

  return (
    <div className="page">
      <FadeIn>
        <div className="page-header">
          <Badge variant="accent">
            <Sparkles size={14} />
            AI Chat
          </Badge>
          <h2>Financial Q&amp;A Assistant</h2>
          <p>
            Ask natural language questions about your uploaded reports. Every response is
            grounded in retrieved document chunks with page-level citations.
          </p>
        </div>
      </FadeIn>

      {error && <div className="alert alert-error">{error}</div>}

      {documents.length === 0 && (
        <div className="alert alert-info">
          <FileText size={18} />
          <div>
            No documents indexed yet.{" "}
            <Link to="/upload">Upload an annual report</Link> to start chatting.
          </div>
        </div>
      )}

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="glass-card">
            <h3>
              <FileText size={16} />
              Documents
            </h3>
            {documents.length === 0 ? (
              <p className="muted-text">No documents indexed</p>
            ) : (
              <ul className="document-list">
                <li
                  className={`document-item${activeDocumentId === null ? " active" : ""}`}
                  onClick={() => setActiveDocumentId(null)}
                >
                  <div className="name">All Documents</div>
                  <div className="meta">Cross-report semantic search</div>
                </li>
                {documents.map((doc) => (
                  <li
                    key={doc.document_id}
                    className={`document-item${
                      activeDocumentId === doc.document_id ? " active" : ""
                    }`}
                    onClick={() => setActiveDocumentId(doc.document_id)}
                  >
                    <div className="name">{doc.company_name || doc.filename}</div>
                    <div className="meta">
                      {doc.page_count} pages · {doc.chunk_count} chunks
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {activeDoc && (
            <div className="glass-card">
              <h3>Active Scope</h3>
              <p className="scope-text">
                Searching: <strong>{activeDoc.company_name || activeDoc.filename}</strong>
              </p>
            </div>
          )}

          {documents.length === 0 && (
            <Button to="/upload" variant="secondary" icon={<Upload size={16} />}>
              Upload Report
            </Button>
          )}
        </aside>

        <div className="glass-card chat-main">
          <div className="chat-toolbar">
            <MessageSquare size={18} />
            <span>FinSight AI Assistant</span>
            {isLoading && <Loader2 size={16} className="spin muted-text" />}
          </div>

          <div className="chat-messages">
            {messages.length === 0 && !isLoading ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <Bot size={48} strokeWidth={1.25} />
                </div>
                <h3>Start a conversation</h3>
                <p>Ask anything about revenue, risks, dividends, or management outlook.</p>
                <div className="suggested-questions">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      className="suggestion-chip"
                      onClick={() => sendMessage(q)}
                      disabled={documents.length === 0}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="chat-message assistant">
                    <div className="chat-avatar">
                      <Bot size={16} />
                    </div>
                    <div className="chat-bubble">
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="chat-input-area">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={
                documents.length === 0
                  ? "Upload a document first..."
                  : "Ask about revenue, risks, dividends..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || documents.length === 0}
              rows={1}
            />
            <button
              className="btn btn--primary btn--md chat-send"
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim() || documents.length === 0}
              aria-label="Send message"
            >
              {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
