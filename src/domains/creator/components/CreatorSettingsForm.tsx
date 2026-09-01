"use client";

import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import type { RankDivision, RankTier } from "@prisma/client";
import { LookFields } from "@/domains/creator/components/LookFields";
import { PrivacyFields } from "@/domains/creator/components/PrivacyFields";
import { ChoiceChip, SettingsPanel } from "@/domains/creator/components/SettingsPanel";
import { SettingsPreview } from "@/domains/creator/components/SettingsPreview";
import { MAX_DELAY_SECONDS } from "@/domains/creator/session";
import type { CreatorKit, CreatorSettings, OverlayPayload } from "@/domains/creator/types";

const TIERS: RankTier[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];
const DIVISIONS: RankDivision[] = ["IV", "III", "II", "I"];

/** The delays a real broadcast actually runs, so the common case is one click. */
const DELAYS: number[] = [0, 10, 20, 30, 60];

const CONTROL_CLASS =
  "border border-line-2 bg-ink-1000 px-3 py-2.5 font-mono text-sm text-text focus:border-accent";

export function CreatorSettingsForm({
  kit,
  preview,
  saving,
  onSave,
}: {
  kit: CreatorKit;
  preview: OverlayPayload | null;
  saving: boolean;
  onSave: (settings: CreatorSettings) => void;
}): JSX.Element {
  const [form, setForm] = useState<CreatorSettings>(kit);

  // The kit is the source of truth: a save elsewhere (rotating the key, resetting
  // the session) refetches it, and the form must follow rather than hold a stale copy.
  useEffect(() => {
    setForm({
      enabled: kit.enabled,
      riotAccountId: kit.riotAccountId,
      displayName: kit.displayName,
      streamSafe: kit.streamSafe,
      delaySeconds: kit.delaySeconds,
      theme: kit.theme,
      accentColor: kit.accentColor,
      goalTier: kit.goalTier,
      goalDivision: kit.goalDivision,
      twitchHandle: kit.twitchHandle,
      kickHandle: kit.kickHandle,
      youtubeHandle: kit.youtubeHandle,
    });
  }, [kit]);

  function set<K extends keyof CreatorSettings>(key: K, value: CreatorSettings[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const delayed = form.delaySeconds > 0;

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <PrivacyFields form={form} set={set} inputClass={CONTROL_CLASS} />

        <SettingsPanel title="Broadcast delay">
          <p className="max-w-[66ch] text-[13.5px] leading-relaxed text-text-muted">
            Set this to the delay you run in OBS. Every overlay then reports the game as of that
            many seconds ago, so it cannot show a result your stream has not reached.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {DELAYS.map((seconds) => (
              <ChoiceChip
                key={seconds}
                active={form.delaySeconds === seconds}
                onClick={() => set("delaySeconds", seconds)}
              >
                {seconds === 0 ? "None" : `${seconds}s`}
              </ChoiceChip>
            ))}
            <span aria-hidden className="mx-1 h-6 w-px bg-line-1" />
            <input
              type="number"
              min={0}
              max={MAX_DELAY_SECONDS}
              aria-label="Broadcast delay in seconds"
              value={form.delaySeconds}
              onChange={(e) => set("delaySeconds", Number(e.target.value))}
              className={`w-28 ${CONTROL_CLASS}`}
            />
            <span className="font-mono text-[11px] uppercase tracking-label text-text-faint">
              seconds
            </span>
          </div>
          <p
            className={`mt-3.5 flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-wider ${delayed ? "text-accent" : "text-warning"}`}
          >
            <span className={`h-[5px] w-[5px] ${delayed ? "bg-accent" : "bg-warning"}`} />
            {delayed
              ? `Overlays report the game as of ${form.delaySeconds} seconds ago`
              : "No delay — the overlay updates the moment a game ends"}
          </p>
        </SettingsPanel>

        <LookFields form={form} set={set} />

        <SettingsPanel title="Climb goal">
          <p className="text-[13.5px] text-text-muted">The rank the goal overlay counts toward.</p>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <select
              aria-label="Goal tier"
              value={form.goalTier ?? ""}
              onChange={(e) => set("goalTier", (e.target.value || null) as RankTier | null)}
              className={`w-48 ${CONTROL_CLASS}`}
            >
              <option value="">No goal</option>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier.charAt(0) + tier.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <select
              aria-label="Goal division"
              value={form.goalDivision ?? ""}
              onChange={(e) => set("goalDivision", (e.target.value || null) as RankDivision | null)}
              className={`w-28 ${CONTROL_CLASS}`}
            >
              <option value="">—</option>
              {DIVISIONS.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          </div>
        </SettingsPanel>

        <div className="flex flex-wrap items-center gap-3.5">
          <button
            type="submit"
            disabled={saving}
            className="tag-cut btn-glow flex items-center gap-2.5 bg-accent px-5 py-2.5 font-display text-[13px] font-bold uppercase tracking-wider text-ink-1000 transition-all disabled:opacity-50"
          >
            {saving ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save settings"}
          </button>
          <span className="font-mono text-[10.5px] uppercase tracking-label text-text-faint">
            Overlays reload on their own
          </span>
        </div>
      </form>

      <SettingsPreview form={form} preview={preview} />
    </div>
  );
}
