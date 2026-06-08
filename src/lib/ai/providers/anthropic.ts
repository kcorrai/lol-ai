import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider, AiCompletionOptions, AiCompletionResult, ChatMessage } from "@/lib/ai/types";
import type { AiTier } from "@/lib/ai/client";

const FULL_MODEL = process.env.AI_FULL_MODEL ?? "claude-sonnet-4-6";
const LITE_MODEL = process.env.AI_LITE_MODEL ?? "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.3;

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
          system: systemPrompt + "\n\nRespond with valid JSON only. Do not include markdown fences.",
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
    ): AsyncGenerator<string, void, unknown> {
      const stream = await client.messages.create({
        model,
        max_tokens: options.maxTokens ?? 600,
        temperature: options.temperature ?? 0.7,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          yield chunk.delta.text;
        }
      }
    },
  };
}
