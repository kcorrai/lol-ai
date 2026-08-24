import Anthropic from "@anthropic-ai/sdk";
import type {
  AiProvider,
  AiCompletionOptions,
  AiCompletionResult,
  AiStreamUsage,
  ChatMessage,
} from "@/lib/ai/types";
import type { AiTier } from "@/lib/ai/client";

const FULL_MODEL = process.env.AI_FULL_MODEL ?? "claude-sonnet-4-6";
const LITE_MODEL = process.env.AI_LITE_MODEL ?? "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.3;

const JSON_ONLY_SUFFIX = "\n\nRespond with valid JSON only. Do not include markdown fences.";

/**
 * The system prompt, marked so Anthropic can serve it from its prompt cache.
 *
 * Caching is a prefix match, and the system prompt is the whole stable prefix of every request
 * this provider makes: it is built once per conversation and then resent, byte-identical, on every
 * turn. Chat is the clearest case — a long coaching context re-uploaded for a two-word follow-up —
 * but any repeated task pays for it too. Cached input is billed at a fraction of fresh input.
 *
 * OpenAI does this automatically for a long enough stable prefix; Anthropic has to be told, which
 * is why only this provider carries the marker. A prompt shorter than the provider's minimum
 * cacheable prefix is simply not cached — the marker is inert, not an error.
 *
 * The volatile half of a request is the user message, which comes after this and therefore cannot
 * invalidate it. `chatSystemPrompt.test.ts` is what keeps the prefix itself stable.
 */
function cacheableSystem(prompt: string): Anthropic.TextBlockParam[] {
  return [{ type: "text", text: prompt, cache_control: { type: "ephemeral" } }];
}

export function createAnthropicProvider(tier: AiTier = "full"): AiProvider {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = tier === "lite" ? LITE_MODEL : FULL_MODEL;

  return {
    async complete(
      systemPrompt: string,
      userMessage: string,
      options: AiCompletionOptions = {}
    ): Promise<AiCompletionResult> {
      const startMs = Date.now();

      const response = await client.messages.create(
        {
          model,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          // Instruct JSON output — Anthropic has no response_format param
          system: cacheableSystem(systemPrompt + JSON_ONLY_SUFFIX),
          messages: [{ role: "user", content: userMessage }],
        },
        { signal: AbortSignal.timeout(45_000) }
      );

      const latencyMs = Date.now() - startMs;
      const block = response.content[0];
      const content = block?.type === "text" ? block.text : "";

      return {
        content,
        model: response.model,
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        latencyMs,
      };
    },

    async *streamChat(
      systemPrompt: string,
      messages: ChatMessage[],
      options: Pick<AiCompletionOptions, "maxTokens" | "temperature"> = {}
    ): AsyncGenerator<string, AiStreamUsage | undefined, unknown> {
      const stream = await client.messages.create({
        model,
        max_tokens: options.maxTokens ?? 600,
        temperature: options.temperature ?? 0.7,
        system: cacheableSystem(systemPrompt),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      });

      // Anthropic reports the two halves of a streamed response's usage at opposite ends: input
      // tokens arrive with `message_start`, output tokens with the closing `message_delta`. Both
      // are needed before the ledger can be told anything, so they are accumulated here and
      // returned once the stream is done.
      let streamModel = model;
      let promptTokens = 0;
      let completionTokens = 0;
      let sawUsage = false;

      for await (const chunk of stream) {
        if (chunk.type === "message_start") {
          streamModel = chunk.message.model;
          promptTokens = chunk.message.usage.input_tokens;
          sawUsage = true;
        }
        if (chunk.type === "message_delta") {
          completionTokens = chunk.usage.output_tokens;
          sawUsage = true;
        }
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          yield chunk.delta.text;
        }
      }

      return sawUsage ? { model: streamModel, promptTokens, completionTokens } : undefined;
    },
  };
}
