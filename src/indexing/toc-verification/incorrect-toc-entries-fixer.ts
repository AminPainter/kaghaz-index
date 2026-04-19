import { z } from "zod";
import type { ILlm } from "../../shared/llm/llm.interface";
import type { PageList, ResolvedTocEntry } from "../types";
import type { TocVerificationReport } from "./toc-verification-report";

const fixResultSchema = z.object({
  thinking: z
    .string()
    .describe("Brief reasoning about which page the section starts on"),
  physicalIndex: z
    .number()
    .int()
    .describe("The 0-based physical page index where this section starts"),
});

/**
 * Repairs incorrect TOC entries by narrowing the search space using
 * the nearest correct neighbours as page-range anchors, then asking
 * an LLM to fix each entry's page mapping within that reduced range.
 */
export class IncorrectTocEntriesFixer {
  constructor(private readonly llm: ILlm) {}

  async fix(args: {
    tocEntries: ResolvedTocEntry[];
    report: TocVerificationReport;
    pages: PageList;
  }): Promise<ResolvedTocEntry[]> {
    const { tocEntries, report, pages } = args;
    const tocEntriesCopy = this.cloneEntries(tocEntries);

    const incorrectIndices = [...report.incorrectIndices];
    const entryFixTasks = incorrectIndices.map((index) =>
      this.fixEntry({
        tocEntries: tocEntriesCopy,
        entryIndex: index,
        report,
        pages,
      }),
    );

    const fixedEntries = await Promise.all(entryFixTasks);

    for (let i = 0; i < incorrectIndices.length; i++) {
      tocEntriesCopy[incorrectIndices[i]] = fixedEntries[i];
    }

    return tocEntriesCopy;
  }

  private async fixEntry(args: {
    tocEntries: ResolvedTocEntry[];
    entryIndex: number;
    report: TocVerificationReport;
    pages: PageList;
  }): Promise<ResolvedTocEntry> {
    const { tocEntries, entryIndex, report, pages } = args;
    const entry = tocEntries[entryIndex];
    const [leftBound, rightBound] = this.findNeighborBounds(
      entryIndex,
      report,
      tocEntries,
      pages.length,
    );

    const taggedText = this.buildTaggedPageText(pages, leftBound, rightBound);

    const prompt = this.buildPrompt({
      entry,
      leftBound,
      rightBound,
      taggedText,
    });

    const result = await this.llm.callWithStructuredOutput(
      prompt,
      fixResultSchema,
    );

    return { ...entry, physicalIndex: result.physicalIndex };
  }

  private findNeighborBounds(
    entryIndex: number,
    report: TocVerificationReport,
    tocEntries: ResolvedTocEntry[],
    totalPages: number,
  ): [number, number] {
    let leftBound = 0;
    for (let i = entryIndex - 1; i >= 0; i--) {
      if (report.correctIndices.has(i)) {
        leftBound = tocEntries[i].physicalIndex;
        break;
      }
    }

    let rightBound = totalPages - 1;
    for (let i = entryIndex + 1; i < tocEntries.length; i++) {
      if (report.correctIndices.has(i)) {
        rightBound = tocEntries[i].physicalIndex;
        break;
      }
    }

    return [leftBound, rightBound];
  }

  private buildPrompt(args: {
    entry: ResolvedTocEntry;
    leftBound: number;
    rightBound: number;
    taggedText: string;
  }): string {
    const { entry, leftBound, rightBound, taggedText } = args;

    return `
You are a document structure analyst.

The section titled "${entry.title}" (section number: "${entry.headingLabel}") should start somewhere between physical page ${leftBound} and physical page ${rightBound}. Below are the texts of those pages, each wrapped in a tag indicating its 0-based physical page index.

On which physical page does this section begin?

## Pages:

${taggedText}`.trim();
  }

  private buildTaggedPageText(
    pages: PageList,
    start: number,
    end: number,
  ): string {
    let tagged = "";
    for (let i = start; i <= end; i++) {
      tagged += `<physical_index_${i}>\n${pages[i].text}\n</physical_index_${i}>\n\n`;
    }
    return tagged;
  }

  private cloneEntries(entries: ResolvedTocEntry[]): ResolvedTocEntry[] {
    // TODO: Add lodash dependency and use _.cloneDeep for better safety
    return entries.map((entry) => ({ ...entry }));
  }
}
