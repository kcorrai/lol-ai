"use client";

import { Check, X } from "lucide-react";
import { championSplashUrl } from "@/lib/ddragon";
import type { ImpostorVerdict } from "@/domains/quiz";

interface ImpostorRevealProps {
  /** How the hidden axis reads: "region", "class", "release era". */
  category: string;
  /** What the other seven shared. */
  value: string;
  /** What the impostor had there instead. */
  impostorValues: string[];
  candidates: ImpostorVerdict[];
}

/** The seven carriers state the shared value; the impostor states its own. */
function verdictText(candidate: ImpostorVerdict, value: string, category: string): string {
  if (!candidate.isImpostor) return value;
  if (candidate.values.length === 0) return `no ${category}`;
  return candidate.values.slice(0, 2).join(" · ");
}

/**
 * The board, re-drawn with the hidden trait written on every tile. Until now the
 * mode never said what the seven shared, which left a solved puzzle feeling like
 * a coin flip that happened to land.
 */
export function ImpostorReveal({
  category,
  value,
  impostorValues,
  candidates,
}: ImpostorRevealProps): React.JSX.Element {
  const impostor = candidates.find((c) => c.isImpostor);

  return (
    <div className="grid gap-4">
      <div className="notch bg-scanline relative overflow-hidden border border-l-2 border-line-1 border-l-accent bg-surface-dark px-5 py-4">
        <p className="max-w-[46ch] font-display text-[19px] font-bold leading-[1.35] text-fg-1">
          Seven of them share one {category}: <span className="text-accent">{value}</span>.
        </p>
        <p className="mt-2 font-mono text-[12px] leading-relaxed text-fg-2">
          {impostor?.name ?? "The answer"}{" "}
          {impostorValues.length > 0 ? (
            <>
              is <span className="font-bold text-danger">{impostorValues.join(" · ")}</span> instead
            </>
          ) : (
            <>
              has no <span className="font-bold text-danger">{category}</span> at all
            </>
          )}{" "}
          — the only one on the board.
        </p>
      </div>

      <ul className="grid grid-cols-4 gap-2.5 max-[520px]:grid-cols-2">
        {candidates.map((candidate, index) => (
          <li
            key={candidate.id}
            className={`notch relative h-[116px] animate-quiz-flip overflow-hidden border ${
              candidate.isImpostor ? "glow-accent-soft border-accent" : "border-line-2"
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span
              aria-hidden
              className={`absolute inset-0 bg-cover ${candidate.isImpostor ? "" : "opacity-40 grayscale"}`}
              style={{
                backgroundImage: `url('${championSplashUrl(candidate.name)}')`,
                backgroundPosition: "52% 16%",
              }}
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink-1000 via-ink-1000/60 to-transparent"
            />

            <span
              className={`tag-cut absolute left-2 top-2 flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-micro ${
                candidate.isImpostor
                  ? "border-danger bg-ink-1000/80 text-danger"
                  : "border-accent/50 bg-ink-1000/70 text-accent"
              }`}
            >
              {candidate.isImpostor ? (
                <X aria-hidden className="h-2.5 w-2.5" />
              ) : (
                <Check aria-hidden className="h-2.5 w-2.5" />
              )}
              {verdictText(candidate, value, category)}
            </span>

            <span
              className={`absolute inset-x-0 bottom-0 block px-2 py-1.5 font-display text-[12px] font-bold uppercase leading-tight tracking-wide ${
                candidate.isImpostor ? "text-accent" : "text-fg-3"
              }`}
            >
              {candidate.name}
              {candidate.isImpostor && (
                <span className="mt-0.5 block font-mono text-[8.5px] tracking-micro text-danger">
                  The impostor
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
