import OpenAI from "openai";

// Speech-to-text via OpenAI Whisper. Kept here so no route touches the provider
// SDK directly (CLAUDE.md 2.2 — AI SDK calls live only in src/lib/ai).
export async function transcribeAudio(file: File): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcription = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
  });
  return transcription.text;
}
