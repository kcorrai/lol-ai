"use client";

import Image from "next/image";
import { useState } from "react";
import { Trophy, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDDragonItems } from "@/hooks/useDDragonItems";
import { useDDragonRunes } from "@/hooks/useDDragonRunes";
import type { CounterEntry } from "../types/counter.types";

const PHASE: Record<string, { pct: number; label: string; bar: string }> = {
  Strong: { pct: 80, label: "Güçlü",   bar: "bg-green-500"  },
  Even:   { pct: 50, label: "Dengeli", bar: "bg-yellow-500" },
  Weak:   { pct: 22, label: "Zayıf",   bar: "bg-red-500"    },
};

const DIFF: Record<string, { label: string; cls: string }> = {
  easy:   { label: "Kolay", cls: "text-green-400"  },
  medium: { label: "Orta",  cls: "text-yellow-400" },
  hard:   { label: "Zor",   cls: "text-red-400"    },
};

const TIER_LABELS = { beginner: "Yeni Oyuncu", experienced: "Deneyimli", otp: "OTP" } as const;

function SL({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{children}</p>;
}

function RI({ url, label, size }: { url: string; label: string; size: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) return <span className="rounded bg-surface-2 ring-1 ring-border/40 shrink-0 inline-block" style={{ width: size, height: size }} />;
  return <Image src={url} alt={label} width={size} height={size} className="rounded shrink-0" onError={() => setErr(true)} unoptimized />;
}

function IB({ name, url }: { name: string; url?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-text">
      {url && <Image src={url} alt={name} width={14} height={14} className="rounded" unoptimized />}
      {name}
    </span>
  );
}

export function CounterCardDetails({ entry }: { entry: CounterEntry }) {
  const { getItemIconUrl } = useDDragonItems();
  const { getRuneIconUrl } = useDDragonRunes();

  return (
    <div className="border-t border-border space-y-4 px-4 py-3.5">

      {/* Game Phase Strength — progress bars */}
      {entry.lanePhases && (
        <div>
          <SL>Güç Eğrisi</SL>
          <div className="space-y-1.5">
            {(["early", "mid", "late"] as const).map((k) => {
              const p = PHASE[entry.lanePhases![k]];
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-10 text-[11px] text-text-muted">{k === "early" ? "Early" : k === "mid" ? "Mid" : "Late"}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className={cn("h-full rounded-full", p.bar)} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className={cn("w-14 text-right text-[11px]", p.pct >= 70 ? "text-green-400" : p.pct <= 30 ? "text-red-400" : "text-yellow-400")}>{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Rune Page */}
      {entry.runeAdvice && (
        <div>
          <SL>Rune Sayfası</SL>
          <div className="flex gap-5">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
                <RI url={getRuneIconUrl(entry.runeAdvice.primaryPath) ?? ""} label={entry.runeAdvice.primaryPath} size={14} />
                <span className="text-[11px] text-text-muted">{entry.runeAdvice.primaryPath}</span>
              </div>
              <div className="flex items-center gap-2">
                <RI url={getRuneIconUrl(entry.runeAdvice.keystone) ?? ""} label={entry.runeAdvice.keystone} size={26} />
                <span className="text-xs font-semibold text-text">{entry.runeAdvice.keystone}</span>
              </div>
              {entry.runeAdvice.primaryRunes?.map((r) => (
                <div key={r} className="flex items-center gap-2 ml-1">
                  <RI url={getRuneIconUrl(r) ?? ""} label={r} size={16} />
                  <span className="text-[11px] text-text-muted">{r}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
                <RI url={getRuneIconUrl(entry.runeAdvice.secondaryPath) ?? ""} label={entry.runeAdvice.secondaryPath} size={14} />
                <span className="text-[11px] text-text-muted">{entry.runeAdvice.secondaryPath}</span>
              </div>
              {entry.runeAdvice.secondaryRunes?.map((r) => (
                <div key={r} className="flex items-center gap-2 ml-1">
                  <RI url={getRuneIconUrl(r) ?? ""} label={r} size={16} />
                  <span className="text-[11px] text-text-muted">{r}</span>
                </div>
              ))}
            </div>
          </div>
          {entry.runeAdvice.statShards && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted mr-1">Shards</span>
              {entry.runeAdvice.statShards.map((s, i) => (
                <span key={i} className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] text-text">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skill Order */}
      {entry.skillOrder && (
        <div>
          <SL>Skill Sırası</SL>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="w-5" />
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className="w-6 text-center text-[10px] text-text-muted tabular-nums">{i + 1}</span>
              ))}
            </div>
            {(["Q", "W", "E", "R"] as const).map((sk) => (
              <div key={sk} className="flex items-center gap-1">
                <span className="w-5 text-[11px] font-bold text-accent font-mono">{sk}</span>
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold",
                    entry.skillOrder!.order[i] === sk
                      ? sk === "R" ? "bg-purple-500/25 text-purple-300" : "bg-accent/20 text-accent"
                      : "text-border"
                  )}>
                    {entry.skillOrder!.order[i] === sk ? sk : "·"}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-text-muted">
            Max: <span className="text-text font-medium">{entry.skillOrder.maxOrder.join(" → ")}</span>
          </p>
        </div>
      )}

      {/* Build Path */}
      {entry.buildPath ? (
        <div>
          <SL>Build Yolu</SL>
          <div className="space-y-1.5">
            {([["Başlangıç", entry.buildPath.startingItems], ["First Back", entry.buildPath.firstBack],
               ["Core", entry.buildPath.coreItems], ["Full Build", entry.buildPath.fullBuild]] as [string, string[]][])
              .filter(([, items]) => items.length > 0)
              .map(([label, items]) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="w-20 shrink-0 pt-0.5 text-[11px] text-text-muted">{label}</span>
                  <div className="flex flex-wrap gap-1">{items.map((item) => <IB key={item} name={item} url={getItemIconUrl(item) ?? undefined} />)}</div>
                </div>
              ))}
          </div>
          {entry.buildPath.situational && Object.keys(entry.buildPath.situational).length > 0 && (
            <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
              <p className="mb-1 text-[11px] text-text-muted uppercase tracking-wide font-semibold">Durumsal</p>
              {Object.entries(entry.buildPath.situational).map(([key, items]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[11px] text-text-muted">{key}</span>
                  <div className="flex flex-wrap gap-1">{items.map((item) => <IB key={item} name={item} url={getItemIconUrl(item) ?? undefined} />)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : entry.keyItems && entry.keyItems.length > 0 && (
        <div>
          <SL>Core Build</SL>
          <div className="flex flex-wrap gap-1.5">
            {entry.keyItems.map((item) => <IB key={item} name={item} url={getItemIconUrl(item) ?? undefined} />)}
          </div>
        </div>
      )}

      {/* Lane Advantage + Watch Out */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><SL>Lane Avantajı</SL><p className="text-xs text-text">{entry.laneAdvantage}</p></div>
        <div><SL>Dikkat Et</SL><p className="text-xs text-text">{entry.watchOut}</p></div>
      </div>

      {/* Win Conditions + Common Mistakes */}
      {(entry.winConditions?.length || entry.commonMistakes?.length) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {entry.winConditions && entry.winConditions.length > 0 && (
            <div>
              <SL><Trophy className="inline h-3 w-3 text-green-400 mr-1" />Kazanma Planı</SL>
              <ul className="space-y-0.5">
                {entry.winConditions.map((c, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-text"><span className="mt-0.5 text-green-400 shrink-0">✓</span>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {entry.commonMistakes && entry.commonMistakes.length > 0 && (
            <div>
              <SL><ShieldAlert className="inline h-3 w-3 text-red-400 mr-1" />Sık Yapılan Hatalar</SL>
              <ul className="space-y-0.5">
                {entry.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-text"><span className="mt-0.5 text-red-400 shrink-0">✗</span>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Difficulty Tiers */}
      {entry.difficultyTiers && (
        <div>
          <SL>Matchup Zorluğu</SL>
          <div className="space-y-1">
            {(["beginner", "experienced", "otp"] as const).map((k) => {
              const d = DIFF[entry.difficultyTiers![k]];
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-24 text-[11px] text-text-muted">{TIER_LABELS[k]}</span>
                  <span className={cn("text-xs font-semibold", d.cls)}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
