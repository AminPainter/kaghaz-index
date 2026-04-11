import { TocMode } from "../types";
import type { PageList, TocDetectionResult } from "../types";
import type { TocBlockFinder } from "./toc-block-finder";
import type { TocPageNumberDetector } from "./toc-page-number-detector";

/**
 * Stage 2 entry point. Orchestrates Table of Contents (TOC) detection by finding the
 * contiguous TOC block and checking for page numbers, then returns
 * the processing mode (1, 2, or 3) that Stage 3 should use.
 */
export class TocDetector {
  constructor(
    private readonly blockFinder: TocBlockFinder,
    private readonly pageNumberDetector: TocPageNumberDetector,
  ) {}

  async detect(pages: PageList): Promise<TocDetectionResult> {
    const tocPageIndices = await this.blockFinder.find(pages);

    if (tocPageIndices.length === 0) {
      return { tocPageIndices: [], hasTocWithPageNumbers: false, mode: TocMode.SyntheticToc };
    }

    const hasTocWithPageNumbers = await this.pageNumberDetector.hasPageNumbers(
      pages,
      tocPageIndices,
    );

    return {
      tocPageIndices,
      hasTocWithPageNumbers,
      mode: hasTocWithPageNumbers ? TocMode.PageNumberOffset : TocMode.FuzzyMatch,
    };
  }
}
