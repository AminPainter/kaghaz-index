import type { PageList } from "../types";
import type { TocPageClassifier } from "./toc-page-classifier";

const DEFAULT_SCAN_RANGE = 15;

/**
 * Scans the first N pages of a document and identifies the first
 * contiguous block of table of contents pages.
 */
export class TocBlockFinder {
  constructor(
    private readonly classifier: TocPageClassifier,
    private readonly scanRange: number = DEFAULT_SCAN_RANGE,
  ) {}

  async find(pages: PageList): Promise<number[]> {
    const scanLimit = Math.min(pages.length, this.scanRange);
    const firstTocPageIndex = await this.findFirstTocPageIndex(
      pages,
      scanLimit,
    );

    if (firstTocPageIndex === -1) return [];

    return this.collectConsecutiveTocPagesIndices(
      pages,
      firstTocPageIndex,
      scanLimit,
    );
  }

  private async findFirstTocPageIndex(
    pages: PageList,
    scanLimit: number,
  ): Promise<number> {
    for (let i = 0; i < scanLimit; i++) {
      if (await this.classifier.isTocPage(pages[i].text, i)) return i;
    }

    return -1;
  }

  private async collectConsecutiveTocPagesIndices(
    pages: PageList,
    firstTocPageIndex: number,
    scanLimit: number,
  ): Promise<number[]> {
    const tocPageIndices: number[] = [firstTocPageIndex];

    for (let i = firstTocPageIndex + 1; i < scanLimit; i++) {
      if (!(await this.classifier.isTocPage(pages[i].text, i))) break;
      tocPageIndices.push(i);
    }

    return tocPageIndices;
  }
}
