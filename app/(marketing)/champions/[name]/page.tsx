import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fetchAllChampions, fetchChampionDetail } from "@/lib/ddragon/championsData";
import { normalizeChampionKey } from "@/lib/ddragon";

export const revalidate = 86400;

interface Props { params: { name: string } }

export async function generateStaticParams() {
  const champions = await fetchAllChampions();
  return champions.map((c) => ({ name: c.id }));
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const champ = await fetchChampionDetail(params.name);
  if (!champ) return { title: "Şampiyon bulunamadı" };
  const pageUrl = `${BASE_URL}/champions/${params.name}`;
  return {
    title: `${champ.name} Counter Rehberi — LoL AI Coach`,
    description: `${champ.name} nasıl counter'lanır? ${champ.name} — ${champ.title}. Counter pick'ler, build önerileri ve AI koç analizleri.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      url: pageUrl,
      images: [`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizeChampionKey(champ.name)}_0.jpg`],
    },
  };
}

export default async function ChampionDetailPage({ params }: Props) {
  const champ = await fetchChampionDetail(params.name);
  if (!champ) notFound();

  const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizeChampionKey(champ.name)}_0.jpg`;
  const tips = [...(champ.allytips ?? []), ...(champ.enemytips ?? [])].slice(0, 3);
  const counterTips = (champ.enemytips ?? []).slice(0, 4);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${champ.name} nasıl counter'lanır?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: counterTips.length > 0
            ? counterTips.join(" ")
            : `${champ.name}'a karşı erken baskı oluşturun ve zayıf noktalarını AI koçunuzla analiz edin.`,
        },
      },
      {
        "@type": "Question",
        name: `${champ.name} hangi pozisyonda oynanır?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${champ.name} genellikle ${champ.tags.join(" ve ")} rollerinde oynanır.`,
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Breadcrumb */}
      <p className="mb-6 text-xs text-text-muted">
        <Link href="/champions" className="hover:text-accent">Şampiyonlar</Link>
        {" / "}
        <span className="text-text">{champ.name}</span>
      </p>

      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border">
        <div className="relative h-48 w-full">
          <Image fill priority alt={champ.name} src={splashUrl} sizes="(max-width: 768px) 100vw, 800px" className="object-cover object-top" style={{ filter: "saturate(0.8)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <h1 className="font-display text-4xl font-black text-text">{champ.name}</h1>
          <p className="mt-1 text-sm text-accent capitalize">{champ.title}</p>
          <div className="mt-2 flex gap-2">
            {champ.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-border bg-surface px-3 py-0.5 text-xs text-text-muted">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Lore */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">Hikaye</h2>
        <p className="text-sm leading-relaxed text-text-muted">{champ.blurb}</p>
      </div>

      {/* Base stats */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">Temel İstatistikler</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatRow label="Can" value={Math.round(champ.stats.hp)} />
          <StatRow label="Zırh" value={Math.round(champ.stats.armor)} />
          <StatRow label="Büyü Direnci" value={Math.round(champ.stats.spellblock)} />
          <StatRow label="Saldırı Hasarı" value={Math.round(champ.stats.attackdamage)} />
          <StatRow label="Menzil" value={champ.stats.attackrange} />
          <StatRow label="Hareket Hızı" value={champ.stats.movespeed} />
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">İpuçları</h2>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-muted">
                <span className="mt-0.5 shrink-0 text-accent">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div
        className="rounded-2xl border border-accent/30 p-6 text-center"
        style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(88,70,180,0.06) 100%)" }}
      >
        <p className="mb-1 text-sm font-semibold text-text">{champ.name} ile daha iyi oynamak ister misin?</p>
        <p className="mb-4 text-xs text-text-muted">AI koçun seni analiz ediyor — ücretsiz başla</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
        >
          Ücretsiz Başla →
        </Link>
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
