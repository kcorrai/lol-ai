"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

// A read-only value with a copy button.
//
// Every URL in the kit is meant to be pasted somewhere else — an OBS Browser
// Source field, a Nightbot command — so copying is the primary action and
// selecting the text by hand is the fallback, not the other way round.

export function CopyField({ label, value }: { label: string; value: string }): JSX.Element {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => window.clearTimeout(timer.current ?? undefined), []);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(timer.current ?? undefined);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be refused; the input is selectable either way.
    }
  }

  return (
    <label className="block">
      <span className="hud-label">{label}</span>
      <span className="mt-2 grid grid-cols-[minmax(0,1fr)_max-content] gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="well min-w-0 border border-line-2 bg-ink-900 px-3.5 py-2.5 font-mono text-xs text-text-body"
        />
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={`Copy ${label}`}
          className={`tag-cut flex items-center gap-2 border px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-label transition-colors ${
            copied
              ? "border-accent bg-accent text-ink-1000"
              : "border-line-2 bg-ink-1000 text-text-body hover:border-accent hover:text-accent"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </span>
    </label>
  );
}
