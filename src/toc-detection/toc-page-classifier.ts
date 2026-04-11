import { z } from "zod";
import type { ILlm } from "../types";

const tocClassificationSchema = z.object({
  thinking: z
    .string()
    .describe("Brief reasoning about whether this page is a TOC"),
  tocDetected: z
    .boolean()
    .describe("Whether the page is a table of contents or not"),
});

/**
 * Classifies a single PDF page as a table of contents page or not
 * by prompting an LLM with the page's text content.
 */
export class TocPageClassifier {
  constructor(private readonly llm: ILlm) {}

  async isTocPage(pageText: string, pageIndex: number): Promise<boolean> {
    const prompt = this.buildPrompt(pageText, pageIndex);
    const result = await this.llm.callWithStructuredOutput(
      prompt,
      tocClassificationSchema,
    );
    return result.tocDetected;
  }

  private buildPrompt(pageText: string, pageIndex: number): string {
    return `
You are a document structure analyst.
Your job is to detect if there is a table of contents provided in the given text.

Important rules:
- A table of contents lists chapter/section titles, often with page numbers.
- An abstract, summary, notation list, figure list, table list, glossary,
  or list of abbreviations is NOT a table of contents.

## Here is the text from page ${pageIndex}:

${pageText}`.trim();
  }
}
