import OpenAI from "openai";

export async function generateSpeech(text: string): Promise<Buffer> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
  });
  return Buffer.from(await response.arrayBuffer());
}
