"use client";

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import { useCoachingChat } from "@/hooks/useCoachingChat";
import { ChatBubble } from "@/domains/coaching/components/ChatBubble";
import type { CoachPersona } from "@/lib/ai/chatSystemPrompt";
import { cn } from "@/lib/utils";

const SUGGESTED = [
  "What's my biggest weakness right now?",
  "Why am I losing despite being ahead?",
  "How should I play when my team is behind?",
  "Which champion should I focus on this week?",
  "Why is my CS so low?",
  "When should I roam?",
];

const PERSONAS: { value: CoachPersona; label: string; description: string }[] = [
  { value: "direct",       label: "Direct",        description: "Straight to the point, concise and clear" },
  { value: "analytical",   label: "Analytical",    description: "Data-driven, numerical analysis" },
  { value: "motivational", label: "Motivational",  description: "Encouraging and positive" },
];

interface CoachingChatViewProps {
  riotAccountId: string;
  playerLabel: string;
}

export function CoachingChatView({ riotAccountId, playerLabel }: CoachingChatViewProps) {
  const [persona, setPersona] = useState<CoachPersona>("direct");
  const { messages, isStreaming, remaining, dailyLimit, error, submit, clear } =
    useCoachingChat(riotAccountId, persona);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="border-b border-border px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Your AI Coach</p>
            <p className="text-xs text-text-muted">{playerLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            {dailyLimit !== null && (
              <span className="text-xs text-text-muted">
                {remaining}/{dailyLimit} messages remaining
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={clear}
                className="text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
              >
                New Chat
              </button>
            )}
          </div>
        </div>
        {/* Persona selector — only shown before first message */}
        {messages.length === 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {PERSONAS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPersona(p.value)}
                title={p.description}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  persona === p.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-muted hover:border-accent/40 hover:text-text"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-center text-xs text-text-muted">
              Ask me anything about your performance, champion pool, or growth plan.
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
            — 50 messages per day.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || limitReached}
              placeholder="Ask your coach…"
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
