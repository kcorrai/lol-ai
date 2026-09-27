import { BadgeCheck } from "lucide-react";
import { formatDate } from "@/lib/uiLocale";
import type { PublicReview } from "@/domains/marketplace/types";
import { StarRating } from "@/domains/marketplace/components/hud/StarRating";

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
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-2 bg-surface-dark text-[13px] font-bold uppercase text-text-body"
          aria-hidden
        >
          {initial(review.authorName)}
        </span>
        <span className="min-w-0">
          <span className="block text-[13.5px] text-text">{review.authorName}</span>
          <span className="mt-0.5 flex items-center gap-2">
            <StarRating value={review.rating} size={12} />
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
              <BadgeCheck className="h-3 w-3 text-accent" aria-hidden />
              Paid session
            </span>
          </span>
        </span>
        <span className="ml-auto text-[11.5px] text-text-faint">{day(review.createdAt)}</span>
      </div>

      {review.body && (
        <p className="mt-3.5 max-w-[70ch] whitespace-pre-wrap text-[14.5px] leading-relaxed text-text-body">
          {review.body}
        </p>
      )}

      {review.coachReply && (
        <div className="mt-4 border-l-2 border-accent bg-surface-dark px-4 py-3">
          <p className="mb-1.5 text-[12px] font-semibold text-accent">{coachName} replied</p>
          <p className="max-w-[66ch] whitespace-pre-wrap text-[13.5px] text-text-body">
            {review.coachReply}
          </p>
        </div>
      )}
    </article>
  );
}

function initial(name: string): string {
  return name.trim().charAt(0) || "?";
}

function day(iso: string): string {
  return formatDate(iso, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
