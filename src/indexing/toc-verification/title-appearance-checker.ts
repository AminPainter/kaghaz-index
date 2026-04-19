import { z } from "zod";
import type { ILlm } from "../../shared/llm/llm.interface";
import type { ResolvedTocEntry, TocEntryVerificationResult } from "../types";

const appearanceSchema = z.object({
  thinking: z
    .string()
    .describe(
      "Brief reasoning about whether the section title appears on this page",
    ),
  appears: z
    .boolean()
    .describe("Whether the section title appears or starts on this page"),
});

/**
 * Checks whether a single TOC entry's title actually appears on the
 * page it claims to start on, using an LLM with fuzzy matching to
 * account for spacing, casing, and formatting differences.
 */
export class TitleAppearanceChecker {
  constructor(private readonly llm: ILlm) {}

  async check(args: {
    entry: ResolvedTocEntry;
    entryIndex: number;
    pageText: string;
  }): Promise<TocEntryVerificationResult> {
    const prompt = this.buildPrompt({
      entry: args.entry,
      pageText: args.pageText,
    });

    const result = await this.llm.callWithStructuredOutput(
      prompt,
      appearanceSchema,
    );

    return {
      entryIndex: args.entryIndex,
      entry: args.entry,
      isCorrect: result.appears,
      reasoning: result.thinking,
    };
  }

  private buildPrompt(args: {
    entry: ResolvedTocEntry;
    pageText: string;
  }): string {
    return `
You are a document structure verifier.

Here is the text of physical page ${args.entry.physicalIndex}:

${args.pageText}

Does the section titled "${args.entry.title}" (section number: "${args.entry.headingLabel}") appear or start on this page? Use fuzzy matching — ignore spacing, casing, and minor formatting differences.`.trim();
  }
}
