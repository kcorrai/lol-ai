"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatMessage } from "@/lib/ai/types";
import type { CoachPersona } from "@/lib/ai/chatSystemPrompt";

const STORAGE_KEY = (id: string) => `coaching-chat-${id}`;
const MAX_STORED = 40;

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  remaining: number | null;
  dailyLimit: number | null;
  error: string | null;
  submit: (content: string) => Promise<void>;
  clear: () => void;
}

export function useCoachingChat(
  riotAccountId: string | null | undefined,
  persona: CoachPersona = "direct"
): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    if (!riotAccountId) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(riotAccountId));
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[]);
    } catch {
      // ignore corrupt storage
    }
  }, [riotAccountId]);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    if (!riotAccountId || messages.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY(riotAccountId), JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      // ignore quota errors
    }
  }, [messages, riotAccountId]);

  const submit = useCallback(
    async (content: string) => {
      if (!riotAccountId || isStreaming || !content.trim()) return;

      const userMsg: ChatMessage = { role: "user", content: content.trim() };
      const next = [...messages, userMsg];
      setMessages(next);
      setIsStreaming(true);
      setError(null);

      try {
        const res = await fetch(`/api/riot/${riotAccountId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, persona }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
          throw new Error(json.error?.message ?? `Error ${res.status}`);
        }

        // Track rate limit headers
        const rem = res.headers.get("X-RateLimit-Remaining");
        const lim = res.headers.get("X-RateLimit-Limit");
        if (rem) setRemaining(parseInt(rem, 10));
        if (lim) setDailyLimit(parseInt(lim, 10));

        // Stream response body
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        // Optimistically append an empty assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: assistantContent };
            return updated;
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        // Remove the optimistically added empty assistant message if streaming never started
        setMessages((prev) => (prev[prev.length - 1]?.content === "" ? prev.slice(0, -1) : prev));
      } finally {
        setIsStreaming(false);
      }
    },
    [riotAccountId, isStreaming, messages, persona]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    if (riotAccountId) localStorage.removeItem(STORAGE_KEY(riotAccountId));
  }, [riotAccountId]);

  return { messages, isStreaming, remaining, dailyLimit, error, submit, clear };
}
