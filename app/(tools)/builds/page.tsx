import type { Metadata } from "next";
import Link from "next/link";
import { getMetaSnapshot, formatGamePatch } from "@/domains/meta";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { BuildSearch } from "./BuildSearch";

export const revalidate = 43200;

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getMetaSnapshot();
  const patch = snapshot ? formatGamePatch(snapshot.patch) : "";
  return {
    title: `LoL Champion Builds${patch ? ` — Patch ${patch}` : ""} | LoL AI Coach`,
    description:
      "Highest win rate League of Legends builds: runes, items and skill order for every champion, from real ranked games. Free, updated every patch.",
    alternates: { canonical: "/builds" },
  };
}

export default async function BuildsHubPage() {
  const snapshot = await getMetaSnapshot();
  const champions = snapshot
    ? [...snapshot.champions].sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const patch = snapshot ? formatGamePatch(snapshot.patch) : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <ToolBreadcrumb items={[{ name: "Free Tools", href: "/tools" }, { name: "Builds", href: "/builds" }]} />

      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          Champion Builds{patch ? ` — Patch ${patch}` : ""}
        </h1>
        <p className="mt-2 text-text-muted">
          Runes, items and skill order with the highest win rate for every champion.
        </p>
        {champions.length > 0 && (
          <div className="mt-5">
            <BuildSearch champions={champions.map((c) => ({ key: c.championKey, name: c.name }))} />
          </div>
        )}
      </header>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {champions.map((c) => (
          <Link
            key={c.championKey}
            href={`/builds/${c.championKey}`}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 transition-all hover:border-accent/40 hover:bg-surface-2"
          >
            <ChampionIcon name={c.championKey} size={44} />
            <span className="text-center text-xs font-medium text-text group-hover:text-accent line-clamp-1">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
