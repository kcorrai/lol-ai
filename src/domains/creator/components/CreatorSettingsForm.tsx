"use client";

import { useEffect, useState } from "react";
import type { RankDivision, RankTier } from "@prisma/client";
import { MAX_DELAY_SECONDS } from "@/domains/creator/session";
import type { CreatorKit, CreatorSettings } from "@/domains/creator/types";

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

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-surface-2"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export function CreatorSettingsForm({
  kit,
  saving,
  onSave,
}: {
  kit: CreatorKit;
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

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text">Stream-safe mode</p>
          <p className="text-sm text-text-muted">
            Hides your Riot ID from every overlay and chat reply. Riot&apos;s own Streamer Mode does
            not hide it from the other players in your game — this hides it from your viewers.
          </p>
        </div>
        <Toggle
          checked={form.streamSafe}
          onChange={(v) => set("streamSafe", v)}
          label="Stream-safe mode"
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text">Broadcast delay (seconds)</span>
        <span className="text-sm text-text-muted">
          Set this to the delay you run in OBS. Every overlay then reports the game as of that many
          seconds ago, so it cannot show a result your stream has not reached.
        </span>
        <input
          type="number"
          min={0}
          max={MAX_DELAY_SECONDS}
          value={form.delaySeconds}
          onChange={(e) => set("delaySeconds", Number(e.target.value))}
          className="mt-1 w-32 rounded-lg border border-border bg-surface-2 px-3 py-2 text-text"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text">Display name</span>
        <span className="text-sm text-text-muted">
          Shown instead of your Riot ID. Leave empty to show your Riot ID, or nothing at all when
          stream-safe mode is on.
        </span>
        <input
          type="text"
          maxLength={32}
          value={form.displayName ?? ""}
          onChange={(e) => set("displayName", e.target.value.trim() === "" ? null : e.target.value)}
          className="mt-1 w-64 rounded-lg border border-border bg-surface-2 px-3 py-2 text-text"
        />
      </label>

      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text">Theme</span>
          <select
            value={form.theme}
            onChange={(e) => set("theme", e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-text"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="transparent">No card</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text">Accent</span>
          <input
            type="color"
            value={form.accentColor}
            onChange={(e) => set("accentColor", e.target.value.toUpperCase())}
            className="h-[42px] w-20 rounded-lg border border-border bg-surface-2 px-1"
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-text">Climb goal</legend>
        <span className="text-sm text-text-muted">The rank the goal overlay counts toward.</span>
        <div className="mt-1 flex gap-2">
          <select
            aria-label="Goal tier"
            value={form.goalTier ?? ""}
            onChange={(e) => set("goalTier", (e.target.value || null) as RankTier | null)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-text"
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
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-text"
          >
            <option value="">—</option>
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-ink-1000 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
