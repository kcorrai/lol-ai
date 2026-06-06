import type { AiProvider } from "@/lib/ai/types";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";
import { createAnthropicProvider } from "@/lib/ai/providers/anthropic";

function buildProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER ?? "openai";
  if (provider === "openai") return createOpenAiProvider();
  if (provider === "anthropic") return createAnthropicProvider();
  throw new Error(
    `AI provider "${provider}" is not supported. Valid values: "openai", "anthropic".`
  );
}

let _provider: AiProvider | null = null;

export function getAiClient(): AiProvider {
  if (!_provider) _provider = buildProvider();
  return _provider;
}
