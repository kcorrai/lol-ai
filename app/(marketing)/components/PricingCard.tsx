import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  plan: "free" | "pro";
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-8",
        highlighted
          ? "border-accent bg-surface shadow-lg shadow-accent/10"
          : "border-border bg-surface"
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-background">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-display text-lg font-bold text-text">{name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-display text-4xl font-bold text-text">{price}</span>
          {period && <span className="text-sm text-text-muted">{period}</span>}
        </div>
        <p className="mt-2 text-sm text-text-muted">{description}</p>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={cn(
          "rounded-md px-5 py-3 text-center text-sm font-semibold transition-opacity hover:opacity-90",
          highlighted
            ? "bg-accent text-background"
            : "border border-border text-text hover:border-accent/50"
        )}
      >
        {cta}
      </Link>
    </div>
  );
}
