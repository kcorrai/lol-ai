"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { apiFetch } from "@/lib/api/fetcher";

interface GenerateResponse {
  token: string;
  cardUrl: string;
}

/**
 * Turns the career into an image worth posting. The link is only minted on request —
 * nobody's career needs a public URL sitting there waiting to be found, and the card
 * expires on its own a week later.
 */
export function CareerCardShare({ riotAccountId }: { riotAccountId: string }): React.ReactElement {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch<GenerateResponse>("/api/cards/generate", {
        method: "POST",
        body: JSON.stringify({ cardType: "career", riotAccountId }),
      });
      setUrl(`${window.location.origin}${res.cardUrl}`);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function copy(): Promise<void> {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard permission is not a failure worth a message — the link is on screen.
    }
  }

  if (url) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={url}
          className="font-mono text-[11.5px] text-accent underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {url.replace(/^https?:\/\//, "")}
        </a>
        <button
          type="button"
          onClick={copy}
          className="notch-sm flex items-center gap-1.5 border border-line-1 px-2.5 py-1 font-mono text-[11px] text-text-muted transition-colors hover:border-line-3"
        >
          {copied ? (
            <Check className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <Copy className="h-3 w-3" strokeWidth={2} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="notch-sm flex items-center gap-1.5 border border-acid-500 px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-accent transition-colors hover:bg-[var(--surface-accent)] disabled:opacity-50"
      >
        <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
        {busy ? "Building…" : "Share career"}
      </button>
      {failed && (
        <span className="font-mono text-[11px] text-warning">Could not build it — try again</span>
      )}
    </div>
  );
}
