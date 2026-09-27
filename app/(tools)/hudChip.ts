// Filter chip classes shared by every free tool's controls — the same cut-corner mono chip the
// tier list console and the build hero already use, so switching tools does not switch looks.
// No imports: client control components read this, and the meta barrel must stay out of them.

export const HUD_CHIP =
  "tag-cut border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-label transition-colors";
export const HUD_CHIP_ON = "border-accent bg-accent/15 text-accent";
export const HUD_CHIP_OFF =
  "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text";
export const HUD_CHIP_DISABLED =
  "cursor-not-allowed opacity-40 hover:border-border hover:text-text-muted";

/** The class string for one chip in the given state. */
export function hudChip(active: boolean, enabled = true): string {
  return `${HUD_CHIP} ${active ? HUD_CHIP_ON : HUD_CHIP_OFF}${enabled ? "" : ` ${HUD_CHIP_DISABLED}`}`;
}

/** A "go elsewhere" link at the foot of a tool — the next page a reader is likely to want. */
export const HUD_LINK =
  "notch-sm border border-border bg-surface px-4 py-2 font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:border-accent/40 hover:text-text";
