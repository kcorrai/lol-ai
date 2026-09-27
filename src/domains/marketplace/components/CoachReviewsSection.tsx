import type { CoachPublicProfile } from "@/domains/marketplace/types";
import { CoachReviewCard } from "@/domains/marketplace/components/CoachReviewCard";
import { StarRating } from "@/domains/marketplace/components/hud/StarRating";

interface Props {
  coach: CoachPublicProfile;
}

/**
 * "What students said": the aggregate first, then the reviews themselves.
 *
 * The summary repeats the withheld-rating rule rather than inventing a number —
 * below three reviews the profile shows the words, never an average of two.
 */
export function CoachReviewsSection({ coach }: Props): React.ReactElement | null {
  if (coach.reviews.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text md:text-[26px]">
        What students said
      </h2>

      <div className="notch mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border border-border bg-surface px-5 py-4">
        {coach.rating !== null && (
          <span className="flex items-center gap-3">
            <span className="font-mono text-[38px] font-bold leading-none text-accent">
              {coach.rating.toFixed(1)}
            </span>
            <span>
              <StarRating value={coach.rating} size={15} />
              <span className="mt-1 block text-[12px] text-text-muted">out of 5</span>
            </span>
          </span>
        )}
        <span className="text-[13.5px] text-text-body">
          <span className="font-mono text-text">{coach.ratingCount}</span>{" "}
          {coach.ratingCount === 1 ? "review" : "reviews"} &middot; only from paid sessions
        </span>
      </div>

      <div className="mt-3 grid gap-3">
        {coach.reviews.map((review) => (
          <CoachReviewCard key={review.id} review={review} coachName={coach.displayName} />
        ))}
      </div>
    </section>
  );
}
