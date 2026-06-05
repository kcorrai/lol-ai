"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { keystoneIconUrlByName, runePathIconUrlByName } from "@/lib/ddragon";
import { useDDragonItems } from "@/hooks/useDDragonItems";
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

function ItemWithIcon({ name, size = "sm", getIconUrl }: {
  name: string;
  size?: "sm" | "lg";
  getIconUrl: (n: string) => string | null;
}) {
  const [errored, setErrored] = useState(false);
  const url = getIconUrl(name);
  const px = size === "lg" ? 20 : 16;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded border border-border bg-surface-2 text-text",
      size === "lg" ? "px-2.5 py-1.5 text-sm font-medium" : "px-2 py-1 text-xs"
    )}>
      {url && !errored && (
        <Image src={url} alt={name} width={px} height={px} className="rounded" onError={() => setErrored(true)} unoptimized />
      )}
      {name}
    </span>
  );
}

function RuneIcon({ url, label, size = 24 }: { url: string; label: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="flex flex-col items-center gap-0.5">
      {url && !errored ? (
        <Image src={url} alt={label} width={size} height={size} className="rounded" onError={() => setErrored(true)} unoptimized />
      ) : (
        <span className="rounded bg-surface-2 ring-1 ring-border/40" style={{ width: size, height: size }} />
      )}
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}

export function MatchupSection({ tab, data }: MatchupSectionProps) {
  const { getItemIconUrl } = useDDragonItems();

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
              {la.powerSpikes.map((spike, i) => {
                const spikeItemUrl = spike.item ? getItemIconUrl(spike.item) : null;
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-text">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    {spike.level ? (
                      <span className="font-medium text-accent">Lv{spike.level}</span>
                    ) : spike.item ? (
                      <span className="inline-flex items-center gap-1 font-medium text-accent">
                        {spikeItemUrl && <Image src={spikeItemUrl} alt={spike.item} width={14} height={14} className="rounded" unoptimized />}
                        {spike.item}
                      </span>
                    ) : null}
                    <span>{spike.description}</span>
                  </li>
                );
              })}
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
    return (
      <div className="space-y-4">
        {data.runeAdvice && (
          <div>
            <p className="mb-2 text-xs font-semibold text-text-muted">Rün Tavsiyesi</p>
            <div className="flex items-end gap-4">
              <RuneIcon url={keystoneIconUrlByName(data.runeAdvice.keystone)} label={data.runeAdvice.keystone} size={32} />
              <div className="flex items-end gap-2">
                <RuneIcon url={runePathIconUrlByName(data.runeAdvice.primaryPath)} label={data.runeAdvice.primaryPath} size={22} />
                <span className="mb-4 text-xs text-text-muted">+</span>
                <RuneIcon url={runePathIconUrlByName(data.runeAdvice.secondaryPath)} label={data.runeAdvice.secondaryPath} size={22} />
              </div>
            </div>
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">Başlangıç Itemleri</p>
          <div className="flex flex-wrap gap-1.5">{ba.startingItems.map((i) => <ItemWithIcon key={i} name={i} getIconUrl={getItemIconUrl} />)}</div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">Core Itemler</p>
          <div className="flex flex-wrap gap-2">{ba.coreItems.map((i) => <ItemWithIcon key={i} name={i} size="lg" getIconUrl={getItemIconUrl} />)}</div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">Durumsal Itemler</p>
          <div className="flex flex-wrap gap-1.5">{ba.situationalItems.map((i) => <ItemWithIcon key={i} name={i} getIconUrl={getItemIconUrl} />)}</div>
        </div>
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
