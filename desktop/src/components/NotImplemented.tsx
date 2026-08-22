import { Lock } from "lucide-react";

/**
 * The honest placeholder.
 *
 * Everything that needs the backend needs pairing first, and pairing lands in a later
 * phase. The project's rule is that a feature which cannot really run says so rather than
 * rendering a plausible number — a fake performance score is worse than an empty panel,
 * because the player cannot tell it is fake.
 */
export function NotImplemented({
  what,
  phase,
}: {
  what: string;
  phase: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <Lock className="h-4 w-4 text-text-faint" aria-hidden />
      <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text-muted">
        Not implemented
      </p>
      <p className="max-w-xs text-sm text-text-body">{what}</p>
      <p className="hud-label">{phase}</p>
    </div>
  );
}
