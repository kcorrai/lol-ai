"use client";

import { CheckCircle2, XCircle, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchupAnalysis, TradeScenario } from "../types/matchup.types";

const TRADE_ADV = {
  you: "bg-green-500/15 text-green-400",
  opponent: "bg-red-500/15 text-red-400",
  even: "bg-border/40 text-text-muted",
};
const TRADE_ADV_LABELS = { you: "Senin lehine", opponent: "Rakibin lehine", even: "Dengeli" };

function TradeCard({ trade }: { trade: TradeScenario }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-1.5">
      <p className="text-sm text-text">{trade.scenario}</p>
      <span className={cn("inline-block rounded px-2 py-0.5 text-xs", TRADE_ADV[trade.advantage])}>
        {TRADE_ADV_LABELS[trade.advantage]}
      </span>
      <p className="text-xs text-text-muted">{trade.tip}</p>
    </div>
  );
}

export function MatchupTradeTab({ data }: { data: MatchupAnalysis }) {
  const { tradeGuide: tg } = data;

  return (
    <div className="space-y-4">
      {tg.tradeSequence && (
        <div className="rounded-md border border-accent/20 bg-accent/5 p-3">
          <p className="mb-2.5 text-xs font-semibold text-accent">Takas Sırası</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {tg.tradeSequence.combo.map((ability, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <span className="rounded bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent">
                  {ability}
                </span>
                {i < tg.tradeSequence!.combo.length - 1 && (
                  <ArrowRight className="h-3 w-3 shrink-0 text-text-muted/50" />
                )}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted">{tg.tradeSequence.note}</p>
        </div>
      )}

      {tg.whenToEngage && (
        <div className="rounded-md border border-border bg-surface-2 p-3 flex items-start gap-2.5">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
          <div>
            <p className="mb-0.5 text-xs font-semibold text-yellow-400">Ne Zaman Takasa Gir</p>
            <p className="text-sm text-text">{tg.whenToEngage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-text-muted">Kısa Trade</p>
          <TradeCard trade={tg.shortTrade} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-text-muted">Uzun Trade</p>
          <TradeCard trade={tg.longTrade} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">Kazanma Koşulları</p>
          <ul className="space-y-1">
            {tg.winConditions.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-text">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">Kaybetme Koşulları</p>
          <ul className="space-y-1">
            {tg.loseConditions.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-text">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
