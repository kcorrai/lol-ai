"use client";

import { championSplashUrl } from "@/lib/ddragon";
import type { MatchDetail, ParticipantDetail } from "@/domains/match";

interface MatchResultHeaderProps {
  match: MatchDetail;
  me: ParticipantDetail | undefined;
}

function duration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Your game, not a generic title.
 *
 * The old header read the queue name and a timestamp — true of ten thousand
 * other games. The splash, the verdict and the one line the coach wrote about
 * this game are what make the page recognisably yours.
 */
export function MatchResultHeader({ match, me }: MatchResultHeaderProps): React.JSX.Element {
  const won = me?.won;
  const verdict = match.aiInsight?.summary;

  return (
    <section className="relative overflow-hidden border-b border-line-1">
      {me && (
        <span
          className="absolute inset-0 bg-cover opacity-30"
          style={{
            backgroundImage: `url('${championSplashUrl(me.championName)}')`,
            backgroundPosition: "56% 22%",
          }}
          aria-hidden
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-r from-ink-1000 via-ink-1000/85 to-ink-1000/55" />

      <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-6 px-5 pb-5 pt-6 md:px-8">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`font-display text-3xl font-black uppercase leading-none ${
                  won === undefined ? "text-fg-1" : won ? "text-acid-500" : "text-danger"
                }`}
              >
                {won === undefined ? match.gameMode : won ? "Victory" : "Defeat"}
              </span>
              <span className="tag-cut border border-line-2 px-2 py-1 font-mono text-[9px] uppercase tracking-label text-fg-3">
                {match.queueType.replace(/_/g, " ")}
              </span>
            </div>
            <div className="mt-2 font-mono text-[11.5px] uppercase tracking-wide text-fg-3">
              {me
                ? `${me.championName} · ${me.position} · ${me.kills}/${me.deaths}/${me.assists} · ${duration(match.gameDuration)}`
                : duration(match.gameDuration)}
            </div>
          </div>
        </div>

        {verdict && (
          <div className="max-w-[44ch]">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-label text-acid-500">
              {"// ONE-LINE VERDICT"}
            </div>
            <p className="m-0 font-display text-base font-bold uppercase leading-[1.28] text-fg-1">
              {verdict}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
