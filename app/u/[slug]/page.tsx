import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicProfile } from "@/domains/identity/services/profileService";

export const revalidate = 3600;

const TIER_COLORS: Record<string, string> = {
  IRON: "#4a4a5a", BRONZE: "#a05336", SILVER: "#a8b8c8",
  GOLD: "#c89b3c", PLATINUM: "#3cba8c", EMERALD: "#00be93",
  DIAMOND: "#576bce", MASTER: "#9e4fc6", GRANDMASTER: "#e84057", CHALLENGER: "#f4c874",
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
    openGraph: {
      images: [`/api/og/profile/${params.slug}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/profile/${params.slug}`],
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) notFound();

  const iconUrl = profile.profileIconId
    ? `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${profile.profileIconId}.png`
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      {/* Brand */}
      <div className="mb-8">
        <Link href="/login" className="font-display text-xl font-bold text-accent hover:opacity-80">
          LoL AI Coach
        </Link>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt="Profile icon"
              width={56}
              height={56}
              unoptimized
              className="rounded-full border-2 border-accent/30"
            />
          ) : (
            <div className="h-14 w-14 rounded-full border-2 border-accent/30 bg-surface-2" />
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-text">{profile.displayName}</h1>
            {profile.rank && !profile.isPrivate && (
              <p
                className="text-sm font-semibold"
                style={{ color: TIER_COLORS[profile.rank.tier] ?? "#a5b4fc" }}
              >
                {profile.rank.tier} {profile.rank.division} · {profile.rank.lp} LP
                {profile.winRate !== null && ` · %${profile.winRate} WR`}
              </p>
            )}
          </div>
        </div>

        {profile.isPrivate ? (
          <div className="rounded-2xl border border-border bg-surface p-5 text-center text-sm text-text-muted">
            Bu profil gizli olarak ayarlandı.
          </div>
        ) : (
          <>
            {/* Badges */}
            {profile.badges.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">
                  Rozetler
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((b) => (
                    <span
                      key={b.id}
                      title={b.name}
                      className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm"
                    >
                      <span>{b.iconSlug}</span>
                      <span className="text-xs text-text-muted">{b.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top Champions */}
            {profile.topChampions.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">
                  Favori Şampiyonlar
                </h2>
                <div className="space-y-2">
                  {profile.topChampions.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="w-24 truncate text-sm font-medium text-text">{c.name}</span>
                      <div className="flex-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${c.winRate}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-text-muted">%{c.winRate} · {c.games}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-border bg-surface p-5 text-center">
          <p className="mb-3 text-sm text-text-muted">Sen de AI koçunla analiz et →</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Ücretsiz Başla
          </Link>
        </div>
      </div>
    </div>
  );
}
