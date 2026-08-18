import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { MeterRow } from "@/domains/marketplace/components/hud/MeterRow";
import { formatMoney } from "@/domains/marketplace/money";
import type { CoachWorkload } from "@/domains/marketplace/services/bookingQueryService";
import type { CoachConsoleStats } from "@/domains/marketplace/services/coachStatsService";

interface Props {
  workload: CoachWorkload;
  stats: CoachConsoleStats;
}

/**
 * The ledger, said plainly.
 *
 * The disclosure in the header bar is not decoration and does not come off
 * until a payment provider is connected (ADR-020): a coach reading a figure
 * that has never moved has to be told so on the same line they read it.
 */
export function EarningsPanel({ workload, stats }: Props): React.ReactElement {
  const { currency } = workload;
  const total = workload.releasedCents + workload.heldCents + stats.platformFeeCents;
  const share = (cents: number): number => (total === 0 ? 0 : (cents / total) * 100);

  const peak = Math.max(...stats.weeks.map((w) => w.earnedCents), 1);
  const thisWeek = stats.weeks[stats.weeks.length - 1];

  return (
    <HudPanel
      label="Money"
      padded={false}
      action={
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-warning">
          No payment provider connected — the ledger records what would have moved
        </span>
      }
    >
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="border-b border-line-1 p-5 md:border-b-0 md:border-r">
          <p className="flex items-baseline gap-3">
            <span className="font-mono text-[34px] font-bold leading-none text-accent">
              {formatMoney(workload.heldCents, currency)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              held until settled
            </span>
          </p>

          <div className="mt-5 grid gap-3">
            <MeterRow
              label="Released to you"
              value={formatMoney(workload.releasedCents, currency)}
              percent={share(workload.releasedCents)}
            />
            <MeterRow
              label="Held until settled"
              value={formatMoney(workload.heldCents, currency)}
              percent={share(workload.heldCents)}
              tone="muted"
            />
            <MeterRow
              label="Platform cut"
              value={formatMoney(stats.platformFeeCents, currency)}
              percent={share(stats.platformFeeCents)}
              tone="info"
            />
          </div>
        </div>

        <div className="p-5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
            Last 8 weeks
          </p>

          <div className="well mt-3.5 flex h-24 items-end gap-1.5 bg-surface-dark px-2 pt-2">
            {stats.weeks.map((week, i) => (
              <span
                key={week.weekStart}
                title={`${weekLabel(week.weekStart)} · ${formatMoney(week.earnedCents, currency)}`}
                className={
                  i === stats.weeks.length - 1 ? "block flex-1 bg-acid-400" : "block flex-1 bg-accent/55"
                }
                style={{ height: `${Math.max(3, Math.round((week.earnedCents / peak) * 88))}%` }}
              />
            ))}
          </div>

          <p className="mt-2.5 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.12em] text-text-faint">
            <span>{weekLabel(stats.weeks[0].weekStart)}</span>
            <span>
              this week &middot; {formatMoney(thisWeek.earnedCents, currency)}
            </span>
          </p>
        </div>
      </div>
    </HudPanel>
  );
}

function weekLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
