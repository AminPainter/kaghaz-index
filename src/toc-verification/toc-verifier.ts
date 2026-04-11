import type {
  PageList,
  ResolvedTocEntry,
  TocEntryVerificationResult,
} from "../types";

import { TocVerificationReport } from "./toc-verification-report";
import type { TitleAppearanceChecker } from "./title-appearance-checker";

type VerificationTask = () => Promise<TocEntryVerificationResult>;

const DEFAULT_CONCURRENCY = 10;

/**
 * Verifies all TOC entries concurrently by checking whether each entry's
 * title actually appears on the page it maps to. Produces an aggregate
 * accuracy score and categorises entries as correct or incorrect.
 */
export class TocVerifier {
  constructor(
    private readonly titleAppearanceChecker: TitleAppearanceChecker,
    private readonly concurrency: number = DEFAULT_CONCURRENCY,
  ) {}

  async verify(
    tocEntries: ResolvedTocEntry[],
    pages: PageList,
  ): Promise<TocVerificationReport> {
    if (tocEntries.length === 0) return TocVerificationReport.empty();

    const results = await this.runWithConcurrencyLimit(tocEntries, pages);

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

  private async runWithConcurrencyLimit(
    tocEntries: ResolvedTocEntry[],
    pages: PageList,
  ): Promise<TocEntryVerificationResult[]> {
    const tasks = this.buildVerificationTasks(tocEntries, pages);

    const results = await this.runTasksInBatches(tasks);

    return this.sortByEntryIndex(results);
  }

  private sortByEntryIndex(
    results: TocEntryVerificationResult[],
  ): TocEntryVerificationResult[] {
    return results.sort((a, b) => a.entryIndex - b.entryIndex);
  }

  private async runTasksInBatches(
    tasks: VerificationTask[],
  ): Promise<TocEntryVerificationResult[]> {
    const results: TocEntryVerificationResult[] = [];

    for (let i = 0; i < tasks.length; i += this.concurrency) {
      const batch = tasks.slice(i, i + this.concurrency);

      // Each batch must fully complete before the next batch starts
      // this caps the number of concurrent LLM calls to avoid overwhelming the provider
      const batchResults = await Promise.all(batch.map((taskFn) => taskFn()));
      results.push(...batchResults);
    }

    return results;
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
