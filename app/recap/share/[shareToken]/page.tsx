import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import type { RecapData } from "@/domains/analysis/services/recapService";

interface Props {
  params: { shareToken: string };
}

export default async function PublicRecapPage({ params }: Props) {
  const recap = await prisma.seasonRecap.findUnique({
    where: { shareToken: params.shareToken },
    select: { data: true, seasonLabel: true, generatedAt: true, isPublic: true },
  });

  if (!recap || !recap.isPublic) notFound();

  const data = recap.data as unknown as RecapData;

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-12">
      {/* Platform header */}
      <div className="mb-8 flex items-center gap-2">
        <span className="font-display text-xl font-bold text-accent">LoL AI Coach</span>
        <span className="text-xs text-text-muted">— {recap.seasonLabel} Recap</span>
      </div>

      {/* Recap card */}
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{recap.seasonLabel}</p>
          <h1 className="mt-2 font-display text-3xl font-black text-text">Bu Sezonun Rekoru</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          {[
            { label: "Maç", value: String(data.totalMatches) },
            { label: "Kazanma", value: `%${data.winRate}` },
            { label: "LP", value: `${data.lpDelta > 0 ? "+" : ""}${data.lpDelta}` },
            { label: "En İyi", value: data.topChampion.name },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-surface-2 p-3">
              <p className="font-display text-2xl font-bold text-text">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {data.aiSummary && (
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm italic leading-relaxed text-text-muted">
            "{data.aiSummary}"
          </div>
        )}

        <div className="text-center text-xs text-text-muted">
          {data.startRank} → {data.endRank}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="mb-3 text-sm text-text-muted">Sen de kendi recapını oluştur!</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Bunu ben de dene →
        </Link>
      </div>
    </div>
  );
}
