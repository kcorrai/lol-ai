"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSubmitRating } from "@/hooks/useSubmitRating";

interface Props {
  reportId: string;
  currentRating: number | null;
}

const STAR_LABELS = ["Unhelpful", "Below average", "Average", "Good", "Excellent"];

export function ReportRating({ reportId, currentRating }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(currentRating);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(currentRating !== null);

  const { mutate: submitRating, isPending } = useSubmitRating();

  // Already rated — show read-only stars
  if (submitted && selected !== null) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4 text-center">
        <p className="text-xs text-text-muted">You rated this report</p>
        <div className="mt-1 flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-xl ${i < selected ? "text-accent" : "text-text-muted/30"}`}
            >
              ★
            </span>
          ))}
        </div>
        <p className="mt-1 text-xs text-text-muted">{STAR_LABELS[(selected ?? 1) - 1]}</p>
      </div>
    );
  }

  function handleSubmit() {
    if (!selected) return;
    submitRating(
      { reportId, rating: selected, feedback: feedback.trim() || undefined },
      { onSuccess: () => setSubmitted(true) }
    );
  }

  const activeIndex = hovered ?? selected ?? 0;

  return (
    <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4">
      <p className="mb-3 text-center text-xs font-medium text-text-muted">
        Was this report helpful?
      </p>

      <div
        className="flex justify-center gap-2"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} out of 5`}
              className={`text-2xl transition-transform hover:scale-110 ${
                i < activeIndex ? "text-accent" : "text-text-muted/30"
              }`}
              onMouseEnter={() => setHovered(value)}
              onClick={() => setSelected(value)}
            >
              ★
            </button>
          );
        })}
      </div>

      {activeIndex > 0 && (
        <p className="mt-1 text-center text-xs text-text-muted">
          {STAR_LABELS[activeIndex - 1]}
        </p>
      )}

      {selected !== null && (
        <div className="mt-3 space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional: tell us what was helpful or missing…"
            maxLength={500}
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-xs text-text placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Submitting…" : "Submit Rating"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
