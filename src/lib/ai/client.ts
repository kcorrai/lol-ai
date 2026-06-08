import type { AiProvider } from "@/lib/ai/types";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";
import { createAnthropicProvider } from "@/lib/ai/providers/anthropic";

export type AiTier = "lite" | "full";

function buildProvider(tier: AiTier): AiProvider {
  const provider = process.env.AI_PROVIDER ?? "openai";
  if (provider === "openai") return createOpenAiProvider(tier);
  if (provider === "anthropic") return createAnthropicProvider(tier);
  throw new Error(
    `AI provider "${provider}" is not supported. Valid values: "openai", "anthropic".`
  );
}

let _fullProvider: AiProvider | null = null;
let _liteProvider: AiProvider | null = null;

export function getAiClient(tier: AiTier = "full"): AiProvider {
  if (tier === "lite") {
    if (!_liteProvider) _liteProvider = buildProvider("lite");
    return _liteProvider;
  }
  if (!_fullProvider) _fullProvider = buildProvider("full");
  return _fullProvider;
}
