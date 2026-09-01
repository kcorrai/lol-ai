"use client";

import {
  ChoiceChip,
  SettingsPanel,
  type SettingsSetter,
} from "@/domains/creator/components/SettingsPanel";
import type { CreatorSettings } from "@/domains/creator/types";

const THEMES: [value: string, label: string, swatch: string][] = [
  ["dark", "Dark", "bg-ink-800"],
  ["light", "Light", "bg-[#F0F6F2]"],
  ["transparent", "No card", "bg-transparent"],
];

/** The support hues from the system (ADR-015), plus the accent itself. */
const ACCENTS: [hex: string, name: string][] = [
  ["#C6FF3D", "Acid lime"],
  ["#3FE0C8", "Teal"],
  ["#FFC24B", "Amber"],
  ["#FF5A5A", "Red"],
  ["#4C8FFF", "Blue"],
];

/** Theme and accent — the two things a creator matches to their scene. */
export function LookFields({
  form,
  set,
}: {
  form: CreatorSettings;
  set: SettingsSetter;
}): JSX.Element {
  const accent = form.accentColor.toUpperCase();

  return (
    <SettingsPanel title="Look">
      <p className="hud-label">Theme</p>
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {THEMES.map(([value, label, swatch]) => (
          <ChoiceChip key={value} active={form.theme === value} onClick={() => set("theme", value)}>
            <span className={`h-4 w-4 border border-line-2 ${swatch}`} />
            {label}
          </ChoiceChip>
        ))}
      </div>

      <p className="hud-label mt-5">Accent</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        {ACCENTS.map(([hex, name]) => (
          <button
            key={hex}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={accent === hex}
            onClick={() => set("accentColor", hex)}
            className={`tag-cut grid place-items-center border bg-ink-1000 p-1 transition-shadow ${
              accent === hex ? "glow-accent-soft border-text" : "border-line-2"
            }`}
          >
            <span className="h-6 w-6" style={{ backgroundColor: hex }} />
          </button>
        ))}
        {/* The five presets cover the common case; the picker stays for a
            creator matching an existing brand colour. */}
        <label className="flex items-center gap-2.5 pl-1">
          <span className="font-mono text-[10.5px] uppercase tracking-label text-text-faint">
            Custom
          </span>
          <input
            type="color"
            aria-label="Custom accent colour"
            value={form.accentColor}
            onChange={(e) => set("accentColor", e.target.value.toUpperCase())}
            className="h-9 w-14 border border-line-2 bg-ink-1000 p-1"
          />
        </label>
      </div>
    </SettingsPanel>
  );
}
