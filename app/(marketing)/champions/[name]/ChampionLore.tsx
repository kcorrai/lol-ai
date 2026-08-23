"use client";

import { useState } from "react";

/** The champion's story, clamped to two lines until asked for. */
export function ChampionLore({ text }: { text: string }): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  if (!text) return null;

  return (
    <section className="notch border border-line-1 bg-surface px-5 py-4">
      <div className="hud-label mb-3 text-[10.5px]">{"// Lore"}</div>
      <p className={`max-w-[72ch] text-sm text-text-body ${open ? "" : "line-clamp-2"}`}>{text}</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pt-2 font-mono text-[10px] uppercase tracking-label text-accent hover:underline"
      >
        {open ? "Show less" : "Read the full story"}
      </button>
    </section>
  );
}
