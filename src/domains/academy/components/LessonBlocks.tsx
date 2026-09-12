import { AlertTriangle, Check } from "lucide-react";
import type { LessonBlock } from "@/domains/academy/types";
import { LessonClip } from "./LessonClip";
import { LessonFigure } from "./LessonFigure";
import { LessonMapFigure } from "./LessonMapFigure";

/**
 * The header bar every lesson panel opens with. One shape for all of them is what makes a
 * lesson read as an instrument panel rather than a stack of differently-styled boxes.
 */
function PanelHead({
  label,
  tone = "faint",
  icon,
}: {
  label: string;
  tone?: "faint" | "accent" | "warn";
  icon?: React.ReactNode;
}): React.ReactElement {
  const color =
    tone === "accent" ? "text-accent" : tone === "warn" ? "text-warning" : "text-text-faint";
  return (
    <div className="flex items-center gap-2.5 border-b border-line-1 px-5 py-3.5">
      {icon}
      <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${color}`}>
        {"// "}
        {label}
      </span>
    </div>
  );
}

/** Renders one non-interactive lesson block. Drill blocks are handled by the lesson body. */
export function LessonBlockView({ block }: { block: LessonBlock }): React.ReactElement | null {
  switch (block.kind) {
    case "prose":
      return <p className="my-[18px] text-[15px] leading-[1.75] text-text-body">{block.text}</p>;

    case "keyPoint":
      return (
        <aside className="notch my-[18px] animate-hud-enter border-l-2 border-l-acid-500 bg-surface-2 px-5 py-[18px]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            {block.title}
          </p>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-text">{block.text}</p>
        </aside>
      );

    case "checklist":
      return (
        <div className="notch my-[18px] animate-hud-enter border border-border bg-surface">
          <PanelHead label={block.title} />
          <ul className="grid gap-2.5 p-5">
            {block.items.map((item) => (
              <li key={item} className="grid grid-cols-[15px_1fr] items-start gap-2.5">
                <Check className="mt-0.5 h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
                <span className="text-[14px] leading-relaxed text-text-body">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "mistake":
      return (
        <div className="notch my-[18px] animate-hud-enter border border-border bg-surface">
          <PanelHead
            label={`Common mistake — ${block.title}`}
            tone="warn"
            icon={<AlertTriangle className="h-3.5 w-3.5 text-warning" strokeWidth={2} />}
          />
          <div className="p-5">
            <p className="text-[14px] leading-relaxed text-text-body">{block.text}</p>
            <p className="mt-3.5 border-t border-line-1 pt-3 text-[14px] leading-relaxed text-text">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                The fix
              </span>
              <br />
              {block.fix}
            </p>
          </div>
        </div>
      );

    case "table":
      return (
        <figure className="notch my-[18px] animate-hud-enter border border-border bg-surface">
          <PanelHead label={block.caption} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-2">
                  {block.head.map((cell) => (
                    <th key={cell} className="hud-label px-5 py-2.5 text-text-faint">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join("|")} className="border-b border-line-1 last:border-b-0">
                    {row.map((cell, i) => (
                      <td
                        key={cell + i}
                        className={`px-5 py-3 align-top text-[13.5px] leading-relaxed ${
                          i === 0
                            ? "font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-text"
                            : "text-text-body"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );

    case "figure":
      return <LessonFigure block={block} />;

    case "mapFigure":
      return <LessonMapFigure block={block} />;

    case "clip":
      return <LessonClip block={block} />;

    // Drill blocks are placeholders resolved by the lesson body; the gate marker never renders.
    case "drill":
    case "gate":
      return null;
  }
}
