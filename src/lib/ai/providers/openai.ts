import OpenAI from "openai";
import type { AiProvider, AiCompletionOptions, AiCompletionResult, ChatMessage } from "@/lib/ai/types";
import type { AiTier } from "@/lib/ai/client";

const FULL_MODEL = process.env.AI_FULL_MODEL ?? "gpt-4o";
const LITE_MODEL = process.env.AI_LITE_MODEL ?? "gpt-4o-mini";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.3;

export function createOpenAiProvider(tier: AiTier = "full"): AiProvider {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = tier === "lite" ? LITE_MODEL : FULL_MODEL;

  return {
    async complete(
      systemPrompt: string,
      userMessage: string,
      options: AiCompletionOptions = {}
    ): Promise<AiCompletionResult> {
      const startMs = Date.now();

      const response = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          response_format: { type: "json_object" },
        },
        // Prevent Inngest jobs from hanging indefinitely if OpenAI is slow
        { signal: AbortSignal.timeout(45_000) }
      );

      const latencyMs = Date.now() - startMs;
      const choice = response.choices[0];
      const usage = response.usage;

      return {
        content: choice.message.content ?? "",
        model: response.model,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        latencyMs,
      };
    },

    async *streamChat(
      systemPrompt: string,
      messages: ChatMessage[],
      options: Pick<AiCompletionOptions, "maxTokens" | "temperature"> = {}
    ): AsyncGenerator<string, void, unknown> {
      const stream = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: options.maxTokens ?? 600,
        temperature: options.temperature ?? 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) yield token;
      }
    },
  };
}
