import { ChatAnthropic } from "@langchain/anthropic";
import type { ZodType } from "zod";
import type { ILlm } from "../types";

/**
 * ILlm implementation that uses LangChain's ChatAnthropic with
 * structured output to guarantee responses match a Zod schema.
 */
export class AnthropicLlm implements ILlm {
  private readonly model: ChatAnthropic;

  constructor(modelName: string = "claude-haiku-4-5-20251001") {
    this.model = new ChatAnthropic({ model: modelName, temperature: 0 });
  }

  async callWithStructuredOutput<T extends Record<string, any>>(
    prompt: string,
    schema: ZodType<T>,
  ): Promise<T> {
    const structuredModel = this.model.withStructuredOutput(schema);
    return structuredModel.invoke(prompt) as Promise<T>;
  }
}
