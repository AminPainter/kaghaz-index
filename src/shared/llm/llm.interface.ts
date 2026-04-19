import type { ZodType } from "zod";

/** Sends a prompt to an LLM and returns a structured response matching the given Zod schema */
export interface ILlm {
  callWithStructuredOutput<T extends Record<string, any>>(
    prompt: string,
    schema: ZodType<T>,
  ): Promise<T>;
}
