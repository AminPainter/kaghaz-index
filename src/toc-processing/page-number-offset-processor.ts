import type { PageList, ResolvedTocEntry } from "../types";
import type { TocEntryExtractor } from "./toc-entry-extractor";
import type { OffsetDetector } from "./offset-detector";

/**
 * Stage 3 Mode 1 orchestrator. Processes a TOC that contains printed
 * page numbers by extracting structured entries, detecting the offset
 * between printed and physical page numbers, then applying that offset
 * to produce final physical page indices.
 */
export class PageNumberOffsetProcessor {
  constructor(
    private readonly extractor: TocEntryExtractor,
    private readonly offsetDetector: OffsetDetector,
  ) {}

  async process(
    pages: PageList,
    tocPageIndices: number[],
  ): Promise<ResolvedTocEntry[]> {
    const rawEntries = await this.extractor.extract(pages, tocPageIndices);
    const offset = await this.offsetDetector.detect(rawEntries, pages);

    return rawEntries.map((entry) => ({
      headingLabel: entry.headingLabel,
      title: entry.title,
      physicalIndex: entry.page + offset,
    }));
  }
}
