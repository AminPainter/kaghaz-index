import { ChatAnthropic } from "@langchain/anthropic";
import type { ZodType } from "zod";
import type { ILlm } from "./llm.interface";

/**
 * ILlm implementation that uses LangChain's ChatAnthropic with
 * structured output to guarantee responses match a Zod schema.
 * Configured for organization rate limits (5 RPM, 10k input
 * tokens/min): requests are serialized via maxConcurrency=1 and
 * 429/transient errors trigger exponential backoff via maxRetries.
 */
export interface AnthropicLlmConfig {
  apiKey?: string;
  model?: string;
  maxRetries?: number;
}

export class AnthropicLlm implements ILlm {
  private readonly model: ChatAnthropic;

  constructor(config: AnthropicLlmConfig = {}) {
    this.model = new ChatAnthropic({
      apiKey: config.apiKey,
      model: config.model ?? "claude-haiku-4-5-20251001",
      temperature: 0,
      maxConcurrency: 1,
      maxRetries: config.maxRetries ?? 10,
    });
  }

  async callWithStructuredOutput<T extends Record<string, any>>(
    prompt: string,
    schema: ZodType<T>,
  ): Promise<T> {
    const structuredModel = this.model.withStructuredOutput(schema);
    return structuredModel.invoke(prompt) as Promise<T>;
  }
}
