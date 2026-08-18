"use client";

import Image from "next/image";
import { itemIconUrl } from "@/lib/ddragon";
import { SummonerSpellIcon } from "@/components/ui/SummonerSpellIcon";
import type { BuildItem, BuildSpell, QuizPrompt } from "@/domains/quiz";

type BuildPromptData = Extract<QuizPrompt, { kind: "build" }>;

interface BuildPromptProps {
  prompt: BuildPromptData;
}

/** An item icon carries the *item's* id, never the champion's, so unlike splash
 *  art it can be loaded straight from Data Dragon without leaking the answer. */
function Slot({ item }: { item: BuildItem }): React.JSX.Element {
  return (
    <span className="grid justify-items-center gap-1.5">
      <span className="notch grid h-12 w-12 place-items-center overflow-hidden border border-accent/60 bg-surface-dark">
        <Image src={itemIconUrl(item.id)} alt={item.name} width={44} height={44} unoptimized />
      </span>
      <span className="max-w-[76px] text-center font-mono text-[8.5px] uppercase leading-tight tracking-label text-fg-4">
        {item.name}
      </span>
    </span>
  );
}

function SpellSlot({ spell }: { spell: BuildSpell }): React.JSX.Element {
  return (
    <span className="grid justify-items-center gap-1.5">
      {/* The app's own spell icon, rather than the dataset's filename: it is
          already pinned to the same Data Dragon version every other icon uses. */}
      <span className="notch grid h-12 w-12 place-items-center overflow-hidden border border-accent/60 bg-surface-dark">
        <SummonerSpellIcon spellId={spell.id} size={44} />
      </span>
      <span className="text-center font-mono text-[8.5px] uppercase tracking-label text-fg-4">
        {spell.name}
      </span>
    </span>
  );
}

/** A rung that has not been earned yet, shown so the player can see what the
 *  next miss buys them. Mirrors the emoji board's empty slots. */
function Locked({ count }: { count: number }): React.JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="notch grid h-12 w-12 place-items-center border border-line-2 bg-surface-dark font-mono text-[15px] text-fg-4"
        >
          ?
        </span>
      ))}
    </>
  );
}

function Row({
  label,
  locked,
  children,
}: {
  label: string;
  locked?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-start gap-x-3 gap-y-2 border-t border-line-2 py-3 first:border-t-0 first:pt-0"
    >
      <span
        className={`mt-4 w-[74px] shrink-0 font-mono text-[9px] uppercase tracking-label ${
          locked ? "text-fg-4" : "text-accent"
        }`}
      >
        {label}
      </span>
      <span className="flex flex-wrap items-start gap-2.5">{children}</span>
    </div>
  );
}

/**
 * The Build board: a champion's signature path, one rung at a time. Everything
 * not yet earned is missing from the payload rather than hidden here, so the
 * placeholders below are all a devtools reader would find too.
 */
export function BuildPrompt({ prompt }: BuildPromptProps): React.JSX.Element {
  return (
    <div className="notch animate-quiz-stage border border-line-1 bg-surface-dark px-5 py-4">
      <Row label="Core">
        {prompt.core.map((item) => (
          <Slot key={item.id} item={item} />
        ))}
      </Row>

      <Row label="Boots" locked={!prompt.boots}>
        {prompt.boots ? (
          prompt.boots.map((item) => <Slot key={item.id} item={item} />)
        ) : (
          <Locked count={1} />
        )}
      </Row>

      <Row label="Start" locked={!prompt.starter}>
        {prompt.starter ? (
          prompt.starter.map((item, i) => <Slot key={`${item.id}-${i}`} item={item} />)
        ) : (
          <Locked count={2} />
        )}
      </Row>

      <Row label="Summoners" locked={!prompt.spells}>
        {prompt.spells ? (
          prompt.spells.map((spell) => <SpellSlot key={spell.id} spell={spell} />)
        ) : (
          <Locked count={2} />
        )}
      </Row>

      <Row label="Skill max" locked={!prompt.skillMax}>
        {prompt.skillMax ? (
          <span className="mt-3.5 flex items-center gap-1.5 font-display text-[15px] font-bold uppercase tracking-wide text-fg-1">
            {prompt.skillMax.map((slot, i) => (
              <span key={slot} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-fg-4">›</span>}
                <span className="tag-cut border border-accent/60 bg-ink-1000/60 px-2 py-0.5 text-accent">
                  {slot}
                </span>
              </span>
            ))}
          </span>
        ) : (
          <Locked count={3} />
        )}
      </Row>
    </div>
  );
}
