import { cn } from "@/lib/utils";
import type { PublicReview } from "@/domains/marketplace/types";

interface Props {
  review: PublicReview;
  coachName: string;
}

/**
 * One revealed review, with the coach's answer under it.
 *
 * Both sides write blind and both are shown — a review surface where only the
 * happy half is visible is the thing that made every competitor's rating
 * useless, so the reply is styled as a reply rather than as a correction.
 */
export function CoachReviewCard({ review, coachName }: Props): React.ReactElement {
  return (
    <article className="notch border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex gap-0.5" aria-label={`${review.rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              aria-hidden
              className={cn("text-[13px]", star <= review.rating ? "text-accent" : "text-ink-400")}
            >
              ★
            </span>
          ))}
        </span>
        <span className="text-[13px] text-text-muted">{review.authorName}</span>
        <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          {day(review.createdAt)}
        </span>
      </div>

      {review.body && (
        <p className="mt-3 max-w-[70ch] whitespace-pre-wrap text-[14.5px] text-text-body">
          {review.body}
        </p>
      )}

      {review.coachReply && (
        <div className="mt-3.5 border-l-2 border-accent bg-surface-dark px-4 py-3">
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
            {coachName} replied
          </p>
          <p className="max-w-[66ch] whitespace-pre-wrap text-[13.5px] text-text-body">
            {review.coachReply}
          </p>
        </div>
      )}
    </article>
  );
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
