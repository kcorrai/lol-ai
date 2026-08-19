"use client";

import type { VodReviewDelivery } from "@/domains/marketplace/types";
import { ANNOTATION_CATEGORIES, secondsToClock } from "@/domains/marketplace/vodClock";
import { safeHref } from "@/lib/security/url";

interface Props {
  review: VodReviewDelivery;
}

const LABELS = new Map(ANNOTATION_CATEGORIES.map((c) => [c.value, c.label]));

/** The delivered review, as the student reads it. */
export function VodReviewReader({ review }: Props): React.ReactElement {
  return (
    <div>
      <p className="max-w-[68ch] whitespace-pre-wrap text-[14.5px] text-text-body">
        {review.summary}
      </p>

      {review.annotations.length === 0 ? (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
          No timestamped notes on this one
        </p>
      ) : (
        <ol className="mt-5 grid gap-2.5">
          {review.annotations.map((annotation) => (
            <li
              key={annotation.id}
              className="border border-l-2 border-line-2 border-l-accent bg-surface-dark p-4 transition-colors hover:border-accent hover:bg-surface-2"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                {/* The clock, not a link. We host no video, so there is nothing
                    to seek — the student scrubs their own replay to it. */}
                <span className="tag-cut border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs font-bold tracking-[0.06em] text-accent">
                  {secondsToClock(annotation.timestampSeconds)}
                </span>
                <span className="tag-cut border border-line-2 bg-surface px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-muted">
                  {LABELS.get(annotation.category) ?? annotation.category}
                </span>
                <span className="font-display text-[15px] font-bold uppercase tracking-[0.03em] text-text">
                  {annotation.title}
                </span>
              </div>

              {annotation.body && (
                <p className="mt-2.5 max-w-[68ch] whitespace-pre-wrap text-sm text-text-body">
                  {annotation.body}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line-1 pt-3.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
        <span>Scrub your own replay to each timestamp</span>
        {/* Same reasoning as the meeting link: the coach supplied this, and a stored
            row predates the http-only schema. */}
        {(safeHref(review.sourceUrl) || review.matchId) && (
          <span className="ml-auto break-all">
            {safeHref(review.sourceUrl) ? (
              <a
                href={safeHref(review.sourceUrl) ?? undefined}
                className="text-accent hover:text-acid-400"
                target="_blank"
                rel="noreferrer noopener"
              >
                Reviewed VOD &rarr;
              </a>
            ) : (
              <span>Match {review.matchId}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
