import { z } from "zod";
import type { ILlm, PageList, PrintedTocEntry } from "../types";

const rawTocEntrySchema = z.object({
  entries: z.array(
    z.object({
      headingLabel: z
        .string()
        .describe(
          "Section numbering such as '1', '1.1', '2.3.4', or 'A' for appendices",
        ),
      title: z.string().describe("Title of the section or chapter"),
      page: z
        .number()
        .int()
        .describe("Printed page number shown in the TOC"),
    }),
  ),
});

/**
 * Extracts structured TOC entries from raw TOC page text by asking an
 * LLM to parse section numbers, titles, and printed page numbers.
 */
export class TocEntryExtractor {
  constructor(private readonly llm: ILlm) {}

  async extract(
    pages: PageList,
    tocPageIndices: number[],
  ): Promise<PrintedTocEntry[]> {
    const tocText = tocPageIndices.map((i) => pages[i].text).join("\n\n");

    const prompt = `
You are a document structure analyst.
Below is the table of contents extracted from a document.

Parse every entry into structured JSON. Each entry must have:
- "headingLabel": the section number (e.g. "1", "1.1", "2.3", "A.1"). If no number exists, use an empty string.
- "title": the section or chapter title.
- "page": the printed page number shown next to the entry.

Preserve the exact hierarchy from the TOC. Include all entries, even sub-sections.

## Table of Contents text:

${tocText}`.trim();

    const result = await this.llm.callWithStructuredOutput(
      prompt,
      rawTocEntrySchema,
    );
    return result.entries;
  }
}
