"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { DraftActionKind, DraftSide } from "@/domains/draft";

interface Props {
  kind: DraftActionKind;
  side: DraftSide;
  championKey: string | null;
  /** The slot the current turn will fill. */
  pending: boolean;
  filled: boolean;
  timedOut: boolean;
}

const SIDE_ACCENT: Record<DraftSide, string> = {
  BLUE: "border-accent-blue",
  RED: "border-danger",
};

export function DraftSlot({
  kind,
  side,
  championKey,
  pending,
  filled,
  timedOut,
}: Props): React.ReactElement {
  const isBan = kind === "BAN";
  const size = isBan ? 38 : 64;

  return (
    <div
      className={`notch-sm relative flex items-center justify-center border bg-surface-2 ${
        pending ? `${SIDE_ACCENT[side]} animate-glow-pulse` : "border-border"
      }`}
      style={{ width: size + 12, height: size + 12 }}
      aria-label={
        filled
          ? `${side === "BLUE" ? "Blue" : "Red"} ${isBan ? "ban" : "pick"}: ${championKey ?? "none"}`
          : `Empty ${side === "BLUE" ? "blue" : "red"} ${isBan ? "ban" : "pick"} slot`
      }
    >
      {championKey ? (
        <ChampionIcon name={championKey} size={size} className={isBan ? "grayscale" : ""} />
      ) : (
        // A filled slot with no champion is a passed or lapsed ban — it has to
        // read differently from a slot the draft has not reached yet.
        <span className="text-[10px] uppercase tracking-label text-text-faint">
          {filled ? "—" : ""}
        </span>
      )}
      {isBan && championKey && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-px w-[120%] rotate-[-38deg] bg-danger/80" />
        </span>
      )}
      {timedOut && (
        <span className="absolute -bottom-1 right-0 text-[9px] font-semibold text-warning">
          auto
        </span>
      )}
    </div>
  );
}
