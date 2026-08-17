"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useCoachingChat } from "@/hooks/useCoachingChat";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useRankedData } from "@/hooks/useRankedData";
import { ChatContextHeader } from "@/domains/coaching/components/chat/ChatContextHeader";
import { ChatMessages } from "@/domains/coaching/components/chat/ChatMessages";
import { ChatComposer } from "@/domains/coaching/components/chat/ChatComposer";
import { ChatContextRail } from "@/domains/coaching/components/chat/ChatContextRail";
import type { CoachPersona } from "@/lib/ai/chatSystemPrompt";
import { cn } from "@/lib/utils";

const PERSONAS: { value: CoachPersona; label: string; description: string }[] = [
  { value: "direct", label: "Direct", description: "Straight to the point, concise and clear" },
  { value: "analytical", label: "Analytical", description: "Data-driven, numerical analysis" },
  { value: "motivational", label: "Motivational", description: "Encouraging and positive" },
];

interface CoachingChatViewProps {
  riotAccountId: string;
  playerLabel: string;
}

export function CoachingChatView({
  riotAccountId,
  playerLabel,
}: CoachingChatViewProps): React.JSX.Element {
  const [persona, setPersona] = useState<CoachPersona>("direct");
  const { messages, isStreaming, remaining, dailyLimit, error, submit, clear } = useCoachingChat(
    riotAccountId,
    persona
  );
  const { data: profile } = usePerformanceProfile(riotAccountId);
  const { data: ranked } = useRankedData(riotAccountId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const limitReached = remaining !== null && remaining <= 0;
  const quota =
    dailyLimit !== null && remaining !== null ? `${remaining} of ${dailyLimit} left today` : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 flex-none flex-wrap items-center gap-3 border-b border-line-1 bg-surface/70 px-5 backdrop-blur md:px-8">
        <Link
          href="/dashboard"
          className="font-mono text-[10.5px] uppercase tracking-label text-fg-3 hover:text-fg-1"
        >
          ← Dashboard
        </Link>
        <span className="h-4 w-px bg-line-2" />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-fg-1">
          Coach Chat
        </span>
        <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-fg-4 lg:inline">
          {playerLabel}
        </span>

        <span className="ml-auto flex items-center gap-2.5">
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="font-mono text-[9.5px] uppercase tracking-label text-fg-4 hover:text-fg-1"
            >
              New chat
            </button>
          )}
          <span className="hidden font-mono text-[10px] uppercase tracking-label text-text-muted sm:inline">
            Tone
          </span>
          <span className="flex gap-1">
            {PERSONAS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPersona(p.value)}
                title={p.description}
                className={cn(
                  "tag-cut border px-2 py-1 font-mono text-[9.5px] uppercase tracking-wide transition-colors",
                  persona === p.value
                    ? "border-acid-500 bg-acid-500/10 text-acid-500"
                    : "border-line-2 text-fg-3 hover:text-fg-1"
                )}
              >
                {p.label}
              </button>
            ))}
          </span>
        </span>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col border-line-1 lg:border-r">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-6 md:px-8">
            <div className="mx-auto grid max-w-[760px] gap-4">
              <ChatContextHeader profile={profile} />
              <ChatMessages messages={messages} isStreaming={isStreaming} />
              {error && <p className="text-center text-xs text-danger">{error}</p>}
              <div ref={bottomRef} />
            </div>
          </div>

          {limitReached ? (
            <div className="border-t border-line-1 bg-surface-dark px-5 py-5 text-center md:px-8">
              <p className="text-xs text-text-muted">
                Daily limit reached.{" "}
                <Link href="/settings/billing" className="text-acid-500 underline">
                  Upgrade to Pro
                </Link>{" "}
                — 50 messages per day.
              </p>
            </div>
          ) : (
            <ChatComposer
              onSubmit={(value) => void submit(value)}
              disabled={isStreaming}
              quota={quota}
            />
          )}
        </div>

        <aside className="hidden min-w-0 lg:block">
          <ChatContextRail profile={profile} rank={ranked?.rank} />
        </aside>
      </div>
    </div>
  );
}
