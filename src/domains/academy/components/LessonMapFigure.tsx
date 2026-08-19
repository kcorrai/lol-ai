import type { MapAnnotation, MapFigureBlock } from "@/domains/academy/types";
import { RiftMap } from "./RiftMap";

function pinClass(tone: MapAnnotation["tone"]): string {
  if (tone === "good") return "border-acid-500 bg-acid-500/25 text-acid-500";
  if (tone === "bad") return "border-danger bg-danger/20 text-danger";
  return "border-line-3 bg-surface-dark/70 text-text-muted";
}

/**
 * The Rift schematic standing still, with numbered pins on it. `RiftMap` is `aria-hidden`, so
 * the numbered list underneath is not a caption for the picture — it *is* the content, and the
 * pins are the shortcut. That ordering is deliberate: a lesson has to keep teaching with the
 * images off.
 */
export function LessonMapFigure({ block }: { block: MapFigureBlock }): React.ReactElement {
  return (
    <figure className="my-6">
      <div className="notch border border-line-1 bg-surface p-5">
        <div className="relative mx-auto aspect-square w-full max-w-[320px]">
          <RiftMap />

          {block.annotations.map((annotation, i) => (
            <span
              key={annotation.label}
              aria-hidden="true"
              style={{
                left: `${annotation.at.x * 100}%`,
                top: `${annotation.at.y * 100}%`,
                width: `${annotation.at.r * 200}%`,
                height: `${annotation.at.r * 200}%`,
              }}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-[11px] font-bold ${pinClass(
                annotation.tone,
              )}`}
            >
              {i + 1}
            </span>
          ))}
        </div>

        <ol className="mt-5 flex flex-col gap-2.5">
          {block.annotations.map((annotation, i) => (
            <li key={annotation.label} className="flex gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-bold ${pinClass(
                  annotation.tone,
                )}`}
              >
                {i + 1}
              </span>
              <p className="text-[13.5px] leading-relaxed text-text-body">
                <span className="font-medium text-text">{annotation.label}</span> — {annotation.note}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="mt-2 font-mono text-[11px] text-text-faint">{block.caption}</figcaption>
    </figure>
  );
}
