import Image from "next/image";
import { ItemIcon } from "@/components/ui/ItemIcon";
import type { ItemInfo } from "@/lib/ddragon/itemsData";
import type { RuneInfo } from "@/lib/ddragon/runesData";
import type { ItemFrequency, RuneVariant } from "@/domains/esports/types";

function share(games: number, total: number): string {
  return total > 0 ? `${Math.round((games / total) * 100)}%` : "—";
}

function Items({
  items,
  catalogue,
  games,
}: {
  items: ItemFrequency[];
  catalogue: Map<number, ItemInfo>;
  games: number;
}): React.ReactElement | null {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          Items pros finish with
        </h2>
        {/* The feed publishes the inventory a player ended on, not the order it
            was bought in — so this is deliberately "finished with", not a build
            path, and the page must not imply one. */}
        <span className="hud-label">final inventories, not build order</span>
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.itemId}
            className="gaming-card notch-sm flex items-center gap-3 px-3 py-2.5"
          >
            <ItemIcon itemId={item.itemId} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text">
                {catalogue.get(item.itemId)?.name ?? `Item ${item.itemId}`}
              </span>
              <span className="block font-mono text-[11px] text-text-faint">
                {item.games} of {games} {games === 1 ? "game" : "games"}
              </span>
            </span>
            <span className="shrink-0 font-mono text-sm text-text-body">
              {share(item.games, games)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RunePage({
  variant,
  catalogue,
  games,
}: {
  variant: RuneVariant;
  catalogue: Map<number, RuneInfo>;
  games: number;
}): React.ReactElement {
  const keystone = catalogue.get(variant.perks[0]);
  const primary = catalogue.get(variant.primaryStyle);
  const secondary = catalogue.get(variant.secondaryStyle);

  return (
    <li className="gaming-card notch-sm px-3 py-3">
      <div className="flex items-center gap-3">
        {keystone && (
          <Image
            src={keystone.iconUrl}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0"
            aria-hidden
            unoptimized
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">{keystone?.name ?? "Unknown keystone"}</p>
          <p className="truncate font-mono text-[11px] text-text-faint">
            {primary?.name ?? "—"}
            {secondary ? ` + ${secondary.name}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm text-text-body">{share(variant.games, games)}</p>
          <p className="font-mono text-[11px] text-text-faint">
            {variant.wins}–{variant.games - variant.wins}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {variant.perks.slice(1).map((perkId) => {
          const rune = catalogue.get(perkId);
          return rune ? (
            <Image
              key={perkId}
              src={rune.iconUrl}
              alt={rune.name}
              title={rune.name}
              width={20}
              height={20}
              className="h-5 w-5"
              unoptimized
            />
          ) : null;
        })}
      </div>
    </li>
  );
}

export function ProBuildPanel({
  items,
  runes,
  skillOrder,
  skillOrderGames,
  games,
  itemCatalogue,
  runeCatalogue,
}: {
  items: ItemFrequency[];
  runes: RuneVariant[];
  skillOrder: string[];
  skillOrderGames: number;
  games: number;
  itemCatalogue: Map<number, ItemInfo>;
  runeCatalogue: Map<number, RuneInfo>;
}): React.ReactElement {
  return (
    <>
      <Items items={items} catalogue={itemCatalogue} games={games} />

      {runes.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Runes
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {runes.map((variant, index) => (
              <RunePage key={index} variant={variant} catalogue={runeCatalogue} games={games} />
            ))}
          </ul>
        </section>
      )}

      {skillOrder.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
              Skill order
            </h2>
            <span className="hud-label">
              agreed across {skillOrderGames} {skillOrderGames === 1 ? "game" : "games"}
            </span>
          </div>
          <ol className="flex flex-wrap gap-1">
            {skillOrder.map((skill, index) => (
              <li
                key={index}
                className="flex h-8 w-8 items-center justify-center bg-surface-2 font-mono text-xs font-bold text-text"
              >
                {skill}
              </li>
            ))}
          </ol>
          {/* Where the sample stopped agreeing is information, not a gap. */}
          <p className="mt-2 text-xs text-text-faint">
            Shown up to the last level a majority of these games took the same skill.
          </p>
        </section>
      )}
    </>
  );
}
