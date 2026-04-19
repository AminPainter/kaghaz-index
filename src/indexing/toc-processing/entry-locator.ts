import { z } from "zod";
import type { ILlm } from "../../shared/llm/llm.interface";
import type { PageList, PrintedTocEntry } from "../types";

const DEFAULT_BUFFER_BEFORE = 5;
const DEFAULT_BUFFER_AFTER = 15;

const locateResultSchema = z.object({
  thinking: z
    .string()
    .describe("Brief reasoning about which page the section starts on"),
  physicalIndex: z
    .number()
    .int()
    .describe("The 0-based physical page index where this section starts"),
});

/**
 * Locates a single TOC entry's starting physical page by presenting
 * a window of candidate pages to an LLM and asking it to identify
 * which page the section begins on.
 */
export class EntryLocator {
  constructor(
    private readonly llm: ILlm,
    private readonly bufferBefore: number = DEFAULT_BUFFER_BEFORE,
    private readonly bufferAfter: number = DEFAULT_BUFFER_AFTER,
  ) {}

  async locate(entry: PrintedTocEntry, pages: PageList): Promise<number> {
    const windowStart = Math.max(0, entry.page - this.bufferBefore);
    const windowEnd = Math.min(pages.length, entry.page + this.bufferAfter);

    let taggedText = "";
    for (let i = windowStart; i < windowEnd; i++) {
      taggedText += `<physical_index_${i}>\n${pages[i].text}\n</physical_index_${i}>\n\n`;
    }

    const prompt = `
You are a document structure analyst.
Below are several consecutive pages from a PDF. Each page is wrapped in a tag indicating its 0-based physical page index.

Find the page where the following section begins:
- Title: "${entry.title}"
- Section number: "${entry.headingLabel}"

Return the physical page index (the number in the tag) where this section starts.

## Pages:

${taggedText}`.trim();

    const result = await this.llm.callWithStructuredOutput(
      prompt,
      locateResultSchema,
    );
    return result.physicalIndex;
  }
}
