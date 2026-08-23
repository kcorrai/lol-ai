"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractRiotIds, toIdsParam, MAX_LOBBY_SIZE } from "@/domains/riot/services/riotIds";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { regionLabel } from "@/lib/riot/regions";

interface Props {
  region: string;
  /** What is currently scouted, so the box comes back filled in rather than empty. */
  initialText: string;
}

/**
 * The paste box.
 *
 * Parsing happens here as you type, not on submit, because the whole risk of this tool is pasting
 * something it cannot read and being told so only after a round trip. The count under the box is
 * the answer to "did that work" before anything is spent on Riot.
 */
export function MultiSearchForm({ region, initialText }: Props): React.ReactElement {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [selectedRegion, setSelectedRegion] = useState(region);

  const found = extractRiotIds(text);

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (found.length === 0) return;
    router.push(
      `/tools/multi-search?region=${selectedRegion}&ids=${encodeURIComponent(toIdsParam(found))}`
    );
  }

  return (
    <form onSubmit={submit} className="notch border border-border bg-surface p-5">
      <label htmlFor="lobby" className="hud-label mb-2 block">
        {"// Paste the lobby"}
      </label>

      <textarea
        id="lobby"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={"Faker#KR1, kaanproak0#TR1\nor paste the champion select chat straight in"}
        className="w-full resize-y border border-border bg-surface-dark p-3 font-mono text-[13px] text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          aria-label="Platform"
          className="border border-border bg-surface-dark px-3 py-2 font-mono text-[12px] uppercase text-text focus:border-accent focus:outline-none"
        >
          {VALID_REGIONS.map((r) => (
            <option key={r} value={r}>
              {regionLabel(r)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={found.length === 0}
          className="border border-accent bg-accent/10 px-4 py-2 font-mono text-[12px] uppercase tracking-label text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-text-muted"
        >
          Scout {found.length > 0 ? `${found.length} ` : ""}
          {found.length === 1 ? "player" : "players"}
        </button>

        <p className="font-mono text-[11px] text-text-muted">
          {found.length === 0
            ? "No Riot IDs found yet — they look like Name#TAG."
            : `Reading ${found.length} of at most ${MAX_LOBBY_SIZE}.`}
        </p>
      </div>
    </form>
  );
}
