import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import type { RecapData } from "@/domains/analysis/services/recapService";

interface Props {
  params: { shareToken: string };
}

/** The recap behind a share token, or null. Shared by the metadata and the page. */
async function loadSharedRecap(shareToken: string) {
  return prisma.seasonRecap.findUnique({
    where: { shareToken },
    select: { data: true, seasonLabel: true, generatedAt: true, isPublic: true },
  });
}

/**
 * This page exists to be pasted into Discord, and it was the one share surface with nothing for
 * Discord to read: no title beyond the site default, no description, so a link that is a
 * player's whole season arrived looking like every other link on the site.
 *
 * `noindex`, like the draft room's own token URLs. The token is a capability, not an address —
 * it is handed to specific people, and a search engine is not one of them. Making the recap
 * public is permission for the people holding the link, not for the open web.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recap = await loadSharedRecap(params.shareToken);
  if (!recap || !recap.isPublic) {
    return { title: "Recap not found", robots: { index: false, follow: false } };
  }

  const data = recap.data as unknown as RecapData;
  const lp = `${data.lpDelta > 0 ? "+" : ""}${data.lpDelta} LP`;
  const title = `${recap.seasonLabel} Recap`;

  return {
    title,
    description: `${data.totalMatches} games · ${data.winRate}% win rate · ${lp} · best champion ${data.topChampion.name}.`,
    robots: { index: false, follow: false },
    openGraph: { title, description: `${data.totalMatches} games · ${lp}` },
  };
}

export default async function PublicRecapPage({ params }: Props) {
  const recap = await loadSharedRecap(params.shareToken);

  if (!recap || !recap.isPublic) notFound();

  const data = recap.data as unknown as RecapData;

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-12">
      {/* Platform header */}
      <div className="mb-8 flex items-center gap-2">
        <span className="font-display text-xl font-bold text-accent">LaneIQ</span>
        <span className="text-xs text-text-muted">— {recap.seasonLabel} Recap</span>
      </div>

      {/* Recap card */}
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            {recap.seasonLabel}
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-text">
            This Season&apos;s Record
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          {[
            { label: "Matches", value: String(data.totalMatches) },
            { label: "Win Rate", value: `${data.winRate}%` },
            { label: "LP", value: `${data.lpDelta > 0 ? "+" : ""}${data.lpDelta}` },
            { label: "Best", value: data.topChampion.name },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-surface-2 p-3">
              <p className="font-display text-2xl font-bold text-text">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {data.aiSummary && (
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm italic leading-relaxed text-text-muted">
            &ldquo;{data.aiSummary}&rdquo;
          </div>
        )}

        <div className="text-center text-xs text-text-muted">
          {data.startRank} → {data.endRank}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="mb-3 text-sm text-text-muted">Create your own recap!</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Try it yourself →
        </Link>
      </div>
    </div>
  );
}
