"use client";

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import { useCoachingChat } from "@/hooks/useCoachingChat";
import { ChatBubble } from "@/domains/coaching/components/ChatBubble";

const SUGGESTED = [
  "What's my biggest weakness right now?",
  "Why do I keep losing games where I go positive?",
  "How should I play when my team is losing?",
  "What champion should I focus on this week?",
];

interface CoachingChatViewProps {
  riotAccountId: string;
  playerLabel: string;
}

export function CoachingChatView({ riotAccountId, playerLabel }: CoachingChatViewProps) {
  const { messages, isStreaming, remaining, dailyLimit, error, submit, clear } =
    useCoachingChat(riotAccountId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  function handleSubmit() {
    const val = input.trim();
    if (!val || isStreaming) return;
    setInput("");
    void submit(val);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const limitReached = remaining !== null && remaining <= 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-text">Your AI Coach</p>
          <p className="text-xs text-text-muted">{playerLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {dailyLimit !== null && (
            <span className="text-xs text-text-muted">
              {remaining}/{dailyLimit} messages today
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
            >
              New chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-center text-xs text-text-muted">
              Ask anything about your performance, champion pool, or improvement plan.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => void submit(q)}
                  disabled={isStreaming}
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-xs text-text-muted transition-colors hover:border-accent/50 hover:text-text disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatBubble
              key={i}
              message={msg}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
            />
          ))
        )}

        {error && (
          <p className="text-center text-xs text-danger">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        {limitReached ? (
          <p className="text-center text-xs text-text-muted">
            Daily limit reached.{" "}
            <a href="/settings/billing" className="text-accent underline">
              Upgrade to Pro
            </a>{" "}
            for 50 messages/day.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || limitReached}
              placeholder="Ask your coach..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={isStreaming || !input.trim()}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
