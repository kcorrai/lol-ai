"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VodReviewDelivery } from "@/domains/marketplace/types";
import { useSaveVodReview } from "@/hooks/useVodReview";
import {
  ANNOTATION_CATEGORIES,
  secondsToClock,
  clockToSeconds,
} from "@/domains/marketplace/vodClock";

interface Props {
  bookingId: string;
  existing: VodReviewDelivery | null;
  onPublished: () => void;
}

interface DraftNote {
  clock: string;
  title: string;
  body: string;
  category: string;
}

/**
 * Where a coach writes the async deliverable.
 *
 * Timestamps are typed as `mm:ss`, because that is what a coach reads off the
 * replay client — asking for seconds would mean doing arithmetic on every note.
 * Saving and publishing are separate: a draft is the coach's, and a student
 * reading half-written notes would be worse than reading none.
 */
export function VodReviewEditor({ bookingId, existing, onPublished }: Props): React.ReactElement {
  const save = useSaveVodReview(bookingId);
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [sourceUrl, setSourceUrl] = useState(existing?.sourceUrl ?? "");
  const [notes, setNotes] = useState<DraftNote[]>(
    existing?.annotations.map((a) => ({
      clock: secondsToClock(a.timestampSeconds),
      title: a.title,
      body: a.body,
      category: a.category,
    })) ?? []
  );
  const [error, setError] = useState<string | null>(null);

  function update(index: number, patch: Partial<DraftNote>): void {
    setNotes((prev) => prev.map((note, i) => (i === index ? { ...note, ...patch } : note)));
  }

  async function submit(publish: boolean): Promise<void> {
    setError(null);
    try {
      await save.mutateAsync({
        summary,
        sourceUrl: sourceUrl.trim() || null,
        annotations: notes.map((note) => ({
          timestampSeconds: clockToSeconds(note.clock),
          title: note.title,
          body: note.body,
          category: note.category,
        })),
        publish,
      });
      if (publish) onPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that review.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="summary" className="text-sm text-text-muted">
          Summary
        </label>
        <textarea
          id="summary"
          rows={5}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What actually decided this game, and the two things to do differently."
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="sourceUrl" className="text-sm text-text-muted">
          What you reviewed (optional)
        </label>
        <Input
          id="sourceUrl"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="Leave blank to keep the link the student gave you"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm text-text-muted">Timestamped notes</p>

        {notes.map((note, index) => (
          <div key={index} className="space-y-2 rounded-md border border-border bg-surface-2 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label="Timestamp"
                value={note.clock}
                onChange={(e) => update(index, { clock: e.target.value })}
                placeholder="12:30"
                className="w-24 font-mono"
              />

              <select
                aria-label="Category"
                value={note.category}
                onChange={(e) => update(index, { category: e.target.value })}
                className="h-10 rounded-md border border-border bg-surface px-2 text-sm text-text"
              >
                {ANNOTATION_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <Input
                aria-label="Note title"
                value={note.title}
                onChange={(e) => update(index, { title: e.target.value })}
                placeholder="What happened here"
                className="min-w-40 flex-1"
              />

              <Button
                size="sm"
                variant="ghost"
                aria-label="Remove this note"
                onClick={() => setNotes((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3 w-3" aria-hidden />
              </Button>
            </div>

            <textarea
              rows={2}
              value={note.body}
              onChange={(e) => update(index, { body: e.target.value })}
              placeholder="What you would have done instead."
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        ))}

        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setNotes((prev) => [
              ...prev,
              { clock: "00:00", title: "", body: "", category: "MACRO" },
            ])
          }
        >
          <Plus className="h-3 w-3" aria-hidden />
          Add a note
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={save.isPending} onClick={() => void submit(false)}>
          Save draft
        </Button>
        <Button disabled={save.isPending} onClick={() => void submit(true)}>
          {existing?.publishedAt ? "Publish changes" : "Publish and deliver"}
        </Button>
      </div>
    </div>
  );
}
