import type { DdragonChampionSummary } from "@/lib/ddragon/championsData";

type Stats = DdragonChampionSummary["stats"];

const ROWS: { label: string; read: (s: Stats) => number }[] = [
  { label: "Health", read: (s) => s.hp },
  { label: "Attack dmg", read: (s) => s.attackdamage },
  { label: "Armor", read: (s) => s.armor },
  { label: "Magic resist", read: (s) => s.spellblock },
  { label: "Move speed", read: (s) => s.movespeed },
  { label: "Range", read: (s) => s.attackrange },
];

/**
 * Base stats at level 1, each bar drawn against the whole roster rather than a fixed axis.
 *
 * The design measures against "the top-lane average"; the roster is what we can actually
 * compute, and it is the same comparison a reader is making — is this number high or not.
 */
export function ChampionBaseStats({
  champion,
  roster,
}: {
  champion: DdragonChampionSummary;
  roster: DdragonChampionSummary[];
}): React.ReactElement {
  return (
    <section className="notch border border-border bg-surface px-5 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="hud-label text-[10.5px]">{"// Base stats at level 1"}</span>
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-faint">
          Bar = against every champion
        </span>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-x-8">
        {ROWS.map((row) => {
          const value = row.read(champion.stats);
          const all = roster.map(({ stats }) => row.read(stats)).filter((v) => v > 0);
          const max = all.length > 0 ? Math.max(...all) : value;
          const average = all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : value;
          const pct = max > 0 ? Math.max(3, Math.min(100, (value / max) * 100)) : 0;
          const high = value >= average * 1.1;
          const low = value <= average * 0.9;
          return (
            <div key={row.label} className="grid grid-cols-[96px_minmax(0,1fr)_62px] items-center gap-3">
              <span className="font-mono text-[10.5px] uppercase tracking-label text-text-body">
                {row.label}
              </span>
              <span className="h-[5px] bg-surface-dark">
                <span
                  className={`block h-[5px] ${high ? "bg-accent" : low ? "bg-warning" : "bg-ink-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span
                className={`text-right font-mono text-sm tabular-nums ${high ? "text-accent" : low ? "text-warning" : "text-text"}`}
              >
                {Math.round(value)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
