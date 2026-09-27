import Image from "next/image";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { championSplashUrl } from "@/lib/ddragon";
import { formatCount } from "@/lib/uiLocale";

type Verdict = "favored" | "even" | "unfavored";

const VERDICT: Record<Verdict, { label: string; chip: string }> = {
  favored: { label: "Favoured", chip: "border-accent/60 bg-accent/10 text-accent" },
  even: { label: "Even", chip: "border-line-2 bg-surface-2 text-text-body" },
  unfavored: { label: "Unfavoured", chip: "border-danger/50 bg-danger/10 text-danger" },
};

interface MatchupVersusProps {
  a: { key: string; name: string };
  b: { key: string; name: string };
  aWinRate: number; // 0-100, A's win rate against B
  games: number; // 0 = no significant sample
  verdict: Verdict;
  footnote: string;
}

function Side({
  champ,
  align,
}: {
  champ: { key: string; name: string };
  align: "left" | "right";
}): React.ReactElement {
  return (
    <div className={`flex flex-col gap-2 ${align === "left" ? "items-start" : "items-end"}`}>
      <ChampionIcon name={champ.key} size={64} />
      <span className="font-display text-lg font-black uppercase tracking-[0.03em] text-text md:text-2xl">
        {champ.name}
      </span>
    </div>
  );
}

/**
 * The head-to-head, over both champions' splash art: each side's portrait on its own half, the
 * win rate and verdict between them, the opposed bar underneath. The two numbers always add to 100
 * because they describe the same games.
 */
export function MatchupVersus({
  a,
  b,
  aWinRate,
  games,
  verdict,
  footnote,
}: MatchupVersusProps): React.ReactElement {
  const hasData = games > 0;
  const bWinRate = Math.round((100 - aWinRate) * 10) / 10;
  const tone = aWinRate >= 52 ? "text-accent" : aWinRate <= 48 ? "text-danger" : "text-text";
  const v = VERDICT[verdict];

  return (
    <section className="notch relative overflow-hidden border border-border bg-surface-dark">
      <div className="absolute inset-y-0 left-0 w-1/2">
        <Image
          src={championSplashUrl(a.key)}
          alt=""
          aria-hidden
          fill
          priority
          sizes="50vw"
          className="object-cover object-[35%_20%] opacity-50"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent from-[30%] to-surface-dark" />
      </div>
      <div className="absolute inset-y-0 right-0 w-1/2">
        <Image
          src={championSplashUrl(b.key)}
          alt=""
          aria-hidden
          fill
          sizes="50vw"
          className="object-cover object-[65%_20%] opacity-50"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent from-[30%] to-surface-dark" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent" />
      <div className="bg-scanline absolute inset-0" />

      <div className="relative px-5 pb-5 pt-7 md:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <Side champ={a} align="left" />
          <div className="pb-1 text-center">
            {hasData ? (
              <>
                <div
                  className={`font-mono text-[40px] font-bold tabular-nums leading-none md:text-[56px] ${tone}`}
                >
                  {aWinRate.toFixed(1)}%
                </div>
                <div className="hud-label mt-2 text-[10px]">{a.name} win rate</div>
                <span
                  className={`tag-cut mt-2.5 inline-block border px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-label ${v.chip}`}
                >
                  {v.label}
                </span>
              </>
            ) : (
              <>
                <div className="font-mono text-[40px] font-bold leading-none text-text-muted">
                  —
                </div>
                <div className="hud-label mt-2 text-[10px]">Not enough games</div>
              </>
            )}
          </div>
          <Side champ={b} align="right" />
        </div>

        {hasData && (
          <div className="mt-6">
            <div className="flex h-2 gap-0.5">
              <div className="bg-info" style={{ width: `${aWinRate}%` }} />
              <div className="bg-danger" style={{ width: `${bWinRate}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[11px] font-bold tabular-nums">
              <span className="text-info">
                {a.name} {aWinRate.toFixed(1)}%
              </span>
              <span className="text-danger">
                {bWinRate.toFixed(1)}% {b.name}
              </span>
            </div>
          </div>
        )}

        <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-[0.12em] text-text-muted">
          {hasData ? `${formatCount(games)} ranked games · ${footnote}` : footnote}
        </p>
      </div>
    </section>
  );
}
