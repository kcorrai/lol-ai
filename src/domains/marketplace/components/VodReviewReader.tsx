"use client";

import { Badge } from "@/components/ui/badge";
import type { VodReviewDelivery } from "@/domains/marketplace/types";
import { ANNOTATION_CATEGORIES, secondsToClock } from "@/domains/marketplace/vodClock";

interface Props {
  review: VodReviewDelivery;
}

const LABELS = new Map(ANNOTATION_CATEGORIES.map((c) => [c.value, c.label]));

/** The delivered review, as the student reads it. */
export function VodReviewReader({ review }: Props): React.ReactElement {
  return (
    <div className="space-y-4">
      <p className="whitespace-pre-wrap text-sm text-text-body">{review.summary}</p>

      {(review.sourceUrl || review.matchId) && (
        <p className="break-all text-xs text-text-muted">
          Reviewed:{" "}
          {review.sourceUrl ? (
            <a href={review.sourceUrl} className="text-accent underline" target="_blank" rel="noreferrer noopener">
              {review.sourceUrl}
            </a>
          ) : (
            <span className="font-mono">{review.matchId}</span>
          )}
        </p>
      )}

      {review.annotations.length === 0 ? (
        <p className="text-xs text-text-faint">No timestamped notes on this one.</p>
      ) : (
        <ol className="space-y-3">
          {review.annotations.map((annotation) => (
            <li key={annotation.id} className="rounded-md border border-border bg-surface-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* The clock, not a link. We host no video, so there is nothing
                    to seek — the student scrubs their own replay to it. */}
                <span className="rounded bg-surface px-2 py-0.5 font-mono text-xs text-accent">
                  {secondsToClock(annotation.timestampSeconds)}
                </span>
                <Badge variant="outline">{LABELS.get(annotation.category) ?? annotation.category}</Badge>
                <p className="font-semibold text-text">{annotation.title}</p>
              </div>

              {annotation.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-body">{annotation.body}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
