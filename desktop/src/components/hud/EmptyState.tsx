import type { LucideIcon } from "lucide-react";
import { ChampionSplash, ScanBand } from "@/components/hud/Splash";
import { Spinner } from "@/components/hud/Spinner";
import { cn } from "@/lib/cn";

export type EmptyTone = "neutral" | "danger" | "warning";

/**
 * The screen with nothing on it, said once and said properly.
 *
 * There are eleven of these across the three native screens and they were the whole
 * argument for a shared component: every one of them is a title, a sentence explaining
 * which of the several possible reasons this is, and — where there is one — the thing the
 * player can do about it. A panel that is empty without saying which reason reads as an app
 * that has broken rather than one that is waiting.
 *
 * The champion art behind it is not decoration in the usual sense. These states are most of
 * what this window shows between games, and a flat box at 1100x720 is a dead app; the
 * splash is what makes "waiting for a game" look like a product with the lights on.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  tone = "neutral",
  /** Shown instead of the icon while something is genuinely in flight. */
  busy,
  /** Numbered things to try, for the one failure a player can actually work through. */
  steps,
  /** The champion whose art grounds the panel. Falls back to a neutral one. */
  splash = "Viego",
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone?: EmptyTone;
  busy?: boolean;
  steps?: readonly string[];
  splash?: string;
  action?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  const accent = {
    neutral: { text: "text-text", border: "border-line-2", icon: "text-text-muted" },
    danger: { text: "text-danger", border: "border-danger", icon: "text-danger" },
    warning: { text: "text-warning", border: "border-warning", icon: "text-warning" },
  }[tone];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <ChampionSplash champion={splash} opacity={tone === "neutral" ? 0.16 : 0.1} />
        {/* Two grounds, not one: the gradient sinks the art under the text, and the
            scanline puts the instrument grain back over the top of it. */}
        <span className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <span className="bg-scanline absolute inset-0" />
        <ScanBand tone={tone === "neutral" ? "accent" : "danger"} />
      </span>

      <div className="relative grid place-items-center px-6 py-14 text-center">
        {busy ? (
          <Spinner />
        ) : (
          <span
            className={cn(
              "notch grid h-[54px] w-[54px] place-items-center border bg-surface-dark",
              accent.border,
              accent.icon
            )}
          >
            <Icon aria-hidden className="h-6 w-6" />
          </span>
        )}

        <h2
          className={cn(
            "mt-4 font-display text-[22px] font-bold uppercase tracking-[0.05em]",
            accent.text
          )}
        >
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-[50ch] text-sm leading-relaxed text-text-body">{body}</p>

        {steps?.length ? (
          <ol className="mt-5 grid gap-2 text-left">
            {steps.map((step, index) => (
              <li key={step} className="grid grid-cols-[18px_1fr] items-start gap-3">
                <span className="font-mono text-[10px] font-bold text-warning">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] text-text-body">{step}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
