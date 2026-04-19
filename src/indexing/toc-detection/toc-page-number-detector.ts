import { z } from "zod";
import type { ILlm } from "../../shared/llm/llm.interface";
import type { PageList } from "../types";

const pageNumberDetectionSchema = z.object({
  thinking: z
    .string()
    .describe("Brief reasoning about whether page numbers are present"),
  hasPageNumbers: z
    .boolean()
    .describe("Whether the TOC contains printed page numbers"),
});

/**
 * Determines whether a detected table of contents contains printed
 * page numbers next to its entries, which controls whether Stage 3
 * uses page-number offset math (Mode 1) or fuzzy matching (Mode 2).
 */
export class TocPageNumberDetector {
  constructor(private readonly llm: ILlm) {}

  async hasPageNumbers(
    pages: PageList,
    tocIndices: number[],
  ): Promise<boolean> {
    if (tocIndices.length === 0) return false;

    const tocText = tocIndices.map((i) => pages[i].text).join("\n\n");

    const prompt = `
You are a document structure analyst.
Below is the table of contents extracted from a document.

Determine whether this table of contents contains printed page numbers
next to the section/chapter entries.

## Table of Contents text:

${tocText}`.trim();

    const result = await this.llm.callWithStructuredOutput(
      prompt,
      pageNumberDetectionSchema,
    );
    return result.hasPageNumbers;
  }
}
