import type {
  PageList,
  ResolvedTocEntry,
  TocEntryVerificationResult,
} from "../types";

import { TocVerificationReport } from "./toc-verification-report";
import type { TitleAppearanceChecker } from "./title-appearance-checker";

type VerificationTask = () => Promise<TocEntryVerificationResult>;

/**
 * Verifies all TOC entries concurrently by checking whether each entry's
 * title actually appears on the page it maps to. Produces an aggregate
 * accuracy score and categorises entries as correct or incorrect.
 * Concurrency and rate limiting are delegated to the ILlm implementation.
 */
export class TocVerifier {
  constructor(
    private readonly titleAppearanceChecker: TitleAppearanceChecker,
  ) {}

  async verify(
    tocEntries: ResolvedTocEntry[],
    pages: PageList,
  ): Promise<TocVerificationReport> {
    if (tocEntries.length === 0) return TocVerificationReport.empty();

    const results = await this.runAll(tocEntries, pages);

    const correctIndices = new Set<number>();
    const incorrectIndices = new Set<number>();

    for (const result of results) {
      if (result.isCorrect) {
        correctIndices.add(result.entryIndex);
      } else {
        incorrectIndices.add(result.entryIndex);
      }
    }

    return new TocVerificationReport({
      accuracy: correctIndices.size / results.length,
      results,
      correctIndices,
      incorrectIndices,
    });
  }

  private async runAll(
    tocEntries: ResolvedTocEntry[],
    pages: PageList,
  ): Promise<TocEntryVerificationResult[]> {
    const tasks = this.buildVerificationTasks(tocEntries, pages);
    const results = await Promise.all(tasks.map((taskFn) => taskFn()));
    return this.sortByEntryIndex(results);
  }

  private sortByEntryIndex(
    results: TocEntryVerificationResult[],
  ): TocEntryVerificationResult[] {
    return results.sort((a, b) => a.entryIndex - b.entryIndex);
  }

  private buildVerificationTasks(
    tocEntries: ResolvedTocEntry[],
    pages: PageList,
  ): VerificationTask[] {
    const taskPromises = tocEntries.map((entry, i) => async () => {
      if (this.isEntryOutOfBounds(entry, pages)) {
        return {
          entryIndex: i,
          entry,
          isCorrect: false,
          reasoning: "Physical index out of bounds",
        };
      }

      return this.titleAppearanceChecker.check({
        entry,
        entryIndex: i,
        pageText: pages[entry.physicalIndex].text,
      });
    });

    return taskPromises;
  }

  private isEntryOutOfBounds(
    entry: ResolvedTocEntry,
    pages: PageList,
  ): boolean {
    return entry.physicalIndex < 0 || entry.physicalIndex >= pages.length;
  }
}
