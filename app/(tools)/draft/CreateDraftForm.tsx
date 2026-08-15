"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { rememberDraftLinks } from "@/domains/draft/components/draftLinkStore";
import { useCreateDraft } from "@/hooks/useCreateDraft";
import type { SeriesMode } from "@/domains/draft";
import { DisabledChampionPicker } from "./DisabledChampionPicker";
import { OptionRow } from "./OptionRow";

// Spelled out rather than left to the label. "Fearless" and "Ironman" mean
// different things to different scrim groups, and a draft that locks a champion
// nobody expected to lose is a draft people redo.
const MODES: Array<{ value: SeriesMode; label: string; blurb: string }> = [
  {
    value: "NORMAL",
    label: "Normal",
    blurb: "Every game starts from the full champion pool.",
  },
  {
    value: "FEARLESS",
    label: "Fearless",
    blurb: "A champion picked in an earlier game is locked out for both teams.",
  },
  {
    value: "TEAM_FEARLESS",
    label: "Team Fearless",
    blurb: "Each team loses only its own earlier picks. The enemy may still take them.",
  },
];

const TIMERS = [15, 30, 60, 90, 0];

export function CreateDraftForm(): React.ReactElement {
  const router = useRouter();
  const create = useCreateDraft();

  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [mode, setMode] = useState<SeriesMode>("NORMAL");
  const [gameCount, setGameCount] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [disabledChampions, setDisabledChampions] = useState<string[]>([]);

  function submit(): void {
    create.mutate(
      {
        team1Name: team1Name.trim() || "Team 1",
        team2Name: team2Name.trim() || "Team 2",
        mode,
        gameCount,
        timerSeconds,
        disabledChampions,
      },
      {
        onSuccess: (draft) => {
          rememberDraftLinks(draft.code, draft);
          router.push(`/draft/${draft.code}?as=${draft.blueToken}`);
        },
      }
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["Team 1", team1Name, setTeam1Name],
            ["Team 2", team2Name, setTeam2Name],
          ] as const
        ).map(([label, value, set]) => (
          <label key={label} className="flex flex-col gap-1.5">
            <span className="hud-label">{label} name</span>
            <input
              type="text"
              value={value}
              maxLength={40}
              onChange={(e) => set(e.target.value)}
              className="notch-sm border border-border bg-surface-2 px-3 py-2 text-[14px] text-text focus:border-accent focus:outline-none"
            />
          </label>
        ))}
      </div>

      <OptionRow label="Series format">
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-pressed={mode === option.value}
              className={`notch-sm border p-3 text-left transition-colors ${
                mode === option.value
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface-2 hover:border-line-3"
              }`}
            >
              <span className="block text-[13px] font-semibold text-text">{option.label}</span>
              <span className="mt-1 block text-[11.5px] leading-relaxed text-text-muted">
                {option.blurb}
              </span>
            </button>
          ))}
        </div>
      </OptionRow>

      <div className="grid gap-5 sm:grid-cols-2">
        <OptionRow label="Games">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} active={gameCount === n} onClick={() => setGameCount(n)}>
                {n}
              </Chip>
            ))}
          </div>
        </OptionRow>

        <OptionRow label="Time per action">
          <div className="flex flex-wrap gap-1.5">
            {TIMERS.map((seconds) => (
              <Chip
                key={seconds}
                active={timerSeconds === seconds}
                onClick={() => setTimerSeconds(seconds)}
              >
                {seconds === 0 ? "Untimed" : `${seconds}s`}
              </Chip>
            ))}
          </div>
        </OptionRow>
      </div>

      <DisabledChampionPicker value={disabledChampions} onChange={setDisabledChampions} />

      {create.isError && (
        <p role="alert" className="text-[13px] text-danger">
          {create.error.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={create.isPending}>
        {create.isPending ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`notch-sm min-w-[44px] border px-3 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface-2 text-text-body hover:border-line-3"
      }`}
    >
      {children}
    </button>
  );
}
