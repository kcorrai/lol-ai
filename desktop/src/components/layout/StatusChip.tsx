import { cn } from "@/lib/cn";

export type ConnectionState = "live" | "idle" | "unreadable";

const COPY: Record<ConnectionState, string> = {
  live: "In game",
  idle: "No game",
  unreadable: "Unreadable",
};

/**
 * The accent is rationed (ADR-015): exactly one thing on screen may be loud, and while a
 * game is running this is it. Idle is deliberately quiet — "League is closed" is the
 * normal state of a companion app and must not look like a fault.
 */
const TONE: Record<ConnectionState, string> = {
  live: "border-acid-500 text-accent",
  idle: "border-line-2 text-text-muted",
  unreadable: "border-warning/60 text-warning",
};

export function StatusChip({ state }: { state: ConnectionState }): React.ReactElement {
  return (
    <span
      className={cn(
        "tag-cut inline-flex items-center gap-2 border bg-surface-dark px-2.5 py-1",
        "font-mono text-[10px] font-bold uppercase tracking-label",
        TONE[state]
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          state === "live" ? "animate-glow-pulse bg-accent" : "bg-current opacity-60"
        )}
      />
      {COPY[state]}
    </span>
  );
}
