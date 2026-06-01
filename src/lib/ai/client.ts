import type { AiProvider } from "@/lib/ai/types";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";

function buildProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER ?? "openai";
  if (provider === "openai") return createOpenAiProvider();
  throw new Error(
    `AI provider "${provider}" is not configured. Only "openai" is supported. Set AI_PROVIDER=openai.`
  );
}

let _provider: AiProvider | null = null;

export function getAiClient(): AiProvider {
  if (!_provider) _provider = buildProvider();
  return _provider;
}
