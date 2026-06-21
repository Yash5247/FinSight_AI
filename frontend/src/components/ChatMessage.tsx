import { Bot, User } from "lucide-react";
import Citations from "./Citations";
import type { ChatMessage as ChatMessageType } from "../types";

interface ChatMessageProps {
  message: ChatMessageType;
}

function formatContent(content: string): string[] {
  return content.split("\n").filter((line) => line.trim() !== "");
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const lines = formatContent(message.content);

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="chat-avatar">
        {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="chat-bubble">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        {message.role === "assistant" && message.citations && (
          <Citations citations={message.citations} />
        )}
      </div>
    </div>
  );
}
