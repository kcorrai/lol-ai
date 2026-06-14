import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { DDRAGON_VERSION } from "@/lib/ddragon";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Şampiyon Rehberleri — LoL AI Coach",
  description: "League of Legends tüm şampiyonlarının rehberleri, counter pick'ler ve AI koç analizleri.",
};

const ALL_ROLES = ["Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"];

export default async function ChampionsPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const champions = await fetchAllChampions();
  const activeRole = searchParams.role ?? "all";

  const filtered =
    activeRole === "all"
      ? champions
      : champions.filter((c) => c.tags.includes(activeRole));

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-black text-text mb-2">Şampiyon Rehberleri</h1>
      <p className="text-text-muted mb-8">
        AI koçunla her şampiyonun performansını analiz et.
      </p>

      {/* Role filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <RoleChip href="/champions" label="Tümü" active={activeRole === "all"} />
        {ALL_ROLES.map((role) => (
          <RoleChip key={role} href={`/champions?role=${role}`} label={role} active={activeRole === role} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {sorted.map((champ) => {
          return (
            <Link
              key={champ.id}
              href={`/champions/${champ.id}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 transition-all hover:border-accent/40 hover:bg-surface-2"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                <Image
                  src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champ.id}.png`}
                  alt={champ.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <p className="text-center text-xs font-medium text-text group-hover:text-accent line-clamp-2">
                {champ.name}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RoleChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-accent text-background"
          : "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
}
