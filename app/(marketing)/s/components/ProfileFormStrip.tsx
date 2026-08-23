import type { RankBenchmarks } from "@/domains/analysis";
import type { PreviewMatch } from "@/types/preview";
import { buildProfileForm } from "./profileForm";

interface Props {
  matches: PreviewMatch[];
  /** The player's own tier averages, or null when they are unranked. */
  benchmarks: RankBenchmarks | null;
  tierLabel: string | null;
}

/**
 * Recent form, each number read against the player's own rank.
 *
 * This is the part of the profile op.gg does not have. Every stats site can tell a player their
 * CS per minute; saying it is below what their own tier averages is the sentence that turns a
 * stats page into a reason to read the coaching report the page ends with.
 */
export function ProfileFormStrip({
  matches,
  benchmarks,
  tierLabel,
}: Props): React.ReactElement | null {
  if (matches.length === 0) return null;

  const form = buildProfileForm(matches, benchmarks);

  return (
    <section className="notch border border-border bg-surface p-5">
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
        <p className="hud-label">{`// Form over ${matches.length} games`}</p>
        <p className="font-mono text-[11px] text-text-muted">
          <span className={form.winRate >= 50 ? "text-accent" : "text-danger"}>
            {form.winRate}%
          </span>{" "}
          · {form.wins}W {form.losses}L
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {form.metrics.map((m) => (
          <div key={m.label} className="border border-border bg-surface-dark px-3 py-2.5">
            <p className="hud-label">{m.label}</p>
            <p className="mt-0.5 font-mono text-[17px] font-bold text-text">{m.value}</p>
            {m.delta !== null && m.benchmark !== null ? (
              <p
                className={`mt-0.5 font-mono text-[10px] ${
                  m.delta >= 0 ? "text-accent" : "text-danger"
                }`}
              >
                {m.delta >= 0 ? "▲" : "▼"} vs {tierLabel ?? "rank"} {m.benchmark}
              </p>
            ) : (
              // A dash keeps every tile the same height, so the row does not jag where a
              // benchmark is missing.
              <p className="mt-0.5 font-mono text-[10px] text-text-muted">—</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
