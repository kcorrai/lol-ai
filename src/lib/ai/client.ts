import type { AiProvider } from "@/lib/ai/types";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";
import { createAnthropicProvider } from "@/lib/ai/providers/anthropic";
import { tierFor, type AiTask } from "@/lib/ai/taskTiers";

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

function providerForTier(tier: AiTier): AiProvider {
  if (tier === "lite") {
    if (!_liteProvider) _liteProvider = buildProvider("lite");
    return _liteProvider;
  }
  if (!_fullProvider) _fullProvider = buildProvider("full");
  return _fullProvider;
}

/**
 * The client for a named task.
 *
 * Callers name what they are doing rather than which model they want; `taskTiers.ts` decides. That
 * indirection is the point: tier choice was previously a per-call-site decision spread across
 * eleven files, which made the biggest lever on the AI bill impossible to review in one place.
 */
export function getAiClient(task: AiTask): AiProvider {
  return providerForTier(tierFor(task));
}

/** Test seam — the providers are memoised per process, so a suite that swaps AI_PROVIDER needs a way to drop them. */
export function __resetAiClients(): void {
  _fullProvider = null;
  _liteProvider = null;
}
