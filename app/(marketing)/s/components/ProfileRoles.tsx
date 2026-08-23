import { POSITION_LABELS } from "@/lib/riot/rankDisplay";
import type { PreviewMatch } from "@/types/preview";

interface Props {
  matches: PreviewMatch[];
}

const ROLE_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;

/**
 * Where the player actually plays, read off the sample rather than declared.
 *
 * Autofill and off-role games are the point: a player who calls themselves a mid laner but shows
 * 40% support is looking at the thing they came here to find out.
 */
export function ProfileRoles({ matches }: Props): React.ReactElement | null {
  if (matches.length === 0) return null;

  const counts = new Map<string, { games: number; wins: number }>();
  for (const m of matches) {
    const entry = counts.get(m.position) ?? { games: 0, wins: 0 };
    entry.games += 1;
    if (m.win) entry.wins += 1;
    counts.set(m.position, entry);
  }

  const rows = [...counts.entries()]
    .sort(
      (a, b) =>
        b[1].games - a[1].games ||
        ROLE_ORDER.indexOf(a[0] as (typeof ROLE_ORDER)[number]) -
          ROLE_ORDER.indexOf(b[0] as (typeof ROLE_ORDER)[number])
    )
    .map(([position, s]) => ({
      position,
      games: s.games,
      share: Math.round((s.games / matches.length) * 100),
      winRate: Math.round((s.wins / s.games) * 100),
    }));

  return (
    <section className="notch border border-border bg-surface p-5">
      <p className="hud-label mb-3.5">{"// Role split"}</p>

      <div className="flex h-2 w-full overflow-hidden bg-surface-dark">
        {rows.map((r, i) => (
          <div
            key={r.position}
            className={i === 0 ? "bg-accent" : "bg-line-3"}
            style={{ width: `${r.share}%` }}
            title={`${POSITION_LABELS[r.position] ?? r.position} ${r.share}%`}
          />
        ))}
      </div>

      <dl className="mt-3.5 space-y-2">
        {rows.map((r) => (
          <div key={r.position} className="flex items-baseline justify-between gap-3">
            <dt className="text-[13px] text-text-body">
              {POSITION_LABELS[r.position] ?? r.position}
            </dt>
            <dd className="font-mono text-[11.5px] text-text-muted">
              {r.share}% · {r.games}g ·{" "}
              <span className={r.winRate >= 50 ? "text-accent" : "text-danger"}>{r.winRate}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
