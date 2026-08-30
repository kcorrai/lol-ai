import { useEffect, useState } from "react";
import { HudPanel, PanelMeta } from "@/components/layout/HudPanel";
import { AbilityClip } from "@/components/champions/AbilityClip";
import type { DesktopAbility } from "@/lib/champions";
import { cn } from "@/lib/cn";

/**
 * A champion's kit: pick a slot, watch what it does, read what it costs.
 *
 * One component for three screens. On `/champions` it is the champion being read about; on
 * `/game` and `/pregame` it is the lane opponent, which is the same panel answering a
 * sharper question — the player is not studying this champion, they are about to be hit by
 * it. Only the title changes.
 *
 * Everything in it is Data Dragon's own text and Riot's own clip. Nothing here is a claim
 * this product made up, which matters more than usual: advice about an enemy's cooldowns is
 * exactly the kind of thing a player would act on mid-fight.
 */
export function AbilityPanel({
  abilities,
  champion,
  title,
  meta,
}: {
  abilities: readonly DesktopAbility[];
  /** Whose kit it is — used for the still behind a clip that will not load. */
  champion: string;
  title: string;
  meta?: string;
}): React.ReactElement | null {
  const [slot, setSlot] = useState<string | null>(null);

  // Back to the first slot whenever the kit changes underneath. Without this, opening a
  // second champion keeps the previous one's selection — and if that slot happens not to
  // exist on the new kit, the panel falls back silently to a different ability than the
  // one highlighted in the strip.
  useEffect(() => setSlot(null), [champion]);

  // A kit is absent, not empty, when the catalogue could not be read. The panel is not
  // drawn at all rather than drawn saying so: it is the one panel on these screens that is
  // an extra, and a box apologising for itself costs more than it is worth.
  if (abilities.length === 0) return null;

  const open = abilities.find((ability) => ability.slot === slot) ?? abilities[0];

  return (
    <HudPanel title={title} action={meta ? <PanelMeta>{meta}</PanelMeta> : null} bare>
      <div className="grid md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <AbilityClip
          videoUrl={open.videoUrl}
          champion={champion}
          label={`${champion} — ${open.name}`}
        />

        <div className="flex min-w-0 flex-col p-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={`${champion} abilities`}>
            {abilities.map((ability) => (
              <SlotButton
                key={ability.slot}
                ability={ability}
                active={ability.slot === open.slot}
                onSelect={() => setSlot(ability.slot)}
              />
            ))}
          </div>

          <div className="mt-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="tag-cut border border-accent bg-accent/10 px-2 py-[3px] font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-accent">
                {champion} · {open.slot}
              </span>
              <h3 className="font-display text-[17px] font-bold uppercase tracking-[0.04em] text-text">
                {open.name}
              </h3>
            </div>
            <p className="mt-2.5 max-w-[58ch] text-sm leading-relaxed text-text-body">
              {open.description}
            </p>
          </div>

          <AbilityStats ability={open} />
        </div>
      </div>
    </HudPanel>
  );
}

/**
 * The three burn strings, and only the ones that exist.
 *
 * Riot writes "not applicable" as a value — a passive's cooldown is "0/0/0/0/0" and a
 * self-cast's range is "self" — so the server sends null for those and the row is dropped
 * here. A dash would be a fact; a zero would be a wrong one.
 */
function AbilityStats({ ability }: { ability: DesktopAbility }): React.ReactElement | null {
  const rows = [
    { label: "Cooldown", value: ability.cooldown },
    { label: "Cost", value: ability.cost },
    { label: "Range", value: ability.range },
  ].filter((row): row is { label: string; value: string } => row.value !== null);

  if (rows.length === 0) return null;

  return (
    <dl className="mt-auto flex flex-wrap gap-x-7 gap-y-3 border-t border-line-1 pt-3.5">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1.5">
          <dt className="hud-label text-[9px] tracking-[0.18em]">{row.label}</dt>
          <dd className="font-mono text-[13.5px] tabular-nums text-text">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SlotButton({
  ability,
  active,
  onSelect,
}: {
  ability: DesktopAbility;
  active: boolean;
  onSelect: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      title={ability.name}
      className={cn(
        "tag-cut relative cursor-pointer border transition-colors duration-150",
        active ? "glow-accent-soft border-accent" : "border-line-2 hover:border-line-3"
      )}
    >
      <img
        src={ability.iconUrl}
        alt=""
        width={42}
        height={42}
        className={cn(
          "block h-[42px] w-[42px] bg-surface-dark",
          active ? "opacity-100" : "opacity-70"
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0.5 right-0.5 font-mono text-[9px] font-bold",
          active ? "text-accent" : "text-text-faint"
        )}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,.9)" }}
      >
        {ability.slot}
      </span>
    </button>
  );
}
