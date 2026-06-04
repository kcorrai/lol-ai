import OpenAI from "openai";
import type { AiProvider, AiCompletionOptions, AiCompletionResult, ChatMessage } from "@/lib/ai/types";

// Default model — update here when upgrading; nowhere else needs to change.
const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_MAX_TOKENS = 2000;
// Low temperature for factual, structured coaching output (not creative generation).
const DEFAULT_TEMPERATURE = 0.3;

export function createOpenAiProvider(): AiProvider {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return {
    async complete(
      systemPrompt: string,
      userMessage: string,
      options: AiCompletionOptions = {}
    ): Promise<AiCompletionResult> {
      const startMs = Date.now();

      const response = await client.chat.completions.create(
        {
          model: DEFAULT_MODEL,
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
        model: DEFAULT_MODEL,
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
