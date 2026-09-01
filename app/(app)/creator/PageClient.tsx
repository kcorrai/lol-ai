"use client";

import { useState } from "react";
import { MonitorPlay, SlidersHorizontal, Terminal, type LucideIcon } from "lucide-react";
import {
  useCreatorKit,
  useEnableCreatorKit,
  useOverlayPreview,
  useResetCreatorSession,
  useRotateOverlayKey,
  useSaveCreatorSettings,
} from "@/hooks/useCreatorKit";
import { ChatCommandGuide } from "@/domains/creator/components/ChatCommandGuide";
import { CreatorIntro } from "@/domains/creator/components/CreatorIntro";
import { CreatorSessionBar } from "@/domains/creator/components/CreatorSessionBar";
import { CreatorSettingsForm } from "@/domains/creator/components/CreatorSettingsForm";
import { OverlayCatalog } from "@/domains/creator/components/OverlayCatalog";
import { CHAT_COMMANDS, OVERLAY_WIDGETS } from "@/domains/creator/types";
import type { CreatorSettings } from "@/domains/creator/types";

type Tab = "overlays" | "commands" | "settings";

const TABS: [id: Tab, label: string, icon: LucideIcon, count: string, note: string][] = [
  [
    "overlays",
    "Overlays",
    MonitorPlay,
    String(OVERLAY_WIDGETS.length),
    "Nothing reads your live game",
  ],
  [
    "commands",
    "Chat commands",
    Terminal,
    String(CHAT_COMMANDS.length),
    "Works with Nightbot, StreamElements, Fossabot, Botrix",
  ],
  ["settings", "Settings", SlidersHorizontal, "", "Applies to every overlay and chat reply"],
];

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
    return <p className="hud-label p-6">Loading your Streamer Kit…</p>;
  }

  if (!kit) {
    return <CreatorIntro onEnable={() => enable.mutate()} enabling={enable.isPending} />;
  }

  function handleSave(settings: CreatorSettings): void {
    setError(null);
    save.mutate(settings, {
      onError: (e) => setError(e instanceof Error ? e.message : "Could not save."),
    });
  }

  function handleRollKey(): void {
    if (
      window.confirm(
        "Roll the key? Every overlay URL and every chat command you have already set up will stop working until you paste the new ones."
      )
    ) {
      rotate.mutate();
    }
  }

  const note = TABS.find(([id]) => id === tab)?.[4] ?? "";

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-6 py-6 lg:px-10">
      <header className="flex flex-wrap items-center gap-3.5">
        <h1 className="font-display text-sm font-extrabold uppercase tracking-wider text-text">
          Streamer kit
        </h1>
        <span className="tag-cut flex items-center gap-2 border border-accent bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-micro text-accent">
          <span className="h-[5px] w-[5px] animate-glow-pulse bg-accent" />
          Creator mode on
        </span>
      </header>

      <CreatorSessionBar
        kit={kit}
        preview={preview ?? null}
        busy={resetSession.isPending || rotate.isPending}
        onStartSession={() => resetSession.mutate("start")}
        onCountFromMidnight={() => resetSession.mutate("clear")}
        onRollKey={handleRollKey}
      />

      <nav className="flex items-center border-b border-line-1" aria-label="Streamer Kit sections">
        {TABS.map(([id, label, Icon, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`-mb-px flex items-center gap-2.5 border-b-2 px-5 py-3.5 transition-colors ${
              tab === id
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <Icon className="h-[15px] w-[15px]" />
            <span className="font-display text-[13px] font-bold uppercase tracking-wider">
              {label}
            </span>
            {count && <span className="font-mono text-[9.5px] tracking-wider">{count}</span>}
          </button>
        ))}
        <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-label text-text-faint lg:block">
          {note}
        </span>
      </nav>

      {error && <p className="text-sm text-danger">{error}</p>}

      {tab === "overlays" && (
        <OverlayCatalog origin={origin} overlayKey={kit.overlayKey} preview={preview ?? null} />
      )}
      {tab === "commands" && (
        <ChatCommandGuide origin={origin} overlayKey={kit.overlayKey} preview={preview ?? null} />
      )}
      {tab === "settings" && (
        <CreatorSettingsForm
          kit={kit}
          preview={preview ?? null}
          saving={save.isPending}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
