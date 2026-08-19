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
    <figure className="my-6">
      <div className="notch border border-line-1 bg-surface p-5">
        <ul className="grid gap-4 sm:grid-cols-2">
          {block.assets.map((asset) => {
            const { src, name } = resolveAsset(asset.ref);
            return (
              <li key={`${asset.label}-${name}`} className="flex gap-3.5">
                <Image
                  src={src}
                  alt={name}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded ring-1 ring-line-2"
                  unoptimized
                />
                <div className="min-w-0">
                  <p className="hud-label text-accent">{asset.label}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-text-body">{asset.note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <figcaption className="mt-2 font-mono text-[11px] text-text-faint">{block.caption}</figcaption>
    </figure>
  );
}
