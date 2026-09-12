import Image from "next/image";
import { resolveAsset } from "@/domains/academy/assets";
import type { FigureBlock } from "@/domains/academy/types";

/**
 * A row of real game assets — the four trinkets, the three starting items, the keystone that
 * rewards a trading pattern. Deliberately stateless and with no error fallback: every note is
 * on the page as text next to its icon, so a picture that never arrives costs the reader
 * nothing but the picture.
 */
export function LessonFigure({ block }: { block: FigureBlock }): React.ReactElement {
  return (
    <figure className="notch my-[18px] animate-hud-enter border border-border bg-surface">
      <div className="border-b border-line-1 px-5 py-3.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-faint">
          {"// "}
          {block.caption}
        </span>
      </div>
      <ul className="grid gap-4 p-5 sm:grid-cols-2">
        {block.assets.map((asset) => {
          const { src, name } = resolveAsset(asset.ref);
          return (
            <li key={`${asset.label}-${name}`} className="flex gap-3.5">
              <Image
                src={src}
                alt={name}
                width={42}
                height={42}
                className="tag-cut h-[42px] w-[42px] shrink-0 border border-acid-500/60 bg-surface-dark"
                unoptimized
              />
              <div className="min-w-0">
                <p className="font-display text-[15px] font-extrabold uppercase tracking-[0.04em] text-text">
                  {asset.label}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-body">{asset.note}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
