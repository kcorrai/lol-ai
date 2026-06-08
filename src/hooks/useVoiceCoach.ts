"use client";

import { useRef, useState } from "react";
import type { ChatMessage } from "@/lib/ai/types";

export interface VoiceCoachState {
  messages: ChatMessage[];
  isRecording: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  isStreaming: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clear: () => void;
}

export function useVoiceCoach(riotAccountId: string): VoiceCoachState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function speakText(text: string): Promise<void> {
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/coaching/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 1000) }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(resolve);
      });
    } finally {
      setIsSpeaking(false);
    }
  }

  async function sendToChat(userText: string): Promise<void> {
    const userMsg: ChatMessage = { role: "user", content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setIsStreaming(true);
    setError(null);

    try {
      const res = await fetch(`/api/riot/${riotAccountId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, persona: "direct" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? `Error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let content = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content };
          return copy;
        });
      }

      if (content.trim()) await speakText(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      setMessages((prev) => (prev.at(-1)?.content === "" ? prev.slice(0, -1) : prev));
    } finally {
      setIsStreaming(false);
    }
  }

  async function processRecording(blob: Blob): Promise<void> {
    setIsTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "voice.webm");
      const res = await fetch("/api/coaching/voice/transcribe", { method: "POST", body: form });
      if (!res.ok) throw new Error("Transkripsiyon başarısız");
      const { data } = await res.json() as { data: { text: string } };
      if (data.text.trim()) await sendToChat(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ses anlaşılamadı.");
    } finally {
      setIsTranscribing(false);
    }
  }

  async function startRecording(): Promise<void> {
    setError(null);
    audioRef.current?.pause();
    setIsSpeaking(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        void processRecording(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Mikrofon erişimi reddedildi.");
    }
  }

  function stopRecording(): void {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function clear(): void {
    setMessages([]);
    setError(null);
  }

  return { messages, isRecording, isTranscribing, isSpeaking, isStreaming, error, startRecording, stopRecording, clear };
}
