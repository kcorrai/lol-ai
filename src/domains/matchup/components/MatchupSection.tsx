"use client";

import { CheckCircle2, XCircle, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchupAnalysis, TradeScenario } from "../types/matchup.types";

export type MatchupTab = "lane" | "trade" | "build" | "mistakes";

interface MatchupSectionProps {
  tab: MatchupTab;
  data: MatchupAnalysis;
}

const ADVANTAGE_STYLES = {
  favorable: "bg-green-500/15 text-green-400 border-green-500/30",
  unfavorable: "bg-red-500/15 text-red-400 border-red-500/30",
  even: "bg-border/40 text-text-muted border-border",
};
const ADVANTAGE_LABELS = { favorable: "Avantajlı", unfavorable: "Dezavantajlı", even: "Dengeli" };
const TRADE_ADV = { you: "bg-green-500/15 text-green-400", opponent: "bg-red-500/15 text-red-400", even: "bg-border/40 text-text-muted" };
const TRADE_ADV_LABELS = { you: "Senin lehine", opponent: "Rakibin lehine", even: "Dengeli" };

function InfoBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <p className="mb-1 text-xs font-semibold text-text-muted">{label}</p>
      <p className="text-sm text-text">{text}</p>
    </div>
  );
}

function TradeCard({ trade }: { trade: TradeScenario }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-1.5">
      <p className="text-sm text-text">{trade.scenario}</p>
      <span className={cn("rounded px-2 py-0.5 text-xs", TRADE_ADV[trade.advantage])}>
        {TRADE_ADV_LABELS[trade.advantage]}
      </span>
      <p className="text-xs text-text-muted">{trade.tip}</p>
    </div>
  );
}

function MistakeCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <p className="mb-2 text-xs font-semibold text-red-400">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-text">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MatchupSection({ tab, data }: MatchupSectionProps) {
  if (tab === "lane") {
    const { laneAnalysis: la } = data;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={cn("rounded border px-2 py-0.5 text-xs font-semibold", ADVANTAGE_STYLES[la.advantage])}>
            {ADVANTAGE_LABELS[la.advantage]}
          </span>
          <p className="text-sm text-text">{la.summary}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoBox label="Level 1-3 Planı" text={la.levels1to3} />
          <InfoBox label="Level 6 Planı" text={la.level6Plan} />
        </div>
        {la.powerSpikes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-text-muted">Güç Noktaları</p>
            <ul className="space-y-1.5">
              {la.powerSpikes.map((spike, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {spike.level ? <span className="font-medium text-accent">Lv{spike.level}</span> : spike.item && <span className="font-medium text-accent">{spike.item}</span>}
                  <span>{spike.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (tab === "trade") {
    const { tradeGuide: tg } = data;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><p className="mb-1.5 text-xs font-semibold text-text-muted">Kısa Trade</p><TradeCard trade={tg.shortTrade} /></div>
          <div><p className="mb-1.5 text-xs font-semibold text-text-muted">Uzun Trade</p><TradeCard trade={tg.longTrade} /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-text-muted">Kazanma Koşulları</p>
            <ul className="space-y-1">{tg.winConditions.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-text"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />{c}</li>
            ))}</ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-text-muted">Kaybetme Koşulları</p>
            <ul className="space-y-1">{tg.loseConditions.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-text"><XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />{c}</li>
            ))}</ul>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "build") {
    const { buildAdvice: ba } = data;
    const ItemBadge = ({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) => (
      <span className={cn("inline-block rounded border border-border bg-surface-2 text-text", size === "lg" ? "px-3 py-1.5 text-sm font-medium" : "px-2 py-1 text-xs")}>
        {name}
      </span>
    );
    return (
      <div className="space-y-4">
        <div><p className="mb-2 text-xs font-semibold text-text-muted">Başlangıç Itemleri</p><div className="flex flex-wrap gap-1.5">{ba.startingItems.map((i) => <ItemBadge key={i} name={i} />)}</div></div>
        <div><p className="mb-2 text-xs font-semibold text-text-muted">Core Itemler</p><div className="flex flex-wrap gap-2">{ba.coreItems.map((i) => <ItemBadge key={i} name={i} size="lg" />)}</div></div>
        <div><p className="mb-2 text-xs font-semibold text-text-muted">Durumsal Itemler</p><div className="flex flex-wrap gap-1.5">{ba.situationalItems.map((i) => <ItemBadge key={i} name={i} />)}</div></div>
        <p className="text-sm italic text-text-muted">{ba.reasoning}</p>
      </div>
    );
  }

  const { criticalMistakes: cm } = data;
  return (
    <div className="space-y-3">
      <MistakeCard title="Kaçınılacak Tradeler" items={cm.avoidTrades} />
      <MistakeCard title="Riskli Zamanlamalar" items={cm.riskyTimings} />
      <MistakeCard title="Kritik Hatalar" items={cm.keyMistakes} />
    </div>
  );
}
