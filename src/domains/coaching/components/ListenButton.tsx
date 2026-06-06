"use client";

import { useRef, useState } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";

interface Props {
  reportId: string;
}

export function ListenButton({ reportId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleClick() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }

    setState("loading");
    try {
      const res = await fetch(`/api/coaching/reports/${reportId}/tts`);
      if (!res.ok) throw new Error("TTS request failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/5 px-2.5 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
    >
      {state === "loading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : state === "playing" ? (
        <Square className="h-3 w-3 fill-current" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      {state === "loading" ? "Yükleniyor…" : state === "playing" ? "Durdur" : "Seslendir"}
    </button>
  );
}
