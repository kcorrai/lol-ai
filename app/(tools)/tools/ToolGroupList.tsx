import Link from "next/link";
import type { ToolGroup } from "./toolIndex";

interface ToolGroupListProps {
  groups: ToolGroup[];
  /** Resolved figures; a key missing here simply leaves that column empty. */
  stats: Partial<Record<"champions" | "patch" | "updated", string>>;
}

/**
 * The dense index.
 *
 * Rows rather than cards: ten tools as cards is a wall the eye has to scan
 * twice, where a row lets the name, the sentence and the figure line up in
 * columns you can read down.
 */
export function ToolGroupList({ groups, stats }: ToolGroupListProps): React.JSX.Element {
  return (
    <>
      {groups.map((group) => (
        <section key={group.title} className="mt-7">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-label text-fg-1">
              {group.title}
            </span>
            <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-fg-4 sm:inline">
              {group.note}
            </span>
            <span className="h-px flex-1 bg-line-1" />
          </div>

          <div className="notch border border-border bg-surface">
            {group.tools.map(({ href, title, description, Icon, stat }) => (
              <Link
                key={`${group.title}-${href}`}
                href={href}
                className="grid grid-cols-[30px_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 border-b border-line-1 px-5 py-3 transition-colors last:border-b-0 hover:bg-surface-2 md:grid-cols-[30px_190px_minmax(0,1fr)_170px_26px] md:gap-y-0"
              >
                <span className="tag-cut flex h-[30px] w-[30px] items-center justify-center border border-line-2 text-acid-500">
                  <Icon className="h-[17px] w-[17px]" aria-hidden />
                </span>
                <span className="font-display text-[14.5px] font-bold uppercase tracking-wide text-fg-1">
                  {title}
                </span>
                <span className="col-span-2 min-w-0 text-sm text-fg-2 md:col-span-1 md:col-start-3">
                  {description}
                </span>
                <span className="hidden text-right font-mono text-[11.5px] tracking-wide text-acid-500 md:block">
                  {stat ? (stats[stat] ?? "") : ""}
                </span>
                <span className="hidden text-right font-mono text-xs text-fg-4 md:block" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
