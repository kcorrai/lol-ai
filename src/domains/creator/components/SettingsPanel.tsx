"use client";

import type { ReactNode } from "react";
import type { CreatorSettings } from "@/domains/creator/types";

/** One titled block of the settings column. */
export function SettingsPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="notch border border-line-1 bg-surface">
      <h3 className="border-b border-line-1 px-[18px] py-3.5 font-display text-[13px] font-extrabold uppercase tracking-wider text-text">
        {title}
      </h3>
      <div className="px-5 py-[18px]">{children}</div>
    </section>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 border transition-colors ${
        checked ? "border-accent bg-accent" : "border-line-2 bg-ink-1000"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-[18px] w-[18px] transition-transform ${
          checked ? "translate-x-[20px] bg-ink-1000" : "translate-x-0 bg-fg-3"
        }`}
      />
    </button>
  );
}

/** A chip in a row of mutually exclusive choices. */
export function ChoiceChip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`tag-cut flex items-center gap-2.5 border px-3 py-2 font-mono text-[11.5px] uppercase tracking-wider transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-line-2 bg-ink-1000 text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

/** The one writer every settings section shares. */
export type SettingsSetter = <K extends keyof CreatorSettings>(
  key: K,
  value: CreatorSettings[K]
) => void;
