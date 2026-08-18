"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// A read-only value with a copy button.
//
// Every URL in the kit is meant to be pasted somewhere else — an OBS Browser
// Source field, a Nightbot command — so copying is the primary action and
// selecting the text by hand is the fallback, not the other way round.

export function CopyField({ label, value }: { label: string; value: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused; the input is selectable either way.
    }
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</span>
      <span className="flex items-stretch gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text"
        />
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={`Copy ${label}`}
          className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-body transition-colors hover:border-accent hover:text-accent"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </span>
    </label>
  );
}
