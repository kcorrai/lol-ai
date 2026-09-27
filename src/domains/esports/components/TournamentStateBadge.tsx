import type { TournamentState } from "@/domains/esports/tournaments";

const LABEL: Record<TournamentState, string> = {
  running: "In progress",
  upcoming: "Upcoming",
  ended: "Finished",
};

const TONE: Record<TournamentState, string> = {
  running: "border-accent text-accent",
  upcoming: "border-warning text-warning",
  ended: "border-border text-text-muted",
};

/**
 * Where a tournament stands, as a small tag: in progress, upcoming or
 * finished. The same three words everywhere a tournament is listed, so a
 * reader learns them once.
 */
export function TournamentStateBadge({
  state,
  detail,
}: {
  state: TournamentState;
  /** Said after the state, e.g. "ends in 8 days". */
  detail?: string;
}): React.ReactElement {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-label ${TONE[state]}`}
    >
      {state === "running" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
      )}
      {LABEL[state]}
      {detail ? <span className="normal-case tracking-normal opacity-80">· {detail}</span> : null}
    </span>
  );
}
