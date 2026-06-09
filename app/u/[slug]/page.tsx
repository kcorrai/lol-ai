import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Trophy } from "lucide-react";
import { getPublicProfile } from "@/domains/identity/services/profileService";
import { PublicProfileHero } from "@/domains/identity/components/PublicProfileHero";
import { PublicProfileChampionPool } from "@/domains/identity/components/PublicProfileChampionPool";

export const revalidate = 3600;

const TIER_LABELS: Record<string, string> = {
  IRON: "Demir", BRONZE: "Bronz", SILVER: "Gümüş", GOLD: "Altın",
  PLATINUM: "Platin", EMERALD: "Zümrüt", DIAMOND: "Elmas",
  MASTER: "Usta", GRANDMASTER: "Büyük Usta", CHALLENGER: "Challenger",
};

const BADGE_STYLES: Record<string, string> = {
  legendary: "border-yellow-400/50 bg-yellow-400/10 text-yellow-300",
  epic:       "border-purple-400/50 bg-purple-400/10 text-purple-300",
  rare:       "border-blue-400/50 bg-blue-400/10 text-blue-300",
  common:     "border-border bg-surface-2 text-text-muted",
};

function wrColor(wr: number): string {
  if (wr >= 55) return "#4ade80";
  if (wr >= 50) return "#c89b3c";
  return "#f87171";
}

function kdaColor(kda: number): string {
  if (kda >= 4) return "#4ade80";
  if (kda >= 3) return "#c89b3c";
  return "#f87171";
}

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfile(params.slug);
  if (!profile) return { title: "Profil bulunamadı" };
  const rankStr = profile.rank
    ? `${TIER_LABELS[profile.rank.tier] ?? profile.rank.tier} ${profile.rank.division} · ${profile.rank.lp} LP`
    : "Unranked";
  return {
    title: `${profile.displayName} — LoL AI Coach`,
    description: `${profile.displayName} | ${rankStr} | ${profile.badges.length} rozet`,
    openGraph: { images: [`/api/og/profile/${params.slug}`] },
    twitter: { card: "summary_large_image", images: [`/api/og/profile/${params.slug}`] },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-background text-text">
      <nav className="sticky top-0 z-10 border-b border-white/5 bg-background/80 px-6 py-3 backdrop-blur-md">
        <Link href="/" className="font-display text-base font-bold text-accent hover:opacity-80 transition-opacity">
          LoL AI Coach
        </Link>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <PublicProfileHero
          displayName={profile.displayName}
          profileIconId={profile.profileIconId}
          rank={profile.rank}
          region={profile.region}
          joinedAt={profile.joinedAt}
          featuredChampion={profile.topChampions[0]?.name ?? null}
          isPrivate={profile.isPrivate}
        />

        {profile.isPrivate && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-text-muted/40" />
            <p className="text-sm font-medium text-text-muted">Bu profil gizli olarak ayarlandı.</p>
          </div>
        )}

        {!profile.isPrivate && (
          <>
            {(profile.totalGames > 0 || profile.winRate !== null || profile.avgKda !== null) && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Toplam Maç", value: profile.totalGames > 0 ? String(profile.totalGames) : "—", sub: profile.winRate !== null ? `%${profile.winRate} KO` : null, subColor: profile.winRate !== null ? wrColor(profile.winRate) : undefined },
                  { label: "Ort. KDA", value: profile.avgKda !== null ? String(profile.avgKda) : "—", sub: profile.avgKda !== null ? (profile.avgKda >= 4 ? "Mükemmel" : profile.avgKda >= 3 ? "İyi" : "Ortalama") : null, subColor: profile.avgKda !== null ? kdaColor(profile.avgKda) : undefined },
                  { label: "Sezon W/L", value: profile.rank ? `${profile.rank.wins}W` : "—", sub: profile.rank ? `${profile.rank.losses}L` : null, subColor: "#f87171" },
                ].map(({ label, value, sub, subColor }) => (
                  <div key={label} className="rounded-xl border border-border bg-surface p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">{label}</p>
                    <p className="mt-1 font-display text-xl font-bold text-text">{value}</p>
                    {sub && <p className="mt-0.5 text-xs font-medium" style={{ color: subColor }}>{sub}</p>}
                  </div>
                ))}
              </div>
            )}

            <PublicProfileChampionPool champions={profile.topChampions} />

            {profile.badges.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-text-muted/50" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">Kazanılan Rozetler</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((b) => (
                    <span key={b.id} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${BADGE_STYLES[b.tier] ?? BADGE_STYLES.common}`}>
                      <span>{b.iconSlug}</span>
                      <span>{b.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="rounded-2xl border border-accent/25 p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(88,70,180,0.06) 100%)" }}>
          <p className="mb-1 text-sm font-semibold text-text">Sen de AI koçunla analiz et</p>
          <p className="mb-4 text-xs text-text-muted">Ücretsiz başla — kredi kartı gerekli değil</p>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90">
            Ücretsiz Başla →
          </Link>
        </div>
      </div>
    </div>
  );
}
