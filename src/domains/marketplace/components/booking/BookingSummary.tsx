import { CalendarClock, Clock, Hourglass, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/lib/uiLocale";
import { formatMoney } from "@/domains/marketplace/money";
import { kindLabel } from "@/domains/marketplace/components/options";
import {
  COACH_RESPONSE_HOURS,
  DEFAULT_CANCELLATION_HOURS,
  isScheduled,
} from "@/domains/marketplace/policy";
import type { Listing } from "@/domains/marketplace/types";

interface Props {
  coachName: string;
  coachTimezone: string;
  listing: Listing;
  start: string | null;
}

/**
 * The order summary: everything the request commits to, in one place, before
 * the button.
 *
 * The complaints that fill every tutoring marketplace's reviews are about
 * surprises — a fee that appeared at the end, a cancellation rule nobody read.
 * So the total is the listing price with nothing added, and the answer window
 * and cancellation notice are printed here rather than in the terms.
 */
export function BookingSummary({
  coachName,
  coachTimezone,
  listing,
  start,
}: Props): React.ReactElement {
  const scheduled = isScheduled(listing.kind);
  const price = formatMoney(listing.priceCents, listing.currency);

  return (
    <aside className="notch border border-border bg-surface">
      <div className="border-b border-line-1 px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
          {kindLabel(listing.kind)}
        </p>
        <p className="mt-1 font-display text-[15px] font-extrabold uppercase leading-snug tracking-[0.03em] text-text">
          {listing.title}
        </p>
        <p className="mt-1 text-[13px] text-text-muted">with {coachName}</p>
      </div>

      <dl className="grid gap-2.5 px-5 py-4 text-[13px]">
        <Row icon={Clock} label="Length" value={`${listing.durationMinutes} min`} />
        {scheduled ? (
          <Row
            icon={CalendarClock}
            label="When"
            value={
              start
                ? formatDateTime(start, { dateStyle: "medium", timeStyle: "short" })
                : "Pick a time"
            }
            note={
              start
                ? `${formatDateTime(start, { timeStyle: "short", timeZone: coachTimezone })} for ${coachName} (${coachTimezone})`
                : undefined
            }
          />
        ) : (
          <Row
            icon={Hourglass}
            label="Delivered"
            value={
              listing.deliveryHours !== null
                ? `within ${listing.deliveryHours}h of accepting`
                : "after they accept"
            }
          />
        )}
      </dl>

      <dl className="grid gap-2 border-t border-line-1 px-5 py-4 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">Session</dt>
          <dd className="font-mono text-text">{price}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">Service fee</dt>
          <dd className="font-mono text-text">None</dd>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line-1 pt-3">
          <dt className="text-text">Total</dt>
          <dd className="font-mono text-[22px] font-bold text-text">{price}</dd>
        </div>
      </dl>

      <ul className="grid gap-2 border-t border-line-1 px-5 py-4 text-[12.5px] text-text-body">
        <Assurance>Nothing is charged yet — this sends a request.</Assurance>
        <Assurance>
          {coachName} has {COACH_RESPONSE_HOURS} hours to accept, or it expires on its own.
        </Assurance>
        {scheduled && (
          <Assurance>
            Cancel free up to {DEFAULT_CANCELLATION_HOURS} hours before the start.
          </Assurance>
        )}
      </ul>
    </aside>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  note?: string;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-[18px_76px_1fr] items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-text-muted" aria-hidden />
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text">
        {value}
        {note && <span className="mt-0.5 block text-[11.5px] text-text-muted">{note}</span>}
      </dd>
    </div>
  );
}

function Assurance({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <li className="flex gap-2">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
