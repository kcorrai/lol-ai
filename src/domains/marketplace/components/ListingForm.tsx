"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isScheduled } from "@/domains/marketplace/policy";
import type { ListingBodyInput } from "@/domains/marketplace/listingSchema";
import type { OwnListing } from "@/hooks/useCoachListings";
import { KIND_OPTIONS } from "@/domains/marketplace/components/options";

interface Props {
  initial?: OwnListing;
  saving: boolean;
  onSubmit: (input: ListingBodyInput) => Promise<void>;
  onCancel?: () => void;
}

interface FormShape {
  kind: ListingBodyInput["kind"];
  title: string;
  description: string;
  durationMinutes: number;
  /** Whole units, not cents — nobody types 4500 to mean £45. */
  price: number;
  currency: string;
  deliveryHours: number;
}

/**
 * One product a coach sells.
 *
 * Price is entered in whole currency units and converted at the boundary; the
 * database is in cents because money in floats eventually loses a penny, but a
 * coach should never have to know that.
 */
export function ListingForm({ initial, saving, onSubmit, onCancel }: Props): React.ReactElement {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState } = useForm<FormShape>({
    defaultValues: {
      kind: initial?.kind ?? "VOD_REVIEW",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      durationMinutes: initial?.durationMinutes ?? 60,
      price: initial ? initial.priceCents / 100 : 25,
      currency: initial?.currency ?? "USD",
      deliveryHours: initial?.deliveryHours ?? 48,
    },
  });

  const kind = watch("kind");
  const scheduled = isScheduled(kind);

  async function submit(values: FormShape): Promise<void> {
    setError(null);
    try {
      await onSubmit({
        kind: values.kind,
        title: values.title.trim(),
        description: values.description.trim(),
        durationMinutes: Number(values.durationMinutes),
        priceCents: Math.round(Number(values.price) * 100),
        currency: values.currency.toUpperCase(),
        deliveryHours: scheduled ? null : Number(values.deliveryHours),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that listing.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <div className="space-y-1">
        <label htmlFor="kind" className="text-sm text-text-muted">
          What kind of session
        </label>
        <select
          id="kind"
          className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
          {...register("kind")}
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-faint">
          {scheduled
            ? "Booked into a slot on your calendar."
            : "No calendar — you promise a turnaround instead."}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm text-text-muted">
          Title
        </label>
        <Input id="title" placeholder="One game, reviewed properly" {...register("title", { required: true })} />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm text-text-muted">
          What the student gets
        </label>
        <textarea
          id="description"
          rows={4}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Be specific. What you look at, what they leave with."
          {...register("description", { required: true })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="durationMinutes" className="text-sm text-text-muted">
            Length (min)
          </label>
          <Input id="durationMinutes" type="number" min={15} max={240} {...register("durationMinutes", { valueAsNumber: true })} />
        </div>

        <div className="space-y-1">
          <label htmlFor="price" className="text-sm text-text-muted">
            Price
          </label>
          <Input id="price" type="number" min={5} step="1" {...register("price", { valueAsNumber: true })} />
        </div>

        <div className="space-y-1">
          <label htmlFor="currency" className="text-sm text-text-muted">
            Currency
          </label>
          <Input id="currency" maxLength={3} {...register("currency")} />
        </div>
      </div>

      {!scheduled && (
        <div className="space-y-1">
          <label htmlFor="deliveryHours" className="text-sm text-text-muted">
            Turnaround (hours)
          </label>
          <Input id="deliveryHours" type="number" min={1} max={336} {...register("deliveryHours", { valueAsNumber: true })} />
          <p className="text-xs text-text-faint">
            What you are promising. A booking counts as late against this.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving || formState.isSubmitting}>
          {saving ? "Saving…" : initial ? "Save changes" : "Add listing"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
