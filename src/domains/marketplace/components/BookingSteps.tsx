import { cn } from "@/lib/utils";
import { COACH_RESPONSE_HOURS } from "@/domains/marketplace/policy";

const STEPS = [
  "You send a request. Nothing is charged.",
  `The coach accepts within ${COACH_RESPONSE_HOURS} hours, or it expires on its own.`,
  "Money is held until the session settles — a dispute is read against the booking's own history.",
];

/**
 * What happens after "send request", numbered.
 *
 * Shown next to the button and again on the profile rail, from one source, so
 * the promise a student reads before booking is word for word the one they read
 * while deciding to. Every competitor's complaints start with somebody who was
 * never told this.
 */
export function BookingSteps({ className }: { className?: string }): React.ReactElement {
  return (
    <ol className={cn("grid gap-2.5", className)}>
      {STEPS.map((text, i) => (
        <li key={text} className="grid grid-cols-[18px_1fr] items-start gap-2.5">
          <span className="font-mono text-[9.5px] font-bold text-accent">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="text-[12.5px] text-text-body">{text}</span>
        </li>
      ))}
    </ol>
  );
}
