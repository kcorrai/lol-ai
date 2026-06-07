import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  label: string;
  proOnly?: boolean;
}

interface PricingCardProps {
  plan: "free" | "pro" | "team";
  name: string;
  price: string;
  period?: string;
  description: string;
  features: Feature[];
  proFeatures?: Feature[];
  cta: string;
  ctaHref: string;
}

export function PricingCard({
  plan,
  name,
  price,
  period,
  description,
  features,
  proFeatures,
  cta,
  ctaHref,
}: PricingCardProps) {
  const isPro = plan === "pro";
  const isTeam = plan === "team";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-8",
        isPro
          ? "border-accent/60 bg-gradient-to-b from-accent/10 via-surface to-surface shadow-xl shadow-accent/10"
          : isTeam
            ? "border-warning/50 bg-gradient-to-b from-warning/8 via-surface to-surface shadow-xl shadow-warning/10"
            : "border-border bg-surface"
      )}
    >
      {/* Glow ring */}
      {isPro && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-accent/20" />
      )}
      {isTeam && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-warning/20" />
      )}

      {/* Badge */}
      {isPro && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-background">
            En Popüler
          </span>
        </div>
      )}
      {isTeam && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-warning px-4 py-1 text-xs font-bold uppercase tracking-wider text-background">
            Takımlar İçin
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className={cn(
          "text-xs font-bold uppercase tracking-widest",
          isPro ? "text-accent" : isTeam ? "text-warning" : "text-text-muted"
        )}>
          {name}
        </p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-display text-5xl font-bold text-text">{price}</span>
          {period && <span className="text-sm text-text-muted">{period}</span>}
        </div>
        <p className="mt-2 text-sm text-text-muted">{description}</p>
      </div>

      {/* Base features */}
      <ul className="space-y-2.5">
        {features.map((f) => (
          <li key={f.label} className="flex items-start gap-2.5 text-sm">
            <Check className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              isPro ? "text-accent" : isTeam ? "text-warning" : "text-success"
            )} />
            <span className="text-text-muted">{f.label}</span>
          </li>
        ))}
      </ul>

      {/* Pro/Team exclusive features block */}
      {(isPro || isTeam) && proFeatures && proFeatures.length > 0 && (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className={cn("h-px flex-1", isPro ? "bg-accent/20" : "bg-warning/20")} />
            <span className={cn(
              "text-[11px] font-semibold uppercase tracking-widest",
              isPro ? "text-accent/70" : "text-warning/70"
            )}>
              {isPro ? "Pro Exclusive" : "Team Exclusive"}
            </span>
            <div className={cn("h-px flex-1", isPro ? "bg-accent/20" : "bg-warning/20")} />
          </div>
          <ul className="space-y-2.5">
            {proFeatures.map((f) => (
              <li key={f.label} className="flex items-start gap-2.5 text-sm">
                <Check className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  isPro ? "text-accent" : "text-warning"
                )} />
                <span className="font-medium text-text">{f.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Free — what you're missing */}
      {!isPro && (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted/50">
              Pro&apos;da var
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <ul className="space-y-2.5">
            {[
              "Unlimited AI coaching reports",
              "Matchup Intelligence",
              "Champion Mastery Score",
              "Habit Detection Engine",
              "Improvement Tracker",
              "Shareable AI Report Cards",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-text-muted/30" />
                <span className="text-text-muted/50">{f}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* CTA */}
      <div className="mt-8">
        <Link
          href={ctaHref}
          className={cn(
            "block rounded-xl px-5 py-3.5 text-center text-sm font-bold transition-all",
            isPro
              ? "bg-accent text-background hover:bg-accent/90 shadow-lg shadow-accent/20"
              : isTeam
                ? "bg-warning text-background hover:bg-warning/90 shadow-lg shadow-warning/20"
                : "border border-border text-text hover:border-accent/50 hover:text-accent"
          )}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
