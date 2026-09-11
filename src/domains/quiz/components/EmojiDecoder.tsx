"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { championSplashUrl } from "@/lib/ddragon";
import type { ChampionFingerprint, EchoSource, EmojiClue } from "@/domains/quiz";

interface EmojiDecoderProps {
  champion: ChampionFingerprint;
  clues: EmojiClue[];
}

/** How each echo announces itself above the quoted text. */
const SOURCE_LABELS: Record<EchoSource, string> = {
  name: "Their name",
  title: "Their title",
  ability: "An ability",
  species: "Species",
  region: "Region",
  class: "Class",
  resource: "Resource",
  lore: "Their lore",
};

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Picks the matched word out of the champion's own text, so the link the panel
 *  is claiming is visible rather than asserted. The trailing `\w*` takes in the
 *  whole word when the match was a prefix — "chem" lights up "Chemtech". */
function Highlight({ text, term }: { text: string; term: string }): React.JSX.Element {
  const parts = text.split(new RegExp(`(\\b${escapeRegExp(term)}\\w*)`, "i"));
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="bg-transparent font-bold text-accent">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

function Chip({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <span className="tag-cut flex items-baseline gap-1.5 border border-line-2 bg-surface-dark px-2 py-1">
      <span className="font-mono text-[8.5px] uppercase tracking-micro text-fg-4">{label}</span>
      <span className="font-mono text-[11px] text-fg-2">{value}</span>
    </span>
  );
}

/** The answer's public facts, under the portrait — half of the emoji usually
 *  point straight at one of them. */
function Fingerprint({ champion }: { champion: ChampionFingerprint }): React.JSX.Element {
  return (
    <div className="notch relative overflow-hidden border border-line-1 bg-surface-dark">
      <span
        aria-hidden
        className="absolute inset-0 bg-cover opacity-[0.14]"
        style={{ backgroundImage: `url('${championSplashUrl(champion.name)}')`, backgroundPosition: "52% 18%" }}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark/85 to-transparent"
      />
      <div className="relative flex flex-wrap items-center gap-4 px-4 py-3.5">
        <ChampionIcon name={champion.name} size={52} className="border border-accent" />
        <div className="min-w-0">
          <p className="font-display text-[19px] font-extrabold uppercase leading-none tracking-wide text-fg-1">
            {champion.name}
          </p>
          <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-label text-accent">
            {champion.title}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          <Chip label="Species" value={champion.species.join(", ")} />
          <Chip label="Region" value={champion.regions.join(", ")} />
          <Chip label="Class" value={champion.classes.join(", ")} />
          <Chip label="Lane" value={champion.positions.join(", ")} />
        </div>
      </div>
    </div>
  );
}

/**
 * The five emoji, decoded: what each picture shows, and where that word turns up
 * in the champion's own record. A clue with no echo says so plainly — an invented
 * connection would be worse than none.
 */
export function EmojiDecoder({ champion, clues }: EmojiDecoderProps): React.JSX.Element {
  return (
    <div className="grid gap-4">
      <Fingerprint champion={champion} />

      <ol className="grid gap-2">
        {clues.map((clue, index) => (
          <li
            key={`${clue.glyph}-${index}`}
            className="notch-sm grid animate-quiz-flip grid-cols-[52px_minmax(0,1fr)] items-center gap-3 border border-line-1 bg-surface/60 px-3 py-2.5 sm:grid-cols-[52px_104px_minmax(0,1fr)]"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span
              aria-hidden
              className={`grid h-[46px] w-[46px] place-items-center border text-[24px] ${
                clue.echo ? "border-accent/50 bg-surface-dark" : "border-line-2 bg-surface-dark"
              }`}
            >
              {clue.glyph}
            </span>

            <span className="font-display text-[13.5px] font-bold uppercase tracking-wide text-fg-1">
              {clue.label}
            </span>

            {clue.echo ? (
              <span className="col-span-2 min-w-0 sm:col-span-1">
                <span className="block font-mono text-[8.5px] uppercase tracking-micro text-fg-4">
                  {SOURCE_LABELS[clue.echo.source]}
                </span>
                <span className="mt-0.5 block font-mono text-[12px] leading-snug text-fg-2">
                  <Highlight text={clue.echo.text} term={clue.echo.term} />
                </span>
              </span>
            ) : (
              <span className="col-span-2 font-mono text-[10.5px] uppercase tracking-label text-fg-4 sm:col-span-1">
                {clue.kind === "colour" ? "Colour cue" : "Picture only"}
              </span>
            )}
          </li>
        ))}
      </ol>

      <p className="font-mono text-[10px] uppercase tracking-label text-fg-4">
        A clue with nothing beside it is the picture on its own — a colour, or a
        likeness no word in the record carries
      </p>
    </div>
  );
}
