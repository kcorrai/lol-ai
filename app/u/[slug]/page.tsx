import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicProfile } from "@/domains/identity/services/profileService";
import { championSplashUrl, rankEmblemUrl, profileIconUrl } from "@/lib/ddragon";
import { Shield, Trophy, Calendar, Swords, Flame, Crosshair } from "lucide-react";

export const revalidate = 3600;

const TIER_COLORS: Record<string, string> = {
  IRON: "#4a4a5a", BRONZE: "#a05336", SILVER: "#a8b8c8",
  GOLD: "#c89b3c", PLATINUM: "#3cba8c", EMERALD: "#00be93",
  DIAMOND: "#576bce", MASTER: "#9e4fc6", GRANDMASTER: "#e84057", CHALLENGER: "#f4c874",
};

const TIER_GLOW: Record<string, string> = {
  MASTER: "rgba(158,79,198,0.35)",
  GRANDMASTER: "rgba(232,64,87,0.35)",
  CHALLENGER: "rgba(244,200,116,0.40)",
};

const BADGE_STYLES: Record<string, string> = {
  legendary: "border-yellow-400/50 bg-yellow-400/10 text-yellow-300",
  epic:       "border-purple-400/50 bg-purple-400/10 text-purple-300",
  rare:       "border-blue-400/50 bg-blue-400/10 text-blue-300",
  common:     "border-border bg-surface-2 text-text-muted",
};

const TIER_LABELS: Record<string, string> = {
  IRON: "Demir", BRONZE: "Bronz", SILVER: "Gümüş", GOLD: "Altın",
  PLATINUM: "Platin", EMERALD: "Zümrüt", DIAMOND: "Elmas",
  MASTER: "Usta", GRANDMASTER: "Büyük Usta", CHALLENGER: "Challenger",
};

const REGION_FLAGS: Record<string, string> = {
  euw1: "🇪🇺", eun1: "🇪🇺", tr1: "🇹🇷", ru: "🇷🇺",
  na1: "🇺🇸", br1: "🇧🇷", la1: "🌎", la2: "🌎",
  kr: "🇰🇷", jp1: "🇯🇵", oc1: "🇦🇺",
};

const CHAMPION_VERSION = "14.24.1";

function formatMasteryPoints(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`;
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(0)}K`;
  return String(pts);
}

function kdaColor(kda: number): string {
  if (kda >= 4) return "#4ade80";
  if (kda >= 3) return "#c89b3c";
  return "#f87171";
}

function wrColor(wr: number): string {
  if (wr >= 55) return "#4ade80";
  if (wr >= 50) return "#c89b3c";
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

  const iconUrl = profile.profileIconId ? profileIconUrl(profile.profileIconId) : null;
  const featuredChamp = profile.topChampions[0]?.name ?? null;
  const splashUrl = featuredChamp ? championSplashUrl(featuredChamp) : null;
  const rankEmblem = profile.rank ? rankEmblemUrl(profile.rank.tier) : null;
  const tierColor = profile.rank ? (TIER_COLORS[profile.rank.tier] ?? "#a5b4fc") : null;
  const tierGlow = profile.rank ? (TIER_GLOW[profile.rank.tier] ?? null) : null;
  const isApex = profile.rank && ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(profile.rank.tier);
  const regionFlag = profile.region ? (REGION_FLAGS[profile.region] ?? null) : null;

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 border-b border-white/5 bg-background/80 px-6 py-3 backdrop-blur-md">
        <Link href="/" className="font-display text-base font-bold text-accent hover:opacity-80 transition-opacity">
          LoL AI Coach
        </Link>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={tierGlow ? { boxShadow: `0 0 48px ${tierGlow}` } : undefined}
        >
          {splashUrl ? (
            <>
              <Image fill alt="" aria-hidden src={splashUrl}
                className="object-cover object-[65%_15%]"
                style={{ filter: "saturate(0.6) brightness(0.3)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-surface" />
          )}

          <div className="relative flex items-end gap-5 p-6 pb-5">
            {/* Avatar + rank emblem */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2" style={{ borderColor: tierColor ?? "#a5b4fc" }}>
                {iconUrl ? (
                  <Image src={iconUrl} alt={profile.displayName} width={80} height={80} unoptimized className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-surface-2" />
                )}
              </div>
              {rankEmblem && (
                <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-background/90 shadow-lg">
                  <Image src={rankEmblem} alt={profile.rank!.tier} width={26} height={26} unoptimized />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold leading-tight text-white drop-shadow-md">
                  {profile.displayName}
                </h1>
                {regionFlag && (
                  <span className="text-lg leading-none" title={profile.region ?? ""}>{regionFlag}</span>
                )}
                {profile.rank?.hotStreak && (
                  <span className="flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-400/10 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                    <Flame className="h-3 w-3" /> HOT STREAK
                  </span>
                )}
              </div>

              {profile.rank && !profile.isPrivate ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-bold"
                    style={{ background: `${tierColor}20`, color: tierColor ?? "#a5b4fc", border: `1px solid ${tierColor}40` }}
                  >
                    {isApex && <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: tierColor ?? "#a5b4fc" }} />}
                    {TIER_LABELS[profile.rank.tier] ?? profile.rank.tier}
                    {!isApex && ` ${profile.rank.division}`}
                    {" · "}{profile.rank.lp} LP
                  </span>
                  <span className="text-sm text-text-muted">
                    {profile.rank.wins}W {profile.rank.losses}L
                  </span>
                </div>
              ) : !profile.isPrivate ? (
                <p className="mt-1 text-sm text-text-muted">Unranked</p>
              ) : null}

              <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted/50">
                <Calendar className="h-3 w-3" />
                {new Date(profile.joinedAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} tarihinden beri
              </p>
            </div>
          </div>
        </div>

        {/* ── Private ───────────────────────────────────────────────── */}
        {profile.isPrivate && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-text-muted/40" />
            <p className="text-sm font-medium text-text-muted">Bu profil gizli olarak ayarlandı.</p>
          </div>
        )}

        {!profile.isPrivate && (
          <>
            {/* ── Stats strip ───────────────────────────────────────── */}
            {(profile.totalGames > 0 || profile.winRate !== null || profile.avgKda !== null) && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Toplam Maç",
                    value: profile.totalGames > 0 ? String(profile.totalGames) : "—",
                    sub: profile.winRate !== null ? `%${profile.winRate} KO` : null,
                    subColor: profile.winRate !== null ? wrColor(profile.winRate) : undefined,
                  },
                  {
                    label: "Ort. KDA",
                    value: profile.avgKda !== null ? String(profile.avgKda) : "—",
                    sub: profile.avgKda !== null
                      ? (profile.avgKda >= 4 ? "Mükemmel" : profile.avgKda >= 3 ? "İyi" : "Ortalama")
                      : null,
                    subColor: profile.avgKda !== null ? kdaColor(profile.avgKda) : undefined,
                  },
                  {
                    label: "Sezon W/L",
                    value: profile.rank ? `${profile.rank.wins}W` : "—",
                    sub: profile.rank ? `${profile.rank.losses}L` : null,
                    subColor: "#f87171",
                  },
                ].map(({ label, value, sub, subColor }) => (
                  <div key={label} className="rounded-xl border border-border bg-surface p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">{label}</p>
                    <p className="mt-1 font-display text-xl font-bold text-text">{value}</p>
                    {sub && (
                      <p className="mt-0.5 text-xs font-medium" style={{ color: subColor }}>{sub}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Champion pool ──────────────────────────────────────── */}
            {profile.topChampions.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Swords className="h-3.5 w-3.5 text-text-muted/50" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">
                    Şampiyon Havuzu
                  </h2>
                </div>

                <div className="space-y-3">
                  {profile.topChampions.map((c, i) => {
                    const wr = c.winRate;
                    const wc = wrColor(wr);
                    const kc = kdaColor(c.avgKda);
                    return (
                      <div key={c.name} className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-2/40 p-3">
                        {/* Rank number */}
                        <span className="w-4 shrink-0 text-center text-xs font-bold text-text-muted/40">{i + 1}</span>

                        {/* Icon */}
                        <div className="relative shrink-0">
                          <Image
                            src={`https://ddragon.leagueoflegends.com/cdn/${CHAMPION_VERSION}/img/champion/${c.name}.png`}
                            alt={c.name}
                            width={44}
                            height={44}
                            unoptimized
                            className="rounded-lg border border-white/10"
                          />
                          {c.masteryLevel !== null && c.masteryLevel >= 7 && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/20 text-[8px] font-bold text-yellow-300">
                              M{c.masteryLevel}
                            </span>
                          )}
                        </div>

                        {/* Name + games */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-text">{c.name}</span>
                            <span className="shrink-0 text-xs text-text-muted">{c.games} maç</span>
                          </div>

                          {/* Win rate bar */}
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full" style={{ width: `${wr}%`, background: wc }} />
                          </div>

                          {/* Stats row */}
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-text-muted">
                            <span style={{ color: wc }} className="font-semibold">%{wr} KO</span>
                            <span className="flex items-center gap-0.5">
                              <Crosshair className="h-2.5 w-2.5" />
                              <span style={{ color: kc }} className="font-medium">{c.avgKda} KDA</span>
                            </span>
                            <span className="flex items-center gap-0.5">
                              <span className="font-medium">{c.avgCsPerMinute} CS/dk</span>
                            </span>
                            {c.masteryPoints !== null && (
                              <span className="ml-auto text-yellow-400/60">{formatMasteryPoints(c.masteryPoints)} p</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Badges ────────────────────────────────────────────── */}
            {profile.badges.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-text-muted/50" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">
                    Kazanılan Rozetler
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((b) => (
                    <span
                      key={b.id}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${BADGE_STYLES[b.tier] ?? BADGE_STYLES.common}`}
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

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border border-accent/25 p-6 text-center"
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
