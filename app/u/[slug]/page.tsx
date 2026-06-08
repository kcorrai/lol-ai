import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicProfile } from "@/domains/identity/services/profileService";
import { championSplashUrl, rankEmblemUrl, profileIconUrl } from "@/lib/ddragon";
import { Shield, Trophy, Calendar, Swords } from "lucide-react";

export const revalidate = 3600;

const TIER_COLORS: Record<string, string> = {
  IRON: "#4a4a5a", BRONZE: "#a05336", SILVER: "#a8b8c8",
  GOLD: "#c89b3c", PLATINUM: "#3cba8c", EMERALD: "#00be93",
  DIAMOND: "#576bce", MASTER: "#9e4fc6", GRANDMASTER: "#e84057", CHALLENGER: "#f4c874",
};

const TIER_GLOW: Record<string, string> = {
  MASTER: "rgba(158,79,198,0.35)", GRANDMASTER: "rgba(232,64,87,0.35)", CHALLENGER: "rgba(244,200,116,0.40)",
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

const CHAMPION_VERSION = "14.24.1";

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

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 border-b border-white/5 bg-background/80 px-6 py-3 backdrop-blur-md">
        <Link href="/" className="font-display text-base font-bold text-accent hover:opacity-80 transition-opacity">
          LoL AI Coach
        </Link>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">

        {/* ── Hero card ───────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={tierGlow ? { boxShadow: `0 0 40px ${tierGlow}` } : undefined}
        >
          {/* Champion splash background */}
          {splashUrl ? (
            <>
              <Image fill alt="" aria-hidden src={splashUrl}
                className="object-cover object-[65%_15%]"
                style={{ filter: "saturate(0.6) brightness(0.35)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-surface" />
          )}

          <div className="relative flex items-end gap-5 p-6 pb-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="h-20 w-20 overflow-hidden rounded-full border-2"
                style={{ borderColor: tierColor ?? "#a5b4fc" }}
              >
                {iconUrl ? (
                  <Image src={iconUrl} alt={profile.displayName} width={80} height={80} unoptimized className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-surface-2" />
                )}
              </div>
              {rankEmblem && (
                <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-background/80 shadow-lg">
                  <Image src={rankEmblem} alt={profile.rank!.tier} width={26} height={26} unoptimized />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="font-display text-2xl font-bold leading-tight text-white drop-shadow-md">
                {profile.displayName}
              </h1>

              {profile.rank && !profile.isPrivate ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-bold"
                    style={{
                      background: `${tierColor}20`,
                      color: tierColor ?? "#a5b4fc",
                      border: `1px solid ${tierColor}40`,
                    }}
                  >
                    {isApex && <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: tierColor ?? "#a5b4fc" }} />}
                    {TIER_LABELS[profile.rank.tier] ?? profile.rank.tier}
                    {!isApex && ` ${profile.rank.division}`}
                    {" · "}{profile.rank.lp} LP
                  </span>
                  {profile.winRate !== null && (
                    <span className="text-sm font-medium text-text-muted">
                      %{profile.winRate} kazanma
                    </span>
                  )}
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

        {/* ── Private notice ──────────────────────────────────────── */}
        {profile.isPrivate && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-text-muted/40" />
            <p className="text-sm font-medium text-text-muted">Bu profil gizli olarak ayarlandı.</p>
          </div>
        )}

        {!profile.isPrivate && (
          <>
            {/* ── Champion pool ────────────────────────────────────── */}
            {profile.topChampions.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Swords className="h-3.5 w-3.5 text-text-muted/50" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">
                    En Çok Oynadığı Şampiyonlar
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {profile.topChampions.map((c, i) => {
                    const wr = c.winRate;
                    const wrColor = wr >= 55 ? "#4ade80" : wr >= 50 ? "#c89b3c" : "#f87171";
                    return (
                      <div key={c.name} className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-surface-2/50 p-3 text-center">
                        <div className="relative">
                          <Image
                            src={`https://ddragon.leagueoflegends.com/cdn/${CHAMPION_VERSION}/img/champion/${c.name}.png`}
                            alt={c.name}
                            width={52}
                            height={52}
                            unoptimized
                            className="rounded-lg border border-white/10"
                          />
                          <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-[10px] font-bold text-text-muted">
                            {i + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text leading-tight">{c.name}</p>
                          <p className="mt-0.5 text-[11px] text-text-muted">{c.games} maç</p>
                        </div>
                        <div className="w-full">
                          <div className="mb-1 flex justify-between text-[10px]">
                            <span className="text-text-muted/50">KO</span>
                            <span className="font-bold" style={{ color: wrColor }}>%{wr}</span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full transition-all" style={{ width: `${wr}%`, background: wrColor }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Badges ───────────────────────────────────────────── */}
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
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${BADGE_STYLES[b.tier] ?? BADGE_STYLES.common}`}
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

        {/* ── CTA ──────────────────────────────────────────────────── */}
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
