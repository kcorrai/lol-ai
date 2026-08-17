"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

/**
 * The chip carries a short label, the request carries the whole question.
 *
 * Six full sentences wrap to three rows and push the field off the screen; the
 * coach still receives the phrasing that gets a useful answer.
 */
const SUGGESTED: { label: string; question: string }[] = [
  { label: "My biggest weakness", question: "What's my biggest weakness right now?" },
  { label: "Losing while ahead", question: "Why am I losing despite being ahead?" },
  { label: "Playing from behind", question: "How should I play when my team is behind?" },
  { label: "My champion pool", question: "Which champion should I focus on this week?" },
  { label: "Why my CS is low", question: "Why is my CS so low?" },
  { label: "When to roam", question: "When should I roam?" },
];

interface ChatComposerProps {
  onSubmit: (value: string) => void;
  disabled: boolean;
  /** Shown under the field: how many messages are left today, when known. */
  quota: string | null;
}

/**
 * Composer with the prompts attached to it rather than floating above an
 * empty thread — they stay reachable after the conversation has started,
 * which is when a stuck user actually wants them.
 */
export function ChatComposer({ onSubmit, disabled, quota }: ChatComposerProps): React.JSX.Element {
  const [input, setInput] = useState("");

  function send(value: string): void {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setInput("");
    onSubmit(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="border-t border-line-1 bg-surface-dark px-5 pb-4 pt-3.5 md:px-8">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 font-mono text-[9.5px] uppercase tracking-label text-text-muted">
            Ask about
          </span>
          {SUGGESTED.map(({ label, question }) => (
            <button
              key={label}
              onClick={() => send(question)}
              disabled={disabled}
              title={question}
              className="tag-cut border border-line-2 px-2 py-1 text-left font-mono text-[9.5px] uppercase tracking-wide text-fg-3 transition-colors hover:border-acid-500 hover:text-acid-500 disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
          <textarea
            data-tour="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask your coach about your games"
            rows={1}
            className="notch-sm resize-none border border-line-2 bg-surface px-3.5 py-3 text-sm text-fg-1 placeholder:text-fg-4 focus:border-acid-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={disabled || !input.trim()}
            className="notch-sm btn-glow inline-flex items-center gap-2 bg-acid-500 px-5 font-display text-sm font-bold uppercase tracking-wide text-ink-1000 transition-colors hover:bg-acid-400 disabled:opacity-40"
          >
            Send
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-2.5 flex justify-between gap-4 font-mono text-[9.5px] uppercase tracking-wide text-fg-4">
          <span>Answers use your match history, not general guides</span>
          {quota && <span>{quota}</span>}
        </div>
      </div>
    </div>
  );
}
