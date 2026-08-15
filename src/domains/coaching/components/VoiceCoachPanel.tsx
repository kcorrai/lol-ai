"use client";

import { useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, X, Loader2 } from "lucide-react";
import { useVoiceCoach } from "@/hooks/useVoiceCoach";
import { ChatBubble } from "@/domains/coaching/components/ChatBubble";

interface Props {
  riotAccountId: string;
  onClose: () => void;
}

export function VoiceCoachPanel({ riotAccountId, onClose }: Props) {
  const {
    messages, isRecording, isTranscribing, isSpeaking, isStreaming,
    error, startRecording, stopRecording, clear,
  } = useVoiceCoach(riotAccountId);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const busy = isTranscribing || isStreaming || isSpeaking;
  const statusText = isRecording
    ? "Recording… release to send"
    : isTranscribing
    ? "Converting speech to text…"
    : isStreaming
    ? "Coach is thinking…"
    : isSpeaking
    ? "Coach is speaking…"
    : "Press and speak";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-text">Voice Coach</p>
          <p className="text-xs text-text-muted">{statusText}</p>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
            >
              Clear
            </button>
          )}
          <button onClick={onClose} className="text-text-muted transition-colors hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-xs text-text-muted">
            Ask your coach a voice question about this report. They&apos;ll respond with voice.
          </p>
        )}
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
          />
        ))}
        {error && <p className="text-center text-xs text-danger">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Push-to-talk */}
      <div className="flex flex-col items-center gap-2 border-t border-border p-5">
        <button
          onPointerDown={() => { if (!busy && !isRecording) void startRecording(); }}
          onPointerUp={() => { if (isRecording) stopRecording(); }}
          onPointerLeave={() => { if (isRecording) stopRecording(); }}
          disabled={busy && !isRecording}
          className={[
            "flex h-16 w-16 items-center justify-center rounded-full transition-all duration-150",
            isRecording
              ? "scale-110 bg-danger shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              : busy
              ? "cursor-not-allowed bg-surface-2"
              : "bg-accent shadow-[0_0_16px_rgba(198,255,61,0.3)] hover:bg-accent/90",
          ].join(" ")}
        >
          {isTranscribing || isStreaming ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : isSpeaking ? (
            <Volume2 className="h-6 w-6 text-white" />
          ) : isRecording ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
        </button>
        <p className="text-xs text-text-muted">
          {isRecording ? "Release to send" : "Press and speak"}
        </p>
      </div>
    </div>
  );
}
