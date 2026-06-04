"use client";

import type { ChatMessage } from "@/lib/ai/types";

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-accent text-white"
            : "rounded-bl-sm border border-border bg-surface text-text"
        }`}
      >
        {message.content || (isStreaming ? <TypingIndicator /> : null)}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <span className="flex items-center gap-1 py-0.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
    </span>
  );
}
