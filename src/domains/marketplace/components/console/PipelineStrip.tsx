import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
import { formatMoney } from "@/domains/marketplace/money";
import type { CoachWorkload } from "@/domains/marketplace/services/bookingQueryService";

interface Props {
  workload: CoachWorkload;
  /** When the oldest unanswered request gives up on itself. ISO, or null. */
  nextExpiry: string | null;
}

/**
 * What is moving through the coach's books right now, as one strip.
 *
 * Ordered the way a session travels rather than by importance, so the strip
 * reads left to right as a pipeline and a coach can see where work is stuck.
 */
export function PipelineStrip({ workload, nextExpiry }: Props): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-px border border-border bg-line-1 md:grid-cols-4">
      <Cell>
        <MarketStat
          label="Awaiting you"
          value={String(workload.pending)}
          unit={workload.pending === 1 ? "request" : "requests"}
          tone={workload.pending > 0 ? "warn" : "default"}
          note={
            workload.pending === 0
              ? "Nothing is waiting on you"
              : nextExpiry
                ? `Oldest expires ${relative(nextExpiry)}`
                : "Answer before they expire"
          }
        />
      </Cell>
      <Cell>
        <MarketStat
          label="Upcoming"
          value={String(workload.upcoming)}
          unit={workload.upcoming === 1 ? "session" : "sessions"}
          note="Accepted and still ahead of you"
        />
      </Cell>
      <Cell>
        <MarketStat
          label="Delivered"
          value={String(workload.awaitingConfirmation)}
          unit="unconfirmed"
          note="Settles on its own if unchallenged"
        />
      </Cell>
      <Cell>
        <MarketStat
          label="Held"
          value={formatMoney(workload.heldCents, workload.currency)}
          tone="accent"
          note="Released as sessions settle"
        />
      </Cell>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="bg-background px-4 py-4">{children}</div>;
}

/** "in 1d 4h", from now. Deliberately coarse — an exact clock would be noise here. */
function relative(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "any moment";
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  return days > 0 ? `in ${days}d ${hours % 24}h` : `in ${hours}h`;
}
