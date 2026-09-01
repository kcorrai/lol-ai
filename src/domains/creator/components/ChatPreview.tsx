"use client";

import { renderChatCommand } from "@/domains/creator/services/chatCommandService";
import type { ChatCommand, OverlayPayload } from "@/domains/creator/types";

// The reply, rendered from the same function the endpoint uses.
//
// Showing a hand-written example instead would let the two drift, and the whole
// question a creator has here is what their chat will actually read — so this
// runs `renderChatCommand` over the live preview payload and prints the result.

/** Stand-in viewers, so the line is shown where it will be read. */
const ASKERS: Record<ChatCommand, string> = {
  rank: "vodreviewer",
  session: "midlane_andy",
  lastgame: "cs_diff",
  champs: "otp_enjoyer",
  laneiq: "new_viewer",
};

const ASKER_TONE: Record<ChatCommand, string> = {
  rank: "border-accent text-accent",
  session: "border-info text-info",
  lastgame: "border-warning text-warning",
  champs: "border-accent-blue text-accent-blue",
  laneiq: "border-danger text-danger",
};

export function ChatPreview({
  command,
  trigger,
  preview,
}: {
  command: ChatCommand;
  trigger: string;
  preview: OverlayPayload | null;
}): JSX.Element {
  const asker = ASKERS[command];

  return (
    <div className="bg-ink-1000 px-5 py-[18px]">
      <span className="hud-label">What chat sees</span>
      <div className="mt-3 grid gap-2.5">
        <p className="flex items-start gap-2.5">
          <span
            className={`mt-0.5 h-5 w-5 shrink-0 rounded border bg-surface ${ASKER_TONE[command]}`}
          />
          <span className="min-w-0">
            <span className={`text-[13.5px] font-semibold ${ASKER_TONE[command]}`}>{asker}</span>
            <span className="ml-2 font-mono text-[13px] text-text-body">{trigger}</span>
          </span>
        </p>
        <p className="flex items-start gap-2.5">
          <span className="mt-0.5 h-5 w-5 shrink-0 rounded border border-accent bg-accent/10" />
          <span className="min-w-0">
            <span className="text-[13.5px] font-semibold text-accent">LaneIQBot</span>
            <span className="ml-2 text-[13.5px] leading-relaxed text-text">
              {preview ? (
                renderChatCommand(command, preview)
              ) : (
                <span className="text-text-muted">Loading your line…</span>
              )}
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}
