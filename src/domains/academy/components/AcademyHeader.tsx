import { ArtBackdrop } from "@/domains/academy/components/ArtBackdrop";

interface AcademyHeaderProps {
  /** Data Dragon champion key for the backdrop. */
  champion: string;
  /** Small mono line above the title — a `//` marker or a breadcrumb. */
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lede: string;
  /** The right-hand column: a progress ring, usually. Omitted, the title runs full width. */
  aside?: React.ReactNode;
}

/**
 * The art-backed band every Academy screen opens with.
 *
 * The Academy competes with YouTube for the same half hour, so its pages start with something
 * worth looking at rather than a heading on a flat ground — but the art is always scrimmed to
 * texture, and the reader's own progress is what sits on top of it.
 */
export function AcademyHeader({
  champion,
  eyebrow,
  title,
  lede,
  aside,
}: AcademyHeaderProps): React.ReactElement {
  return (
    <section className="relative overflow-hidden border-b border-line-1">
      <ArtBackdrop champion={champion} focus="58% 20%" opacity={0.3} sizes="100vw" />

      <div
        className={`relative mx-auto grid max-w-[1240px] items-center gap-8 px-5 py-8 md:px-8 md:py-10 lg:gap-11 ${
          aside ? "md:grid-cols-[minmax(0,1fr)_280px]" : ""
        }`}
      >
        <div className="animate-hud-enter">
          {eyebrow}
          {/* 24ch keeps a long title to two or three lines. Wider and the display face sets a
              four-line hero that pushes the page's actual content below the fold. */}
          <h1 className="mt-[18px] max-w-[24ch] font-display text-[30px] font-black uppercase leading-[0.98] tracking-[0.02em] text-text md:text-[42px]">
            {title}
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15.5px] leading-relaxed text-text-body">{lede}</p>
        </div>

        {aside && (
          <div className="grid animate-hud-enter place-items-center [animation-delay:100ms]">
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
