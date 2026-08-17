"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
      className="flex flex-col gap-4"
    >
      {/* Named by number, not by side: the series swaps sides between games, so
          "Blue side" would be wrong from game two onward. */}
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
              className="notch-sm border border-line-2 bg-surface-dark px-3 py-2.5 text-[14px] text-fg-1 focus:border-acid-500 focus:outline-none"
            />
          </label>
        ))}
      </div>

      <OptionRow label="Series format">
        <div className="grid gap-2">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-pressed={mode === option.value}
              className={`tag-cut border p-3 text-left transition-colors ${
                mode === option.value
                  ? "border-acid-500 bg-acid-500/10"
                  : "border-line-1 bg-surface-dark hover:border-line-3"
              }`}
            >
              <span
                className={`block font-display text-[13.5px] font-bold uppercase tracking-wide ${
                  mode === option.value ? "text-acid-500" : "text-fg-1"
                }`}
              >
                {option.label}
              </span>
              <span className="mt-1 block text-[12.5px] leading-relaxed text-fg-3">
                {option.blurb}
              </span>
            </button>
          ))}
        </div>
      </OptionRow>

      {/* Stacked, not side by side: the panel is 420px and five game chips plus
          five timer chips overflow a half-width column into each other. */}
      <div className="grid gap-4">
        <OptionRow label="Games">
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              // The "BO" is decorative — the group is already labelled Games,
              // and hiding it keeps each chip's accessible name the number.
              <Chip key={n} active={gameCount === n} onClick={() => setGameCount(n)}>
                <span aria-hidden="true">BO</span>
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

      <div className="border-t border-line-1 pt-4">
        <DisabledChampionPicker value={disabledChampions} onChange={setDisabledChampions} />
      </div>

      {create.isError && (
        <p role="alert" className="text-[13px] text-danger">
          {create.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={create.isPending}
        className="notch-sm btn-glow flex w-full items-center justify-center gap-2 bg-acid-500 px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink-1000 transition-colors hover:bg-acid-400 disabled:opacity-50"
      >
        {create.isPending ? "Creating…" : "Create draft"}
        {!create.isPending && <ArrowRight className="h-4 w-4" aria-hidden />}
      </button>

      <p className="text-center font-mono text-[9.5px] uppercase tracking-wide text-fg-4">
        No login · one link per side
      </p>
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
      className={`tag-cut min-w-[46px] border px-2.5 py-2 font-mono text-[11.5px] tracking-wide transition-colors ${
        active
          ? "border-acid-500 bg-acid-500/10 text-acid-500"
          : "border-line-1 bg-surface-dark text-fg-3 hover:border-line-3"
      }`}
    >
      {children}
    </button>
  );
}
