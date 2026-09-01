"use client";

import { OverlayStage } from "@/domains/creator/components/OverlayStage";
import { RankWidget } from "@/domains/creator/components/widgets/RankWidget";
import type { CreatorSettings, OverlayPayload } from "@/domains/creator/types";

// What the unsaved form would put on the streamer's canvas.
//
// It renders the real widget over the live payload with the form's values
// patched in, rather than a drawing of one — so a theme, an accent or a redacted
// name is seen before it is saved, and the preview cannot drift from the source.

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

interface Note {
  text: string;
  good: boolean;
}

function notesFor(form: CreatorSettings): Note[] {
  const name = form.displayName?.trim();
  return [
    form.streamSafe
      ? { text: "Riot ID hidden — viewers see no account name.", good: true }
      : name
        ? { text: "Showing your display name instead of the Riot ID.", good: true }
        : { text: "Showing your Riot ID. Turn on stream-safe mode to hide it.", good: false },
    form.delaySeconds > 0
      ? { text: `Delayed by ${form.delaySeconds}s to match your broadcast.`, good: true }
      : {
          text: "No broadcast delay set — a result can appear before your stream shows it.",
          good: false,
        },
    form.goalTier
      ? {
          text: `Climb goal is ${titleCase(form.goalTier)} ${form.goalDivision ?? "IV"}.`,
          good: true,
        }
      : { text: "No climb goal — the goal overlay stays blank.", good: false },
  ];
}

export function SettingsPreview({
  form,
  preview,
}: {
  form: CreatorSettings;
  preview: OverlayPayload | null;
}): JSX.Element {
  const name = form.displayName?.trim();
  const patched: OverlayPayload | null = preview && {
    ...preview,
    theme: form.theme,
    accentColor: form.accentColor,
    identity: {
      ...preview.identity,
      name: form.streamSafe ? (name ?? null) : (name ?? preview.identity.name),
      redacted: form.streamSafe,
    },
  };

  return (
    <div className="sticky top-4">
      <div className="notch glow-accent-soft border border-accent bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line-1 px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-label text-accent">
            {"// Live preview"}
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-label text-text-faint">
            Updates as you type
          </span>
        </div>

        <OverlayStage theme={form.theme} minHeight={190}>
          {patched ? (
            <RankWidget payload={patched} />
          ) : (
            <span className="font-mono text-xs text-text-muted">Preview loading…</span>
          )}
        </OverlayStage>

        <ul className="grid gap-2.5 border-t border-line-1 px-4 py-3.5">
          {notesFor(form).map((note) => (
            <li key={note.text} className="grid grid-cols-[14px_1fr] items-start gap-2.5">
              <span
                className={`mt-[7px] h-[5px] w-[5px] ${note.good ? "bg-accent" : "bg-warning"}`}
              />
              <span className="text-[13px] leading-relaxed text-text-body">{note.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
