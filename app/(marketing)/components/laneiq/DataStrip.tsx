import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { CountUp } from "@/components/ui/CountUp";
import { getMetaReport, formatGamePatch } from "@/domains/meta";
import { HudStagger, HudStaggerItem } from "./motion";

function StatBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <p className="hud-label">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-text">{value}</p>
    </div>
  );
}

function relativeAge(iso: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

// Server component. Everything here is the live snapshot — the strip exists to
// prove the site is current, so it renders nothing rather than a placeholder.
export async function DataStrip(): Promise<React.ReactElement | null> {
  const report = await getMetaReport(3);
  if (!report) return null;

  const movers = [...report.climbers.slice(0, 2), ...report.fallers.slice(0, 1)];

  return (
    <section className="border-b border-border bg-surface-dark px-5 py-5 md:px-8">
      <HudStagger className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 md:grid-cols-4">
        <HudStaggerItem>
          <StatBlock label="Patch" value={formatGamePatch(report.patch)} />
        </HudStaggerItem>
        <HudStaggerItem>
          <StatBlock
            label="Ranked games parsed"
            value={report.matchCount ? <CountUp value={report.matchCount} /> : "—"}
          />
        </HudStaggerItem>
        <HudStaggerItem>
          <StatBlock label="Last update" value={`${relativeAge(report.fetchedAt)} ago`} />
        </HudStaggerItem>

        {/* Spans the full row on phones — the tiles plus their deltas do not fit
            in a half-width grid cell at 390px. */}
        <HudStaggerItem className="col-span-2 md:col-span-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <span className="hud-label shrink-0">Movers</span>
            {movers.map((m) => (
              <span key={m.championKey} className="flex items-center gap-1.5">
                <ChampionIcon name={m.championKey} size={26} />
                <span
                  className={`font-mono text-[11.5px] ${m.delta > 0 ? "text-accent" : "text-danger"}`}
                >
                  {m.delta > 0 ? "+" : "−"}
                  {Math.abs(m.delta)}
                </span>
              </span>
            ))}
          </div>
        </HudStaggerItem>
      </HudStagger>
    </section>
  );
}
