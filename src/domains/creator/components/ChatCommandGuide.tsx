"use client";

import { ShieldAlert, Terminal } from "lucide-react";
import { ChatPreview } from "@/domains/creator/components/ChatPreview";
import { CopyField } from "@/domains/creator/components/CopyField";
import { CHAT_COMMANDS, type OverlayPayload } from "@/domains/creator/types";

// Copy-paste setup for the bot the streamer already runs.
//
// We deliberately ship no bot of our own (ADR-026): Nightbot, StreamElements,
// Fossabot and Kick's Botrix all fetch a URL inside a custom command, so the
// same endpoint covers Twitch, Kick and YouTube with nothing to install and no
// account to connect.

const WHAT: Record<(typeof CHAT_COMMANDS)[number], string> = {
  rank: "Current rank, LP, and LP gained this session.",
  session: "Wins, losses and KDA since the session started.",
  lastgame: "Champion, result and line from the last finished game.",
  champs: "The three champions played most this season.",
  laneiq: "A one-line plug with a link, for when chat asks what you use.",
};

/** The command name a viewer types, which is not always the endpoint name. */
const TRIGGER: Record<(typeof CHAT_COMMANDS)[number], string> = {
  rank: "!rank",
  session: "!session",
  lastgame: "!lastgame",
  champs: "!champs",
  laneiq: "!laneiq",
};

const BOTS: string[] = ["Nightbot", "StreamElements", "Fossabot", "Botrix"];

export function ChatCommandGuide({
  origin,
  overlayKey,
  preview,
}: {
  origin: string;
  overlayKey: string;
  preview: OverlayPayload | null;
}): JSX.Element {
  return (
    <div className="grid gap-4">
      <div className="notch flex flex-wrap items-center gap-3.5 border border-line-1 bg-surface px-[18px] py-4">
        <Terminal className="h-[17px] w-[17px] shrink-0 text-accent" />
        <p className="max-w-[78ch] flex-1 text-sm text-text-body">
          These work with the bot you already use. In Nightbot, StreamElements, Fossabot or Botrix,
          add a custom command and paste the line below as its response. Nothing to install, and the
          same command works on Twitch, Kick and YouTube.
        </p>
        <span className="flex flex-wrap gap-1.5">
          {BOTS.map((bot) => (
            <span
              key={bot}
              className="tag-cut border border-line-2 bg-ink-1000 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-label text-text-muted"
            >
              {bot}
            </span>
          ))}
        </span>
      </div>

      {CHAT_COMMANDS.map((command) => (
        <section
          key={command}
          className="notch overflow-hidden border border-line-1 bg-surface transition-colors hover:border-line-2"
        >
          <div className="grid xl:grid-cols-[minmax(0,1fr)_440px]">
            <div className="px-5 py-[18px] xl:border-r xl:border-line-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="tag-cut border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-accent">
                  {TRIGGER[command]}
                </h3>
                <p className="text-[13.5px] text-text-muted">{WHAT[command]}</p>
              </div>
              <div className="mt-4">
                <CopyField
                  label="Command response"
                  value={`$(urlfetch ${origin}/api/overlay/${overlayKey}/chat/${command})`}
                />
              </div>
            </div>

            <ChatPreview command={command} trigger={TRIGGER[command]} preview={preview} />
          </div>
        </section>
      ))}

      <p className="flex items-start gap-3 border-l-2 border-warning bg-warning/[0.06] px-[18px] py-4 text-[13.5px] leading-relaxed text-text-body">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <span className="max-w-[88ch]">
          Anyone who has one of these URLs can read the same line your chat sees. If one leaks, roll
          the key above — it replaces the chat commands and the overlay URLs together.
        </span>
      </p>
    </div>
  );
}
