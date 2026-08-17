"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { ItemIcon } from "@/components/ui/ItemIcon";
import type { MatchDetail, ParticipantDetail } from "@/domains/match";

interface MatchDetailRailProps {
  match: MatchDetail;
  me: ParticipantDetail | undefined;
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "loss" }): React.JSX.Element {
  return (
    <div className="flex justify-between gap-2.5">
      <span className="text-fg-3">{label}</span>
      <span className={`font-mono text-xs uppercase ${tone === "loss" ? "text-danger" : "text-fg-1"}`}>
        {value}
      </span>
    </div>
  );
}

export function MatchDetailRail({ match, me }: MatchDetailRailProps): React.JSX.Element {
  const minutes = Math.floor(match.gameDuration / 60);
  const seconds = match.gameDuration % 60;

  return (
    <div className="grid gap-3.5 lg:sticky lg:top-4">
      <section className="notch bg-hero-fade border border-border bg-surface px-4 py-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-label text-text-muted">
          {"// GAME SUMMARY"}
        </div>
        <div className="grid gap-2.5 text-[13px]">
          <Row label="Duration" value={`${minutes}:${String(seconds).padStart(2, "0")}`} />
          <Row label="Queue" value={match.queueType.replace(/_/g, " ")} />
          <Row label="Played" value={new Date(match.gameStart).toLocaleDateString("en-US")} />
          {me && <Row label="Position" value={me.position} />}
          {me && (
            <Row
              label="Result"
              value={me.won ? "Victory" : "Defeat"}
              tone={me.won ? undefined : "loss"}
            />
          )}
        </div>
      </section>

      {me && me.itemIds.length > 0 && (
        <section className="notch border border-border bg-surface px-4 py-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-label text-text-muted">
            {"// YOUR BUILD"}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 6 }, (_, i) => me.itemIds[i] ?? null).map((id, i) => (
              <span
                key={i}
                className="tag-cut flex h-[34px] w-[34px] items-center justify-center border border-line-2 bg-surface-dark"
              >
                {id ? <ItemIcon itemId={id} size={30} /> : null}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="notch glow-accent-soft border border-acid-500 bg-surface px-4 pb-6 pt-4">
        <div className="font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-fg-1">
          Ask about this game
        </div>
        <p className="mb-3 mt-2 text-[12.5px] text-fg-2">
          The coach reads your recent games, this one included.
        </p>
        <Link
          href="/coaching/chat"
          className="notch-sm inline-flex w-full items-center justify-center gap-2 border border-acid-500 px-3 py-2 font-mono text-[10px] uppercase tracking-label text-acid-500 transition-colors hover:bg-acid-500/10"
        >
          <MessageSquare className="h-3 w-3" aria-hidden />
          Open coach chat
        </Link>
      </section>
    </div>
  );
}
