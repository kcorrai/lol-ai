"use client";

import { useState } from "react";
import { HudPanel } from "@/components/dashboard/laneiq/HudPanel";
import { DuoPicker } from "@/components/dashboard/DuoPicker";
import {
  useClearDuo,
  useDuoCandidates,
  useDuoQuests,
  useDuoSynergy,
  useSetDuo,
} from "@/hooks/useDuo";
import { DuoIdentity } from "./DuoIdentity";
import { DuoVerdict } from "./DuoVerdict";
import { DuoFormShift } from "./DuoFormShift";
import { DuoPairs } from "./DuoPairs";
import { DuoQuestList } from "./DuoQuestList";
import { DuoRecentGames } from "./DuoRecentGames";

interface Props {
  riotAccountId: string | null | undefined;
}

/**
 * The duo rail.
 *
 * Everything on the dashboard other than this answers "how am I playing". This answers "how are
 * *we* playing", which is a different question with a different unit of analysis — hence its own
 * column rather than a widget among the others.
 */
export function DuoPanel({ riotAccountId }: Props): React.ReactElement {
  const [picking, setPicking] = useState(false);

  const { data: synergy, isLoading, error } = useDuoSynergy(riotAccountId);
  const { data: quests, isLoading: questsLoading } = useDuoQuests(riotAccountId);
  const { data: candidates } = useDuoCandidates(riotAccountId, picking || !synergy);
  const setDuo = useSetDuo(riotAccountId);
  const clearDuo = useClearDuo(riotAccountId);

  if (isLoading) {
    return (
      <HudPanel className="h-[420px] animate-pulse">
        <span className="sr-only">Loading duo</span>
      </HudPanel>
    );
  }

  if (error) {
    return (
      <HudPanel className="border-l-[3px] border-l-danger p-5">
        <p className="hud-label">{"// Duo"}</p>
        <p className="mt-2 text-[13px] text-text-body">
          Your duo stats could not be loaded. The rest of the dashboard is unaffected.
        </p>
      </HudPanel>
    );
  }

  if (!synergy || picking) {
    return (
      <HudPanel className="p-5">
        <p className="hud-label mb-3">{"// Duo"}</p>
        {!synergy && (
          <p className="mb-4 text-[13px] leading-relaxed text-text-muted">
            Pick the person you queue with. Everything here is then measured against the games you
            play without them.
          </p>
        )}
        <DuoPicker
          candidates={candidates ?? []}
          isSaving={setDuo.isPending}
          error={setDuo.error?.message ?? null}
          onPick={(input) => setDuo.mutate(input, { onSuccess: () => setPicking(false) })}
          onCancel={synergy ? () => setPicking(false) : undefined}
        />
      </HudPanel>
    );
  }

  return (
    <HudPanel>
      <DuoIdentity
        partner={synergy.partner}
        streak={synergy.streak}
        onChange={() => setPicking(true)}
        onClear={() => clearDuo.mutate()}
        isClearing={clearDuo.isPending}
      />
      <DuoVerdict synergy={synergy} />
      {synergy.hasEnoughData && (
        <>
          <DuoFormShift together={synergy.averagesTogether} apart={synergy.averagesApart} />
          <DuoPairs championPairs={synergy.championPairs} rolePairs={synergy.rolePairs} />
        </>
      )}
      <DuoQuestList
        quests={quests?.quests ?? []}
        weekEnd={quests?.weekEnd ?? new Date().toISOString()}
        isLoading={questsLoading}
      />
      <DuoRecentGames matches={synergy.recentShared} />
    </HudPanel>
  );
}
