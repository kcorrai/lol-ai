"use client";

import { useState } from "react";
import { Radio, RotateCcw, KeyRound } from "lucide-react";
import {
  useCreatorKit,
  useEnableCreatorKit,
  useOverlayPreview,
  useResetCreatorSession,
  useRotateOverlayKey,
  useSaveCreatorSettings,
} from "@/hooks/useCreatorKit";
import { ChatCommandGuide } from "@/domains/creator/components/ChatCommandGuide";
import { CreatorSettingsForm } from "@/domains/creator/components/CreatorSettingsForm";
import { OverlayCatalog } from "@/domains/creator/components/OverlayCatalog";
import type { CreatorSettings } from "@/domains/creator/types";

type Tab = "overlays" | "commands" | "settings";

export default function PageClient(): JSX.Element {
  const { data, isLoading } = useCreatorKit();
  const enable = useEnableCreatorKit();
  const save = useSaveCreatorSettings();
  const rotate = useRotateOverlayKey();
  const resetSession = useResetCreatorSession();

  const kit = data?.kit ?? null;
  const { data: preview } = useOverlayPreview(kit?.enabled ? kit.overlayKey : null);
  const [tab, setTab] = useState<Tab>("overlays");
  const [error, setError] = useState<string | null>(null);

  // Read at render rather than baked in at build: the same deployment serves
  // localhost and production, and a URL a creator pastes into OBS has to be the
  // host they are actually on.
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  if (isLoading) {
    return <p className="p-6 text-text-muted">Loading your Streamer Kit…</p>;
  }

  if (!kit) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="font-display text-2xl text-text">Streamer Kit</h1>
        <p className="mt-2 text-text-body">
          Overlays for OBS and chat commands for Twitch, Kick and YouTube, built from your ranked
          history. Free on every plan.
        </p>
        <ul className="mt-4 flex list-disc flex-col gap-1 pl-5 text-sm text-text-body">
          <li>Five browser-source overlays — paste a URL into OBS, nothing to install.</li>
          <li>
            <span className="font-mono text-accent">!rank</span>,{" "}
            <span className="font-mono text-accent">!session</span> and three more, working with the
            chat bot you already run.
          </li>
          <li>
            Stream-safe mode and a broadcast delay, so the overlay cannot give away that a game just
            ended.
          </li>
        </ul>
        <button
          type="button"
          onClick={() => enable.mutate()}
          disabled={enable.isPending}
          className="mt-6 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-ink-1000 disabled:opacity-50"
        >
          <Radio className="h-4 w-4" />
          {enable.isPending ? "Setting up…" : "Turn on creator mode"}
        </button>
      </div>
    );
  }

  function handleSave(settings: CreatorSettings): void {
    setError(null);
    save.mutate(settings, {
      onError: (e) => setError(e instanceof Error ? e.message : "Could not save."),
    });
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="font-display text-2xl text-text">Streamer Kit</h1>
        <p className="mt-1 text-text-body">
          Everything here reads your ranked history. Nothing reads your live game, so none of it can
          break Riot&apos;s rules on in-game overlays.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => resetSession.mutate("start")}
          disabled={resetSession.isPending}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-body hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Start a new session
        </button>
        <button
          type="button"
          onClick={() => resetSession.mutate("clear")}
          disabled={resetSession.isPending}
          className="rounded-lg border border-border px-3 py-2 text-sm text-text-body hover:border-accent hover:text-accent disabled:opacity-50"
        >
          Count from midnight instead
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Roll the key? Every overlay URL and every chat command you have already set up will stop working until you paste the new ones."
              )
            ) {
              rotate.mutate();
            }
          }}
          disabled={rotate.isPending}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-danger hover:border-danger disabled:opacity-50"
        >
          <KeyRound className="h-4 w-4" />
          Roll key
        </button>
      </div>

      <nav className="flex gap-1 border-b border-border" aria-label="Streamer Kit sections">
        {(
          [
            ["overlays", "Overlays"],
            ["commands", "Chat commands"],
            ["settings", "Settings"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value ? "page" : undefined}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === value
                ? "border-b-2 border-accent text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <p className="text-sm text-danger">{error}</p>}

      {tab === "overlays" && (
        <OverlayCatalog origin={origin} overlayKey={kit.overlayKey} preview={preview ?? null} />
      )}
      {tab === "commands" && <ChatCommandGuide origin={origin} overlayKey={kit.overlayKey} />}
      {tab === "settings" && (
        <CreatorSettingsForm kit={kit} saving={save.isPending} onSave={handleSave} />
      )}
    </div>
  );
}
