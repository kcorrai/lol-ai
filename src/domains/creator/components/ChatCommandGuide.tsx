"use client";

import { CopyField } from "@/domains/creator/components/CopyField";
import { CHAT_COMMANDS } from "@/domains/creator/types";

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

export function ChatCommandGuide({
  origin,
  overlayKey,
}: {
  origin: string;
  overlayKey: string;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-body">
        These work with the bot you already use. In Nightbot, StreamElements, Fossabot or Botrix,
        add a custom command and paste the line below as its response. Nothing to install, and the
        same command works on Twitch, Kick and YouTube.
      </p>

      {CHAT_COMMANDS.map((command) => (
        <section key={command} className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-mono text-sm text-accent">{TRIGGER[command]}</h3>
          <p className="mb-3 text-sm text-text-muted">{WHAT[command]}</p>
          <CopyField
            label="Command response"
            value={`$(urlfetch ${origin}/api/overlay/${overlayKey}/chat/${command})`}
          />
        </section>
      ))}

      <p className="text-xs text-text-muted">
        Anyone who has one of these URLs can read the same line your chat sees. If one leaks, roll
        the key above — it replaces the chat commands and the overlay URLs together.
      </p>
    </div>
  );
}
