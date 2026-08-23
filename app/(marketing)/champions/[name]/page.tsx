import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchAllChampions,
  fetchChampionDetail,
  cleanAbilityText,
} from "@/lib/ddragon/championsData";
import { normalizeChampionKey, getLatestDdragonVersion } from "@/lib/ddragon";
import { fetchChampionSkinMedia } from "@/lib/cdragon/skinMedia";
import { getMetaSnapshot, findChampionStats } from "@/domains/meta";
import { ProPlayStrip } from "@/domains/esports/components/ProPlayStrip";
import { ChampionAbilities } from "./ChampionAbilities";
import { ChampionSkins } from "./ChampionSkins";
import { ChampionHero } from "./ChampionHero";
import { ChampionBaseStats } from "./ChampionBaseStats";
import { ChampionRail } from "./ChampionRail";
import { ChampionTips } from "./ChampionTips";
import { ChampionLore } from "./ChampionLore";
import { buildAbilityViews } from "./abilityViews";
import { laneLabelOf, railMatchups } from "./championMatchups";
import { jsonLdProps } from "@/lib/security/jsonLd";

export const revalidate = 86400;

interface Props {
  params: { name: string };
}

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
    title: `${champ.name} Guide — Abilities, Skins & Counters`,
    description: `${champ.name}, ${champ.title}: full ability breakdown (${abilityNames}) with videos, skins gallery, base stats and the best counter picks by real ranked win rate.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      url: pageUrl,
      images: [
        `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizeChampionKey(champ.name)}_0.jpg`,
      ],
    },
  };
}

export default async function ChampionDetailPage({ params }: Props): Promise<React.ReactElement> {
  const [champ, version, roster, snapshot] = await Promise.all([
    fetchChampionDetail(params.name),
    getLatestDdragonVersion(),
    fetchAllChampions(),
    getMetaSnapshot(),
  ]);
  if (!champ) notFound();

  // Sequential rather than part of the Promise.all above: this read is keyed by the
  // champion's numeric id, which only exists once that first response has landed.
  const skins = await fetchChampionSkinMedia(champ);

  const key = normalizeChampionKey(champ.name);
  const meta = snapshot ? findChampionStats(snapshot, key) : null;
  const { worst, best } = railMatchups(snapshot, meta);
  const laneLabel = laneLabelOf(meta);
  const abilities = buildAbilityViews(champ, version);
  const counterTips = (champ.enemytips ?? []).slice(0, 4);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How to counter ${champ.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            counterTips.length > 0
              ? counterTips.join(" ")
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
        acceptedAnswer: {
          "@type": "Answer",
          text: `${champ.name} is typically played in the ${champ.tags.join(" and ")} roles.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(faqSchema)} />

      <div className="mx-auto max-w-[1240px] px-5 pt-6 md:px-8">
        <p className="font-mono text-[10.5px] uppercase tracking-label text-text-faint">
          <Link href="/champions" className="text-text-body hover:text-accent">
            Champions
          </Link>
          {" / "}
          <span className="text-text-body">{champ.name}</span>
        </p>
      </div>

      <ChampionHero
        championKey={key}
        name={champ.name}
        title={champ.title}
        tags={champ.tags}
        difficulty={champ.info.difficulty}
        meta={meta}
        laneLabel={laneLabel}
      />

      <div className="mx-auto max-w-[1240px] px-5 py-6 md:px-8 md:py-7">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_306px]">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-[1.125rem]">
            <section className="notch bg-hero-fade border border-border bg-surface px-5 py-5">
              <div className="hud-label mb-3 text-[10.5px] text-accent">{"// What they do"}</div>
              <p className="max-w-[64ch] text-[14.5px] text-text-body">
                {cleanAbilityText(champ.blurb)}
              </p>
            </section>

            <ChampionAbilities abilities={abilities} />

            <ChampionBaseStats champion={champ} roster={roster} />

            {/* Renders nothing unless the pro sample is already warm and has this champion in it,
                so an overview page never waits on the esports feed (TASK-310). */}
            <ProPlayStrip championId={key} name={champ.name} />

            <ChampionSkins skins={skins} />

            <ChampionTips
              name={champ.name}
              playing={(champ.allytips ?? []).slice(0, 4)}
              against={(champ.enemytips ?? []).slice(0, 4)}
            />

            <ChampionLore text={cleanAbilityText(champ.lore || champ.blurb)} />
          </div>

          <ChampionRail
            name={champ.name}
            championKey={key}
            worst={worst}
            best={best}
            laneLabel={laneLabel}
          />
        </div>
      </div>
    </>
  );
}
