import { cn } from "@/lib/utils";

/**
 * The shadcn `Card` API, wearing the coaching section's HUD.
 *
 * The session page composes half a dozen panels that were each written against
 * `Card`. Restyling them one by one would have been the same markup rewritten
 * six times, and restyling `Card` itself would have changed every card in the
 * app — the dashboard and the esports section included — which is not what this
 * task was asked to do.
 *
 * So the names are kept and only the import path moves: a panel opts into the
 * HUD by importing from here instead of from `@/components/ui/card`.
 */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className={cn("notch border border-border bg-surface", className)}>{children}</section>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={cn("grid gap-2 border-b border-line-1 px-5 py-3.5", className)}>{children}</div>
  );
}

/** Rendered as the `// LABEL` tag the rest of the section titles panels with. */
export function CardTitle({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
      {"// "}
      {children}
    </h2>
  );
}

export function CardDescription({ children }: { children: React.ReactNode }): React.ReactElement {
  return <p className="max-w-[62ch] text-[13.5px] text-text-body">{children}</p>;
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return <div className={cn("p-5", className)}>{children}</div>;
}
