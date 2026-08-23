"use client";

import { PLAYER_SIDE_LABELS } from "@/domains/match/archive/archiveLabels";
import { FacetLabel } from "@/domains/match/components/archive/FacetControls";
import { useDuoCandidates } from "@/hooks/useDuo";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import { cn } from "@/lib/utils";

interface ArchivePlayerFacetProps {
  draft: ArchiveFilters;
  onChange: (patch: Partial<ArchiveFilters>) => void;
  riotAccountId: string | null;
}

const SIDES: ArchiveFilters["playerSide"][] = ["with", "against", "either"];

/**
 * "Games I played with — or against — this person."
 *
 * The API identifies the other player by puuid, which nobody knows and nobody could type. The list
 * of people worth naming is already computed for the duo feature, so the picker is that list: the
 * players this account actually shares games with. It only names teammates, which is why the side
 * selector is still there — picking a regular duo and asking for "against me" is a real question.
 */
export function ArchivePlayerFacet({
  draft,
  onChange,
  riotAccountId,
}: ArchivePlayerFacetProps): React.JSX.Element {
  const { data: candidates = [], isLoading } = useDuoCandidates(riotAccountId);
  const selected = candidates.find((candidate) => candidate.puuid === draft.playerPuuid);

  return (
    <div className="space-y-3">
      <div>
        <FacetLabel>Played with / against</FacetLabel>
        {isLoading ? (
          <p className="text-xs text-fg-4">Loading teammates…</p>
        ) : candidates.length === 0 ? (
          <p className="text-xs text-fg-4">
            No recurring teammates yet — this needs a few games with the same person.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {candidates.map((candidate) => {
              const active = candidate.puuid === draft.playerPuuid;
              return (
                <button
                  key={candidate.puuid}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange({
                      playerPuuid: active ? undefined : candidate.puuid,
                      // Clearing the player has to clear the side with it, or the URL keeps a
                      // qualifier for a person who is no longer part of the search.
                      playerSide: active ? "either" : draft.playerSide,
                    })
                  }
                  className={cn(
                    "tag-cut border px-2 py-1 text-[11px] transition-colors",
                    active
                      ? "border-acid-500 bg-acid-500/10 text-acid-500"
                      : "border-line-2 text-fg-3 hover:border-line-3 hover:text-fg-1"
                  )}
                >
                  {candidate.gameName}
                  <span className="text-fg-4">#{candidate.tagLine}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {draft.playerPuuid && (
        <div>
          <FacetLabel>
            Which side {selected ? `${selected.gameName} was on` : "they were on"}
          </FacetLabel>
          <div className="flex gap-1">
            {SIDES.map((side) => (
              <button
                key={side}
                type="button"
                aria-pressed={draft.playerSide === side}
                onClick={() => onChange({ playerSide: side })}
                className={cn(
                  "tag-cut flex-1 border px-2 py-1 text-[11px] transition-colors",
                  draft.playerSide === side
                    ? "border-acid-500 bg-acid-500/10 text-acid-500"
                    : "border-line-2 text-fg-3 hover:border-line-3 hover:text-fg-1"
                )}
              >
                {PLAYER_SIDE_LABELS[side]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
