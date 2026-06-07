import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicProfile } from "@/domains/identity/services/profileService";
import { championSplashUrl, rankEmblemUrl, profileIconUrl } from "@/lib/ddragon";

export const revalidate = 3600;

const TIER_COLORS: Record<string, string> = {
  IRON: "#4a4a5a", BRONZE: "#a05336", SILVER: "#a8b8c8",
  GOLD: "#c89b3c", PLATINUM: "#3cba8c", EMERALD: "#00be93",
  DIAMOND: "#576bce", MASTER: "#9e4fc6", GRANDMASTER: "#e84057", CHALLENGER: "#f4c874",
};

const BADGE_TIER_COLORS: Record<string, string> = {
  legendary: "border-yellow-400/60 bg-yellow-400/10 text-yellow-300",
  epic:       "border-purple-400/60 bg-purple-400/10 text-purple-300",
  rare:       "border-blue-400/60 bg-blue-400/10 text-blue-300",
  common:     "border-border bg-surface-2 text-text-muted",
};

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfile(params.slug);
  if (!profile) return { title: "Profil bulunamadı" };

  const rankStr = profile.rank
    ? `${profile.rank.tier} ${profile.rank.division} · ${profile.rank.lp} LP`
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

  const iconUrl = profile.profileIconId ? profileIconUrl(profile.profileIconId) : null;
  const featuredChamp = profile.topChampions[0]?.name ?? null;
  const splashUrl = featuredChamp ? championSplashUrl(featuredChamp) : null;
  const rankEmblem = profile.rank ? rankEmblemUrl(profile.rank.tier) : null;
  const tierColor = profile.rank ? (TIER_COLORS[profile.rank.tier] ?? "#a5b4fc") : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top brand bar */}
      <div className="border-b border-white/5 px-6 py-3">
        <Link href="/login" className="font-display text-base font-bold text-accent hover:opacity-80">
          LoL AI Coach
        </Link>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8 space-y-4">

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
          {/* Champion splash bg */}
          {splashUrl && (
            <>
              <Image fill alt="" aria-hidden
                src={splashUrl}
                className="object-cover object-[60%_15%] opacity-[0.15]"
                style={{ filter: "blur(2px) saturate(0.5)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/80 to-surface/98" />
            </>
          )}

          <div className="relative p-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {iconUrl ? (
                  <Image
                    src={iconUrl}
                    alt={profile.displayName}
                    width={64}
                    height={64}
                    unoptimized
                    className="rounded-full border-2 border-accent/40 shadow-[0_0_16px_rgba(200,155,60,0.25)]"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border-2 border-accent/30 bg-surface-2" />
                )}
              </div>

              {/* Name + rank */}
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold text-text leading-tight">
                  {profile.displayName}
                </h1>
                {profile.rank && !profile.isPrivate && (
                  <div className="mt-1 flex items-center gap-2">
                    {rankEmblem && (
                      <Image src={rankEmblem} alt={profile.rank.tier} width={24} height={24} unoptimized className="shrink-0" />
                    )}
                    <span className="text-sm font-semibold" style={{ color: tierColor ?? "#a5b4fc" }}>
                      {profile.rank.tier.charAt(0)}{profile.rank.tier.slice(1).toLowerCase()}{" "}
                      {profile.rank.division} · {profile.rank.lp} LP
                      {profile.winRate !== null && (
                        <span className="ml-2 text-text-muted font-normal">%{profile.winRate} KO</span>
                      )}
                    </span>
                  </div>
                )}
                {!profile.rank && !profile.isPrivate && (
                  <p className="mt-0.5 text-sm text-text-muted">Unranked</p>
                )}
              </div>
            </div>

            {/* Joined */}
            <p className="mt-3 text-[11px] text-text-muted/50">
              {new Date(profile.joinedAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} tarihinden beri
            </p>
          </div>
        </div>

        {profile.isPrivate ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-text-muted">
            Bu profil gizli olarak ayarlandı.
          </div>
        ) : (
          <>
            {/* Top Champions */}
            {profile.topChampions.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                  En Çok Oynadığı Şampiyonlar
                </h2>
                <div className="space-y-3">
                  {profile.topChampions.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="w-4 shrink-0 text-xs text-text-muted/40 font-medium">{i + 1}</span>
                      <Image
                        src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${c.name}.png`}
                        alt={c.name}
                        width={32}
                        height={32}
                        className="shrink-0 rounded-lg border border-border"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text">{c.name}</span>
                          <span className="text-xs text-text-muted">{c.games} maç</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${c.winRate}%`,
                              background: c.winRate >= 55 ? "#4ade80" : c.winRate >= 50 ? "#c89b3c" : "#f87171",
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-xs font-semibold"
                        style={{ color: c.winRate >= 55 ? "#4ade80" : c.winRate >= 50 ? "#c89b3c" : "#f87171" }}
                      >
                        %{c.winRate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {profile.badges.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                  Rozetler
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((b) => (
                    <span
                      key={b.id}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${BADGE_TIER_COLORS[b.tier] ?? BADGE_TIER_COLORS.common}`}
                    >
                      <span>{b.iconSlug}</span>
                      <span>{b.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div
          className="rounded-2xl border border-accent/30 p-5 text-center"
          style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(88,70,180,0.06) 100%)" }}
        >
          <p className="mb-1 text-sm font-semibold text-text">Sen de AI koçunla analiz et</p>
          <p className="mb-4 text-xs text-text-muted">Ücretsiz başla — kredi kartı gerekli değil</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
          >
            Ücretsiz Başla →
          </Link>
        </div>
      </div>
    </div>
  );
}
