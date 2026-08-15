"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import type { PreviewResponse } from "@/types/preview";
import { PreviewResultCard } from "@/components/landing/PreviewResultCard";

const REGIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "tr1", label: "TR" },
  { value: "euw1", label: "EUW" },
  { value: "eun1", label: "EUNE" },
  { value: "na1", label: "NA" },
  { value: "kr", label: "KR" },
  { value: "br1", label: "BR" },
  { value: "la1", label: "LAN" },
  { value: "la2", label: "LAS" },
  { value: "oc1", label: "OCE" },
  { value: "ru", label: "RU" },
  { value: "jp1", label: "JP" },
];

// Shown one at a time while the request is in flight. The work is real, but it
// finishes faster than a player can read four lines — so these advance on a timer
// rather than tracking actual pipeline stages.
const STEPS: readonly string[] = [
  "Pulling last 20 ranked matches…",
  "Parsing timeline events…",
  "Grading against your rank…",
  "Writing the verdict…",
];

const IDLE_STATUS = "No login · read-only · first report in ~90s";

export function AnalyzeForm(): React.ReactElement {
  const [input, setInput] = useState("");
  const [region, setRegion] = useState("tr1");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResponse | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading) return;
    timer.current = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 800);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [loading]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parts = input.trim().split("#");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("Format: GameName#TAG");
      return;
    }
    const [gameName, tagLine] = parts;

    setStep(0);
    setLoading(true);
    try {
      const params = new URLSearchParams({ gameName, tagLine, region });
      const res = await fetch(`/api/public/preview?${params}`);
      const json = (await res.json()) as { data?: PreviewResponse; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "An error occurred.");
      } else if (json.data) {
        setResult(json.data);
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // "Scroll down" was a lie in both places: the result renders directly beneath
  // this form, and on the closing splash there is nothing below but the footer.
  const status = loading ? STEPS[step] : result ? "Report ready" : IDLE_STATUS;

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="grid max-w-[540px] grid-cols-1 gap-2.5 sm:grid-cols-[1fr_110px_auto]"
      >
        <div className="flex h-11 items-center border border-border bg-surface-dark well focus-within:border-accent">
          <UserRound className="ml-3 h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="GameName#TAG"
            autoComplete="off"
            spellCheck={false}
            aria-label="Riot ID"
            className="h-full flex-1 bg-transparent px-2.5 text-sm text-text placeholder-text-muted outline-none"
          />
        </div>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Region"
          className="h-11 border border-border bg-surface-dark px-3 font-mono text-xs uppercase tracking-label text-text-body outline-none focus:border-accent"
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="tag-cut flex h-11 items-center justify-center gap-2 bg-accent px-6 font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors duration-150 hover:bg-acid-400 active:translate-y-px active:bg-acid-600 disabled:bg-line-2 disabled:text-text-faint"
        >
          {loading ? "Analyzing" : "Analyze"}
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </form>

      <p
        aria-live="polite"
        className="mt-3 font-mono text-[11px] uppercase tracking-label text-text-muted"
      >
        {error ?? status}
      </p>

      {result && !loading && (
        <div className="mt-6 max-w-2xl animate-hud-enter">
          <PreviewResultCard data={result} />
          <a
            href={`/s/${region}/${encodeURIComponent(result.summoner.gameName)}/${encodeURIComponent(result.summoner.tagLine)}`}
            className="mt-3 inline-block font-mono text-[11px] uppercase tracking-label text-accent"
          >
            Full profile &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
