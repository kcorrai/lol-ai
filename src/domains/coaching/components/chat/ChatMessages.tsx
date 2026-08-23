"use client";

import type { ChatMessage } from "@/lib/ai/types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

function CoachMark(): React.JSX.Element {
  return (
    <span className="tag-cut grid h-[30px] w-[30px] place-items-center border border-acid-500 bg-acid-500/10 font-display text-[11px] font-extrabold text-acid-500">
      IQ
    </span>
  );
}

/**
 * The coach speaks in a panel, you speak in an accent bubble.
 *
 * Two different shapes rather than two tints of the same one: at a glance down
 * a long thread the shape is what separates the question from the answer.
 */
export function ChatMessages({ messages, isStreaming }: ChatMessagesProps): React.JSX.Element {
  return (
    <div className="grid gap-4">
      {messages.map((message, i) => {
        const streamingHere =
          isStreaming && i === messages.length - 1 && message.role === "assistant";

        if (message.role === "user") {
          return (
            <div key={i} className="flex justify-end">
              <div className="notch max-w-[72%] border border-acid-500 bg-acid-500/10 px-4 py-3">
                <p className="m-0 whitespace-pre-wrap text-[14.5px] text-fg-1">{message.content}</p>
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="grid grid-cols-[30px_minmax(0,1fr)] gap-3">
            <CoachMark />
            <div className="notch min-w-0 border border-border bg-surface px-4 py-4">
              <p className="m-0 max-w-[64ch] whitespace-pre-wrap text-[14.5px] text-fg-2">
                {message.content}
                {streamingHere && (
                  <span className="ml-1 inline-block h-3.5 w-1.5 animate-glow-pulse bg-acid-500 align-middle" />
                )}
              </p>
            </div>
          </div>
        );
      })}

      {/* A separate marker only while the reply has not started arriving; once
          tokens stream the caret above is the liveness signal. */}
      {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
        <div className="grid grid-cols-[30px_1fr] items-center gap-3">
          <CoachMark />
          <span className="flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-label text-fg-3">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-[5px] w-[5px] animate-glow-pulse bg-acid-500"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </span>
            Reading your games
          </span>
        </div>
      )}
    </div>
  );
}
