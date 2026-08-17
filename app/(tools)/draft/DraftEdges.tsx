import { Link2, Lock, Sparkles } from "lucide-react";

const EDGES: { Icon: typeof Link2; title: string; body: string }[] = [
  {
    Icon: Link2,
    title: "One link per side",
    body: "Send each team its own link. Spectators get a third one that trails the picks.",
  },
  {
    Icon: Lock,
    title: "Fearless carries over",
    body: "Champions locked in an earlier game stay locked for the rest of the series, automatically.",
  },
  {
    Icon: Sparkles,
    title: "Patch data while you draft",
    body: "Live win rates on every tile, plus what your comp is missing at the turn in front of you.",
  },
];

/**
 * What this draft tool does that a blank pick/ban board does not.
 *
 * Stated beside the form rather than under it: the reader is deciding whether
 * to use this instead of the tool they already have open, and that decision is
 * made before they fill anything in.
 */
export function DraftEdges(): React.JSX.Element {
  return (
    <div className="mt-7 grid gap-px border border-border bg-line-1">
      {EDGES.map(({ Icon, title, body }) => (
        <div key={title} className="grid grid-cols-[26px_minmax(0,1fr)] gap-3.5 bg-background px-5 py-4">
          <Icon className="mt-0.5 h-[18px] w-[18px] text-acid-500" aria-hidden />
          <span>
            <span className="block font-display text-sm font-bold uppercase tracking-wide text-fg-1">
              {title}
            </span>
            <span className="mt-1.5 block text-[13.5px] text-fg-2">{body}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
