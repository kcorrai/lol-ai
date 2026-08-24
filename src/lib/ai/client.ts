import type {
  AiProvider,
  AiCompletionOptions,
  AiCompletionResult,
  ChatMessage,
} from "@/lib/ai/types";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";
import { createAnthropicProvider } from "@/lib/ai/providers/anthropic";
import { tierFor, type AiTask } from "@/lib/ai/taskTiers";
import { recordAiUsage } from "@/lib/ai/usage";

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
 * Wraps a provider so every call it serves is counted against the task that made it.
 *
 * Recording at this layer rather than at the call sites is deliberate: a call site can forget, and
 * ten of the eleven already had. Here there is no way to reach a model without passing through the
 * ledger.
 *
 * Recording never affects the result. `recordAiUsage` swallows its own failures, and the `catch`
 * is the second belt: a Redis outage must not turn a completed coaching report into an error.
 */
function withUsageRecording(provider: AiProvider, task: AiTask): AiProvider {
  return {
    async complete(
      systemPrompt: string,
      userMessage: string,
      options?: AiCompletionOptions
    ): Promise<AiCompletionResult> {
      const result = await provider.complete(systemPrompt, userMessage, options);
      await recordAiUsage({
        task,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      }).catch(() => undefined);
      return result;
    },

    async *streamChat(
      systemPrompt: string,
      messages: ChatMessage[],
      options?: Pick<AiCompletionOptions, "maxTokens" | "temperature">
    ) {
      // `yield*` forwards every token to the caller and hands back what the provider returns at the
      // end of the stream — which is where a streamed response's token counts arrive. Chat is the
      // highest-volume surface and runs on the expensive tier; a ledger that could not see it
      // would be describing the small half of the bill.
      const usage = yield* provider.streamChat(systemPrompt, messages, options);
      if (usage) {
        await recordAiUsage({
          task,
          model: usage.model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        }).catch(() => undefined);
      }
      return usage;
    },
  };
}

/**
 * The client for a named task.
 *
 * Callers name what they are doing rather than which model they want; `taskTiers.ts` decides. That
 * indirection is the point: tier choice was previously a per-call-site decision spread across
 * eleven files, which made the biggest lever on the AI bill impossible to review in one place.
 */
export function getAiClient(task: AiTask): AiProvider {
  return withUsageRecording(providerForTier(tierFor(task)), task);
}

/** Test seam — the providers are memoised per process, so a suite that swaps AI_PROVIDER needs a way to drop them. */
export function __resetAiClients(): void {
  _fullProvider = null;
  _liteProvider = null;
}
