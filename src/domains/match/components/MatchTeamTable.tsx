"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { SummonerSpellIcon } from "@/components/ui/SummonerSpellIcon";
import { runePathIconUrl, keystoneIconUrl, rankEmblemUrl } from "@/lib/ddragon";
import type { ParticipantDetail, TeamObjectives } from "@/domains/match";

function fmt(n: number, d = 1) { return n.toFixed(d); }
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

const POSITION_LABELS: Record<string, string> = {
  TOP: "Top", JUNGLE: "Orman", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Destek",
};

const POSITION_ORDER: Record<string, number> = {
  TOP: 0, JUNGLE: 1, MIDDLE: 2, BOTTOM: 3, UTILITY: 4,
};

const RANK_TIER_COLOR: Record<string, string> = {
  IRON: "text-gray-400", BRONZE: "text-amber-700", SILVER: "text-gray-300",
  GOLD: "text-yellow-400", PLATINUM: "text-teal-400", EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400", MASTER: "text-purple-400", GRANDMASTER: "text-purple-400",
  CHALLENGER: "text-purple-400",
};

function RankBadge({ tier, division, lp }: { tier: string | null; division: string | null; lp: number | null }) {
  if (!tier) return <span className="text-[10px] text-text-muted">—</span>;
  const color = RANK_TIER_COLOR[tier] ?? "text-text-muted";
  const apexTiers = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);
  const divisionStr = apexTiers.has(tier) ? "" : ` ${division ?? ""}`;
  const emblemUrl = rankEmblemUrl(tier);
  return (
    <div className="flex items-center gap-1">
      {emblemUrl && <Image src={emblemUrl} alt={tier} width={20} height={20} unoptimized className="shrink-0" />}
      <span className={`text-[10px] font-medium ${color}`}>
        {tier.charAt(0)}{tier.slice(1).toLowerCase()}{divisionStr}{lp !== null ? ` · ${lp} LP` : ""}
      </span>
    </div>
  );
}

function RuneIcons({ keystone, secondaryPath }: { keystone: number | null; secondaryPath: number | null }) {
  const [k1err, setK1err] = useState(false);
  const [k2err, setK2err] = useState(false);
  const kUrl = keystone ? keystoneIconUrl(keystone) : "";
  const sUrl = secondaryPath ? runePathIconUrl(secondaryPath) : "";
  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      {kUrl && !k1err
        ? <Image src={kUrl} alt="keystone" width={16} height={16} className="rounded-sm" onError={() => setK1err(true)} unoptimized />
        : <span className="h-4 w-4 rounded-sm bg-surface-2" />}
      {sUrl && !k2err
        ? <Image src={sUrl} alt="secondary rune" width={16} height={16} className="rounded-sm opacity-70" onError={() => setK2err(true)} unoptimized />
        : <span className="h-4 w-4 rounded-sm bg-surface-2" />}
    </div>
  );
}

function ObjectivePip({ icon, count, label }: { icon: string; count: number; label: string }) {
  return (
    <span title={label} className="flex items-center gap-1 text-xs">
      <span>{icon}</span>
      <span className="font-semibold text-text">{count}</span>
    </span>
  );
}

function TeamHeader({ team, won, objectives }: { team: ParticipantDetail[]; won: boolean; objectives: TeamObjectives | null }) {
  const totalKills = team.reduce((s, p) => s + p.kills, 0);
  const totalDmg   = team.reduce((s, p) => s + p.damageDealt, 0);
  const totalGold  = team.reduce((s, p) => s + p.goldEarned, 0);
  const totalCS    = team.reduce((s, p) => s + p.cs, 0);
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-t-lg border-b border-border px-4 py-2.5 ${won ? "bg-success/10" : "bg-danger/10"}`}>
      <span className={`text-xs font-bold uppercase tracking-widest ${won ? "text-success" : "text-danger"}`}>
        {won ? "Zafer" : "Yenilgi"}
      </span>
      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span><span className="font-semibold text-text">{totalKills}</span> Kil</span>
        <span><span className="font-semibold text-text">{fmtK(totalDmg)}</span> Hasar</span>
        <span><span className="font-semibold text-text">{fmtK(totalGold)}</span> Altın</span>
        <span><span className="font-semibold text-text">{totalCS}</span> CS</span>
        {objectives && (
          <>
            <ObjectivePip icon="🏰" count={objectives.towers}    label="Kuleler" />
            <ObjectivePip icon="🐉" count={objectives.dragons}   label="Ejderler" />
            <ObjectivePip icon="👁️" count={objectives.heralds}   label="Rift Heralds" />
            <ObjectivePip icon="💀" count={objectives.barons}    label="Baron" />
            <ObjectivePip icon="🔴" count={objectives.inhibitors} label="İnhibitörler" />
          </>
        )}
      </div>
    </div>
  );
}

interface TeamTableProps {
  participants: ParticipantDetail[];
  teamId: number;
  userRiotAccountId: string | null;
  objectives: TeamObjectives | null;
}

export function MatchTeamTable({ participants, teamId, userRiotAccountId, objectives }: TeamTableProps) {
  const team = participants
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => (POSITION_ORDER[a.position] ?? 5) - (POSITION_ORDER[b.position] ?? 5));
  const won = team[0]?.won ?? false;
  const maxDmgDealt = Math.max(...team.map((p) => p.damageDealt), 1);
  const maxDmgTaken = Math.max(...team.map((p) => p.damageTaken), 1);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <TeamHeader team={team} won={won} objectives={objectives} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-text-muted">
              <th className="px-3 py-2 text-left">Şampiyon</th>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-center">K / D / A</th>
              <th className="px-3 py-2 text-center">CS</th>
              <th className="px-3 py-2 text-center">Verilen</th>
              <th className="px-3 py-2 text-center">Alınan</th>
              <th className="px-3 py-2 text-center">Altın</th>
              <th className="px-3 py-2 text-center">Görüş</th>
              <th className="px-3 py-2 text-left">Eşyalar</th>
            </tr>
          </thead>
          <tbody>
            {team.map((p) => {
              const isUser = p.riotAccountId === userRiotAccountId;
              const kp = Math.round(p.killParticipation * 100);
              return (
                <tr key={p.id} className={`border-b border-border last:border-0 ${isUser ? "bg-accent/10" : "bg-surface"}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <SummonerSpellIcon spellId={p.summonerSpell1} size={16} />
                        <SummonerSpellIcon spellId={p.summonerSpell2} size={16} />
                      </div>
                      <RuneIcons keystone={p.runePrimaryKeystone} secondaryPath={p.runeSecondaryPath} />
                      <ChampionIcon name={p.championName} size={32} className="shrink-0" />
                      <div className="min-w-0">
                        <p className={`truncate font-medium ${isUser ? "text-accent" : "text-text"}`}>{p.championName}</p>
                        {p.gameName && (
                          <Link
                            href={`/u/${`${p.gameName}-${p.tagLine}`.replace(/[^a-zA-Z0-9\-_]/g, "-")}`}
                            className="truncate text-[10px] text-text-muted hover:text-accent hover:underline"
                          >
                            {p.gameName}<span className="text-text-muted/50">#{p.tagLine}</span>
                          </Link>
                        )}
                        <p className="text-[10px] text-text-muted/60">
                          {POSITION_LABELS[p.position] ?? p.position}{isUser ? " · sen" : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><RankBadge tier={p.rankTier} division={p.rankDivision} lp={p.rankLp} /></td>
                  <td className="px-3 py-2.5 text-center">
                    <p className="font-semibold text-text">{p.kills}/<span className="text-danger">{p.deaths}</span>/{p.assists}</p>
                    <p className="text-[10px] text-text-muted">{kp}% KP</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <p className="text-text">{p.cs}</p>
                    <p className="text-[10px] text-text-muted">{fmt(p.csPerMinute)}/m</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-text">{fmtK(p.damageDealt)}</span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-danger/70" style={{ width: `${(p.damageDealt / maxDmgDealt) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-text-muted">{fmtK(p.damageTaken)}</span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-warning/60" style={{ width: `${(p.damageTaken / maxDmgTaken) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-text-muted">{fmtK(p.goldEarned)}</td>
                  <td className="px-3 py-2.5 text-center text-text">{p.visionScore}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-0.5">
                      {(p.itemIds ?? []).slice(0, 6).map((id, i) => <ItemIcon key={i} itemId={id} size={28} />)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
