export interface AiCompletionOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * What a finished stream cost.
 *
 * Returned by `streamChat` rather than yielded, because a consumer doing `for await` over the
 * tokens must not have to know it exists — the usage ledger reads it via `yield*`, everyone else
 * ignores it. Absent when the provider did not report usage for that stream.
 */
export interface AiStreamUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export interface AiProvider {
  complete(
    systemPrompt: string,
    userMessage: string,
    options?: AiCompletionOptions
  ): Promise<AiCompletionResult>;

  streamChat(
    systemPrompt: string,
    messages: ChatMessage[],
    options?: Pick<AiCompletionOptions, "maxTokens" | "temperature">
  ): AsyncGenerator<string, AiStreamUsage | undefined, unknown>;
}
