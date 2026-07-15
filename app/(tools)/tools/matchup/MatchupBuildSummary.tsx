import Image from "next/image";
import { summonerSpellUrl } from "@/lib/ddragon";
import { MatchupCurveCompare } from "@/domains/meta/components/MatchupCurveCompare";
import type { ItemInfo } from "@/lib/ddragon/itemsData";
import type { MatchupExtras, MatchupSideBuild } from "./loadMatchupExtras";

function ItemRow({ items }: { items: ItemInfo[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Image
          key={item.id}
          src={item.iconUrl}
          alt={item.name}
          title={item.name}
          width={30}
          height={30}
          unoptimized
          className="rounded-md ring-1 ring-border"
        />
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function SideBuild({ name, side, accent }: { name: string; side: MatchupSideBuild; accent: string }) {
  if (side.coreItems.length === 0 && !side.keystone) return null;
  const spellUrls = side.summonerSpellIds.map(summonerSpellUrl).filter(Boolean);
  return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-surface/60 p-4">
      <h3 className={`font-display text-sm font-bold ${accent}`}>{name} build</h3>

      {(side.keystone || spellUrls.length > 0) && (
        <Field label="Runes">
          <div className="flex items-center gap-1.5">
            {side.keystone && (
              <Image
                src={side.keystone.iconUrl}
                alt={side.keystone.name}
                title={side.keystone.name}
                width={30}
                height={30}
                unoptimized
                className="rounded-md ring-1 ring-border"
              />
            )}
            {spellUrls.map((url, i) => (
              <Image key={i} src={url} alt="Summoner spell" width={26} height={26} unoptimized className="rounded ring-1 ring-border" />
            ))}
          </div>
        </Field>
      )}

      {side.coreItems.length > 0 && (
        <Field label="Core"><ItemRow items={side.coreItems} /></Field>
      )}
      {side.boots.length > 0 && (
        <Field label="Boots"><ItemRow items={side.boots} /></Field>
      )}
      {side.situationalItems.length > 0 && (
        <Field label="Options"><ItemRow items={side.situationalItems} /></Field>
      )}
      {side.skillMaxOrder.length > 0 && (
        <Field label="Skills">
          <span className="text-sm font-semibold text-text">{side.skillMaxOrder.join(" › ")}</span>
        </Field>
      )}
    </div>
  );
}

// Condensed build comparison for the matchup tool: each side's keystone + core
// items and an overlaid game-length curve. Reuses the build page's curve compare.
export function MatchupBuildSummary({
  nameA,
  nameB,
  extras,
}: {
  nameA: string;
  nameB: string;
  extras: MatchupExtras;
}) {
  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SideBuild name={nameA} side={extras.a} accent="text-sky-400" />
        <SideBuild name={nameB} side={extras.b} accent="text-rose-400" />
      </div>
      <MatchupCurveCompare nameA={nameA} nameB={nameB} curveA={extras.a.curve} curveB={extras.b.curve} />
    </div>
  );
}
