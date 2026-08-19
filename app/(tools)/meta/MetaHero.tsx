import Link from "next/link";
import { championLoadingUrl, abilityVideoUrl } from "@/lib/ddragon";
import { tierLetter } from "@/domains/meta/tierLetter";
import type { MetaMover } from "@/domains/meta";
import { AbilityClip } from "@/components/ui/AbilityClip";

interface HeroCardProps {
  mover: MetaMover;
  numericKey: string | undefined;
  direction: "up" | "down";
}

function HeroCard({ mover, numericKey, direction }: HeroCardProps) {
  const up = direction === "up";
  const poster = championLoadingUrl(mover.championKey);

  return (
    <Link
      href={`/builds/${mover.championKey}`}
      className={`group relative overflow-hidden rounded-2xl border transition-colors ${
        up ? "border-success/30 hover:border-success/60" : "border-danger/30 hover:border-danger/60"
      }`}
    >
      <div className="relative aspect-[16/10]">
        {numericKey ? (
          <AbilityClip
            videoUrl={abilityVideoUrl(numericKey, "R1")}
            posterUrl={poster}
            alt={mover.name}
            className="h-full w-full"
            priority
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- ddragon splash, unoptimized by design
          <img src={poster} alt={mover.name} className="h-full w-full object-cover" />
        )}

        {/* Wash keeps the text legible over splash art of wildly varying brightness. */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${
            up ? "from-success/25" : "from-danger/25"
          } via-background/80 to-background/20`}
        />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p
            className={`text-xs font-bold uppercase tracking-widest ${up ? "text-success" : "text-danger"}`}
          >
            {up ? "Biggest winner" : "Biggest loser"}
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-2xl font-black text-text">{mover.name}</h3>
              <p className="mt-0.5 text-xs text-text-muted">
                Now rank {mover.rank} · {tierLetter(mover.tier)}-tier · {mover.winRate.toFixed(1)}% WR
              </p>
            </div>
            <p
              className={`shrink-0 font-display text-3xl font-black leading-none ${
                up ? "text-success" : "text-danger"
              }`}
            >
              {up ? "▲" : "▼"}
              {Math.abs(mover.delta)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MetaHero({
  climber,
  faller,
  numericKeys,
}: {
  climber?: MetaMover;
  faller?: MetaMover;
  numericKeys: Map<string, string>;
}) {
  if (!climber && !faller) return null;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      {climber && (
        <HeroCard mover={climber} numericKey={numericKeys.get(climber.championKey)} direction="up" />
      )}
      {faller && (
        <HeroCard mover={faller} numericKey={numericKeys.get(faller.championKey)} direction="down" />
      )}
    </div>
  );
}
