"use client";

import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookingDetail } from "@/domains/marketplace/types";
import { useVodReview } from "@/hooks/useVodReview";
import { VodReviewEditor } from "@/domains/marketplace/components/VodReviewEditor";
import { VodReviewReader } from "@/domains/marketplace/components/VodReviewReader";

interface Props {
  booking: BookingDetail;
  onDelivered: () => void;
}

/**
 * The async deliverable, from whichever side is looking.
 *
 * The coach gets the editor and the student gets what has been published —
 * `getReview` withholds an unpublished draft from the student, so there is no
 * state where they read half-written notes.
 */
export function VodReviewPanel({ booking, onDelivered }: Props): React.ReactElement | null {
  const { data, isLoading } = useVodReview(booking.id);
  const isCoach = booking.role === "coach";

  // Nothing to write against and nothing to read yet.
  if (!isCoach && !data?.review) return null;

  return (
    <HudPanel
      label="The review"
      tone="accent"
      action={
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          {isCoach
            ? "Timestamps are the game clock \u00b7 the student sees nothing until you publish"
            : `${data?.review?.annotations.length ?? 0} timestamped notes \u00b7 game clock`}
        </span>
      }
    >
      {isLoading && <Skeleton className="h-40 w-full" />}

      {!isLoading && isCoach && (
        <VodReviewEditor
          bookingId={booking.id}
          existing={data?.review ?? null}
          onPublished={onDelivered}
        />
      )}

      {!isLoading && !isCoach && data?.review && <VodReviewReader review={data.review} />}
    </HudPanel>
  );
}
