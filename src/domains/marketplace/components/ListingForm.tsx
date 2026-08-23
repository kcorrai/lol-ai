"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isScheduled, splitPrice, DEFAULT_COMMISSION_BPS } from "@/domains/marketplace/policy";
import { formatMoney } from "@/domains/marketplace/money";
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
 *
 * The split is drawn live under the price field. A coach who first meets the
 * commission on a payout has been surprised by it, and a surprise about money
 * is the complaint that ends a marketplace relationship.
 */
export function ListingForm({ initial, saving, onSubmit, onCancel }: Props): React.ReactElement {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState } = useForm<FormShape>({
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
  const price = Number(watch("price")) || 0;
  const currency = (watch("currency") || "USD").toUpperCase();
  const split = splitPrice(Math.round(price * 100), DEFAULT_COMMISSION_BPS);

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
    <form
      onSubmit={handleSubmit(submit)}
      className="notch glow-accent-soft bg-hero-fade grid gap-3.5 border border-accent bg-surface p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          {initial ? "// Edit listing" : "// New listing"}
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          {initial
            ? "Changes show on your profile immediately"
            : "Goes on sale as soon as you save"}
        </span>
      </div>

      <Field
        label="What is it called"
        hint="Students read this first. Say the role and the thing you fix."
      >
        <Input
          id="title"
          placeholder="Jungle VOD review — one game, in depth"
          {...register("title", { required: true })}
        />
      </Field>

      <div>
        <p className="mb-2.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
          Session type
        </p>
        <div className="flex flex-wrap gap-1.5">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={kind === option.value}
              onClick={() => setValue("kind", option.value as FormShape["kind"])}
              className={cn(
                "tag-cut border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                kind === option.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line-2 text-text-muted hover:text-text"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-text-faint">
          {scheduled
            ? "Booked into a slot on your calendar."
            : "No calendar — you promise a turnaround instead."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={`Price · ${currency}`}>
          <Input
            id="price"
            type="number"
            min={5}
            step="1"
            {...register("price", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Minutes">
          <Input
            id="durationMinutes"
            type="number"
            min={15}
            max={240}
            {...register("durationMinutes", { valueAsNumber: true })}
          />
        </Field>
        {scheduled ? (
          <Field label="Currency">
            <Input id="currency" maxLength={3} {...register("currency")} />
          </Field>
        ) : (
          <Field label="Delivered within (hours)" hint="A booking counts as late against this.">
            <Input
              id="deliveryHours"
              type="number"
              min={1}
              max={336}
              {...register("deliveryHours", { valueAsNumber: true })}
            />
          </Field>
        )}
      </div>

      <Field label="What the student actually gets">
        <textarea
          id="description"
          rows={3}
          className="well w-full resize-y border border-line-2 bg-background px-3 py-2.5 text-sm leading-relaxed text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Be concrete. What you look at, what you hand back, and who it suits."
          {...register("description", { required: true })}
        />
      </Field>

      <div className="grid gap-px border border-border bg-line-1 sm:grid-cols-3">
        <Split
          label="Student pays"
          value={
            price
              ? formatMoney(split.platformFeeCents + split.coachEarningsCents, currency, true)
              : "—"
          }
        />
        <Split
          label="You keep · 80%"
          value={price ? formatMoney(split.coachEarningsCents, currency, true) : "—"}
          accent
        />
        <Split
          label="Platform · 20%"
          value={price ? formatMoney(split.platformFeeCents, currency, true) : "—"}
          muted
        />
      </div>

      {error && (
        <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3.5">
        <Button type="submit" disabled={saving || formState.isSubmitting}>
          {saving ? "Saving…" : initial ? "Save changes" : "Save listing"}
          <ArrowRight className="h-4 w-4" aria-hidden />
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="text-[12px] text-text-faint">{hint}</span>}
    </label>
  );
}

function Split({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}): React.ReactElement {
  return (
    <div className="bg-background px-4 py-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-mono text-xl font-bold leading-none",
          accent ? "text-accent" : muted ? "text-text-muted" : "text-text"
        )}
      >
        {value}
      </p>
    </div>
  );
}
