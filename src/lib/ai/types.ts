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
  ): AsyncGenerator<string, void, unknown>;
}
