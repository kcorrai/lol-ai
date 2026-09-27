/** Numbered lane tips for a matchup, in a HUD panel. Renders nothing without tips. */
export function LaneTips({ hints }: { hints: string[] }): React.ReactElement | null {
  if (hints.length === 0) return null;
  return (
    <section className="notch border border-border bg-surface p-5">
      <h2 className="hud-label mb-3 text-[10.5px]">Lane tips</h2>
      <ol className="grid gap-2.5">
        {hints.map((hint, i) => (
          <li key={i} className="grid grid-cols-[22px_1fr] gap-2 text-sm text-text">
            <span className="font-mono text-[11px] font-bold tabular-nums leading-5 text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{hint}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
