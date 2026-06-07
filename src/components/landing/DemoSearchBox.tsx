"use client";

import { useState } from "react";
import type { PreviewResponse } from "@/types/preview";
import { PreviewResultCard } from "./PreviewResultCard";

const REGIONS = [
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

export function DemoSearchBox() {
  const [input, setInput] = useState("");
  const [region, setRegion] = useState("tr1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResponse | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parts = input.trim().split("#");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("Format: OyuncuAdı#TR1");
      return;
    }
    const [gameName, tagLine] = parts;

    setLoading(true);
    try {
      const params = new URLSearchParams({ gameName, tagLine, region });
      const res = await fetch(`/api/public/preview?${params}`);
      const json = await res.json() as { data?: PreviewResponse; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Bir hata oluştu.");
      } else if (json.data) {
        setResult(json.data);
      }
    } catch {
      setError("Bağlantı hatası. Tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 overflow-hidden rounded-md border border-border bg-surface focus-within:border-accent/50">
          <input
            type="text"
            placeholder="OyuncuAdı#TR1"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-text placeholder-text-muted outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="border-l border-border bg-surface-2 px-3 py-3 text-xs text-text-muted outline-none"
          >
            {REGIONS.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Analiz ediliyor..." : "Analiz Et"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-center text-sm text-danger">{error}</p>
      )}

      {loading && (
        <div className="mt-6 space-y-3 rounded-xl border border-border bg-surface p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-2" />
            ))}
          </div>
          <div className="h-20 animate-pulse rounded-lg bg-surface-2" />
        </div>
      )}

      {result && !loading && <PreviewResultCard data={result} />}
    </div>
  );
}
