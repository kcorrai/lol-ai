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

export interface AiProvider {
  complete(
    systemPrompt: string,
    userMessage: string,
    options?: AiCompletionOptions
  ): Promise<AiCompletionResult>;
}
