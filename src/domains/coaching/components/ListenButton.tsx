"use client";

import { useRef, useState } from "react";
import { Volume2, Square, Loader2, AlertCircle } from "lucide-react";

interface Props {
  reportId: string;
  text: string;
}

type State = "idle" | "loading" | "playing" | "error";

export function ListenButton({ reportId, text }: Props) {
  const [state, setState] = useState<State>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  function stopAll() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (synthRef.current) {
      window.speechSynthesis?.cancel();
      synthRef.current = null;
    }
    setState("idle");
  }

  function playViaBrowser() {
    if (!("speechSynthesis" in window)) {
      setState("error");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setState("playing");
  }

  async function handleClick() {
    if (state === "playing") {
      stopAll();
      return;
    }
    if (state === "error") {
      setState("idle");
      return;
    }

    setState("loading");
    try {
      const res = await fetch(`/api/coaching/reports/${reportId}/tts`);
      if (!res.ok) throw new Error("api_failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setState("playing");
    } catch {
      // API TTS failed — fall back to browser speech synthesis
      playViaBrowser();
    }
  }

  const label =
    state === "loading"
      ? "Yükleniyor…"
      : state === "playing"
      ? "Durdur"
      : state === "error"
      ? "Desteklenmiyor"
      : "Seslendir";

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading" || state === "error"}
      title={state === "error" ? "Bu tarayıcı sesli okumayı desteklemiyor" : undefined}
      className="flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/5 px-2.5 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
    >
      {state === "loading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : state === "playing" ? (
        <Square className="h-3 w-3 fill-current" />
      ) : state === "error" ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      {label}
    </button>
  );
}
