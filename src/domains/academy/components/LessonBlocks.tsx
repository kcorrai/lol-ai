import { AlertTriangle, Check } from "lucide-react";
import type { LessonBlock } from "@/domains/academy/types";
import { LessonClip } from "./LessonClip";
import { LessonFigure } from "./LessonFigure";
import { LessonMapFigure } from "./LessonMapFigure";

/** Renders one non-interactive lesson block. Drill blocks are handled by the lesson body. */
export function LessonBlockView({ block }: { block: LessonBlock }): React.ReactElement | null {
  switch (block.kind) {
    case "prose":
      return <p className="my-4 text-[15px] leading-[1.75] text-text-body">{block.text}</p>;

    case "keyPoint":
      return (
        <aside className="notch my-6 border-l-2 border-l-acid-500 bg-surface-2 p-5">
          <p className="hud-label text-accent">{block.title}</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-text">{block.text}</p>
        </aside>
      );

    case "checklist":
      return (
        <div className="notch my-6 border border-line-1 bg-surface p-5">
          <p className="hud-label">{block.title}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2.5 text-[14px] leading-relaxed text-text-body">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.5} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "mistake":
      return (
        <div className="notch my-6 border border-line-1 bg-surface p-5">
          <p className="flex items-center gap-2 hud-label text-danger">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
            Common mistake — {block.title}
          </p>
          <p className="mt-2.5 text-[14px] leading-relaxed text-text-body">{block.text}</p>
          <p className="mt-3 border-t border-line-1 pt-3 text-[14px] leading-relaxed text-text">
            <span className="hud-label text-accent">The fix</span>
            <br />
            {block.fix}
          </p>
        </div>
      );

    case "table":
      return (
        <figure className="my-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-2">
                  {block.head.map((cell) => (
                    <th key={cell} className="px-3 py-2 hud-label">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join("|")} className="border-b border-line-1">
                    {row.map((cell, i) => (
                      <td
                        key={cell + i}
                        className={`px-3 py-2.5 align-top text-[13.5px] leading-relaxed ${
                          i === 0 ? "font-medium text-text" : "text-text-body"
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
          <figcaption className="mt-2 font-mono text-[11px] text-text-faint">
            {block.caption}
          </figcaption>
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
