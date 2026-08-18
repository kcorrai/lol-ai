import Link from "next/link";
import type { CareerEvent } from "@/domains/analysis/services/careerTimeline.types";

const TONE_TEXT: Record<CareerEvent["tone"], string> = {
  good: "text-accent",
  bad: "text-danger",
  neutral: "text-text",
};

const TONE_NODE: Record<CareerEvent["tone"], string> = {
  good: "border-accent",
  bad: "border-danger",
  neutral: "border-line-3",
};

/** Promotions, peaks and the day tracking began. Everything else reads as supporting. */
const MAJOR_WEIGHT = 85;

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function TimelineEvent({ event }: { event: CareerEvent }): React.ReactElement {
  const major = event.weight >= MAJOR_WEIGHT;

  const body = (
    <>
      {/* The node sits on the spine, not beside it — hence the pull to the left of the
          list's padding rather than a column of its own. */}
      <span
        aria-hidden
        className={`absolute left-0 top-[7px] h-[9px] w-[9px] -translate-x-1/2 rounded-full border ${
          TONE_NODE[event.tone]
        } ${major ? "bg-accent" : "bg-background"}`}
      />
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <time
          dateTime={event.at}
          className="w-[52px] shrink-0 font-mono text-[11px] text-text-muted"
        >
          {dayLabel(event.at)}
        </time>
        <span className={`text-[13.5px] leading-snug ${TONE_TEXT[event.tone]}`}>
          {event.title}
        </span>
      </div>
      {event.detail && (
        <p className="mt-0.5 pl-[62px] text-[11.5px] leading-snug text-text-muted">
          {event.detail}
        </p>
      )}
    </>
  );

  const className = "relative block py-2 pl-5";

  return event.href ? (
    <li>
      <Link href={event.href} className={`${className} group hover:bg-surface`}>
        {body}
      </Link>
    </li>
  ) : (
    <li className={className}>{body}</li>
  );
}
