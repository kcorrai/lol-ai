"use client";

import {
  SettingsPanel,
  Toggle,
  type SettingsSetter,
} from "@/domains/creator/components/SettingsPanel";
import type { CreatorSettings } from "@/domains/creator/types";

/** What a viewer is allowed to learn about the account behind the stream. */
export function PrivacyFields({
  form,
  set,
  inputClass,
}: {
  form: CreatorSettings;
  set: SettingsSetter;
  inputClass: string;
}): JSX.Element {
  return (
    <SettingsPanel title="Privacy">
      <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-start gap-5">
        <div>
          <p className="text-[14.5px] text-text">Stream-safe mode</p>
          <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-text-muted">
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

      <label className="mt-[18px] block border-t border-line-1 pt-[18px]">
        <span className="text-[14.5px] text-text">Display name</span>
        <span className="mt-1.5 block max-w-[62ch] text-[13.5px] leading-relaxed text-text-muted">
          Shown instead of your Riot ID. Leave empty to show your Riot ID, or nothing at all when
          stream-safe mode is on.
        </span>
        <input
          type="text"
          maxLength={32}
          value={form.displayName ?? ""}
          placeholder="kaanproak0#TR1"
          onChange={(e) => set("displayName", e.target.value.trim() === "" ? null : e.target.value)}
          className={`mt-3 w-full max-w-sm ${inputClass}`}
        />
      </label>
    </SettingsPanel>
  );
}
