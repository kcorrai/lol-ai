import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fetchAllChampions, fetchChampionDetail, cleanAbilityText } from "@/lib/ddragon/championsData";
import { normalizeChampionKey, getLatestDdragonVersion } from "@/lib/ddragon";
import { ChampionAbilities } from "./ChampionAbilities";
import { ChampionSkins } from "./ChampionSkins";
import { buildAbilityViews } from "./abilityViews";

export const revalidate = 86400;

interface Props { params: { name: string } }

export async function generateStaticParams() {
  const champions = await fetchAllChampions();
  return champions.map((c) => ({ name: c.id }));
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const champ = await fetchChampionDetail(params.name);
  if (!champ) return { title: "Champion not found" };
  const pageUrl = `${BASE_URL}/champions/${params.name}`;
  const abilityNames = [champ.passive.name, ...champ.spells.map((s) => s.name)].join(", ");
  return {
    title: `${champ.name} Guide — Abilities, Skins & Counters | LoL AI Coach`,
    description: `${champ.name}, ${champ.title}: full ability breakdown (${abilityNames}) with videos, skins gallery, base stats and the best counter picks by real ranked win rate.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      url: pageUrl,
      images: [`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizeChampionKey(champ.name)}_0.jpg`],
    },
  };
}

export default async function ChampionDetailPage({ params }: Props) {
  const [champ, version] = await Promise.all([
    fetchChampionDetail(params.name),
    getLatestDdragonVersion(),
  ]);
  if (!champ) notFound();

  const key = normalizeChampionKey(champ.name);
  const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${key}_0.jpg`;
  const tips = [...(champ.allytips ?? []), ...(champ.enemytips ?? [])].slice(0, 4);
  const counterTips = (champ.enemytips ?? []).slice(0, 4);

  const abilities = buildAbilityViews(champ, version);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How to counter ${champ.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: counterTips.length > 0 ? counterTips.join(" ")
            : `Apply early pressure against ${champ.name} and analyze their weak points with your AI coach.`,
        },
      },
      {
        "@type": "Question",
        name: `What are ${champ.name}'s abilities?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${champ.name}'s kit: ${champ.passive.name} (Passive), ${champ.spells.map((s, i) => `${["Q", "W", "E", "R"][i]} ${s.name}`).join(", ")}.`,
        },
      },
      {
        "@type": "Question",
        name: `What position does ${champ.name} play?`,
        acceptedAnswer: { "@type": "Answer", text: `${champ.name} is typically played in the ${champ.tags.join(" and ")} roles.` },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <p className="mb-6 text-xs text-text-muted">
        <Link href="/champions" className="hover:text-accent">Champions</Link>
        {" / "}<span className="text-text">{champ.name}</span>
      </p>

      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border">
        <div className="relative h-56 w-full sm:h-72">
          <Image fill priority alt={champ.name} src={splashUrl} sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover object-top" style={{ filter: "saturate(0.85)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative -mt-16 px-6 pb-6">
          <h1 className="font-display text-4xl font-black text-text drop-shadow sm:text-5xl">{champ.name}</h1>
          <p className="mt-1 text-sm text-accent capitalize">{champ.title}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {champ.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-border bg-surface/80 px-3 py-0.5 text-xs text-text-muted">{tag}</span>
            ))}
            <Difficulty value={champ.info.difficulty} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ChampionAbilities abilities={abilities} />
          <ChampionSkins championKey={key} championName={champ.name} skins={champ.skins ?? []} />

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">Story</h2>
            <p className="text-sm leading-relaxed text-text-muted">{cleanAbilityText(champ.lore || champ.blurb)}</p>
          </div>

          {tips.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">Tips</h2>
              <ul className="space-y-3">
                {tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-text-muted">
                    <span className="mt-0.5 shrink-0 text-accent">→</span><span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Link href={`/counters/${params.name}`} className="block rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 transition-colors hover:border-accent/50">
            <span className="block text-sm font-semibold text-text">Who counters {champ.name}?</span>
            <span className="mt-0.5 block text-xs text-text-muted">Best counter picks by real ranked win rate — updated every patch. →</span>
          </Link>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">Base Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatRow label="Health" value={Math.round(champ.stats.hp)} />
              <StatRow label="Armor" value={Math.round(champ.stats.armor)} />
              <StatRow label="Magic Resist" value={Math.round(champ.stats.spellblock)} />
              <StatRow label="Attack Dmg" value={Math.round(champ.stats.attackdamage)} />
              <StatRow label="Range" value={champ.stats.attackrange} />
              <StatRow label="Move Speed" value={champ.stats.movespeed} />
            </div>
          </div>

          <div className="rounded-2xl border border-accent/30 p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(88,70,180,0.06) 100%)" }}>
            <p className="mb-1 text-sm font-semibold text-text">Want to climb with {champ.name}?</p>
            <p className="mb-4 text-xs text-text-muted">Your AI coach analyzes your games — start free</p>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90">Get Started Free →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}

function Difficulty({ value }: { value: number }) {
  const label = value >= 7 ? "High" : value >= 4 ? "Moderate" : "Low";
  return (
    <span className="rounded-full border border-border bg-surface/80 px-3 py-0.5 text-xs text-text-muted">
      Difficulty: <span className="font-semibold text-text">{label}</span>
    </span>
  );
}
