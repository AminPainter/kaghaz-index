import { countTokensApproximately } from "langchain";
import { HumanMessage } from "@langchain/core/messages";
import type { ITokenCounter } from "../types";

/**
 * Estimates the token count of a text string using LangChain's
 * approximate token counting utility.
 */
export class ApproximateTokenCounter implements ITokenCounter {
  count(text: string): number {
    if (!text) return 0;
    return countTokensApproximately([new HumanMessage(text)]);
  }
}
